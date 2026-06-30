import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/forms/$id")({
  head: () => ({ meta: [{ title: "Edit Form — Admin" }] }),
  component: FormEditor,
});

type FieldType = "text" | "email" | "textarea" | "number" | "select" | "checkbox";
type Field = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
};
type FormRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  schema: unknown;
  notify_email: string | null;
  success_message: string;
  published: boolean;
  updated_at: string;
};
type Submission = {
  id: string;
  payload: Record<string, unknown>;
  submitter_email: string | null;
  created_at: string;
};

function FormEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { can } = usePermissions();
  const editable = can("forms", "manage");

  const [form, setForm] = useState<{
    name: string; slug: string; description: string;
    notify_email: string; success_message: string; published: boolean;
    schema: Field[];
  } | null>(null);

  const q = useQuery({
    queryKey: ["admin", "form", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("forms").select("*").eq("id", id).single();
      if (error) throw error;
      return data as FormRow;
    },
  });

  const subsQ = useQuery({
    queryKey: ["admin", "form_subs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id,payload,submitter_email,created_at")
        .eq("form_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });

  useEffect(() => {
    if (q.data && !form) {
      const schema = Array.isArray(q.data.schema) ? (q.data.schema as Field[]) : [];
      setForm({
        name: q.data.name,
        slug: q.data.slug,
        description: q.data.description ?? "",
        notify_email: q.data.notify_email ?? "",
        success_message: q.data.success_message,
        published: q.data.published,
        schema,
      });
    }
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase.from("forms").update({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        notify_email: form.notify_email.trim() || null,
        success_message: form.success_message.trim() || "Thanks — we received your submission.",
        published: form.published,
        schema: form.schema as never,
      }).eq("id", id);
      if (error) throw error;
      await logAdminAction({ action: "form.update", resource: "forms", resource_id: id, after: form });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "form", id] });
      qc.invalidateQueries({ queryKey: ["admin", "forms"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  function addField() {
    if (!form) return;
    const n = form.schema.length + 1;
    setForm({ ...form, schema: [...form.schema, { key: `field_${n}`, label: `Field ${n}`, type: "text", required: false }] });
  }
  function updateField(i: number, patch: Partial<Field>) {
    if (!form) return;
    const next = form.schema.slice();
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, schema: next });
  }
  function removeField(i: number) {
    if (!form) return;
    setForm({ ...form, schema: form.schema.filter((_, idx) => idx !== i) });
  }

  if (q.isPending || !form) {
    return <div className="px-5 py-12 text-center text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1">
          <Link to="/admin/forms"><ArrowLeft className="h-3.5 w-3.5" /> Forms</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{form.name || "Untitled form"}</h1>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
          form.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
        }`}>
          {form.published ? "Published" : "Draft"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!editable}
            onClick={() => setForm({ ...form, published: !form.published })}
          >
            {form.published ? "Unpublish" : "Publish"}
          </Button>
          <Button disabled={!editable || save.isPending} onClick={() => save.mutate()} className="gap-1.5 bg-slate-900 hover:bg-slate-800">
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Name</Label>
              <Input value={form.name} disabled={!editable} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Slug</Label>
              <Input value={form.slug} disabled={!editable} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea rows={2} value={form.description} disabled={!editable} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Notify email</Label>
              <Input type="email" value={form.notify_email} disabled={!editable} onChange={(e) => setForm({ ...form, notify_email: e.target.value })} placeholder="ops@brokersconnect.in" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Success message</Label>
              <Input value={form.success_message} disabled={!editable} onChange={(e) => setForm({ ...form, success_message: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Fields</h2>
              <Button size="sm" variant="outline" disabled={!editable} onClick={addField} className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Add field
              </Button>
            </div>
            {form.schema.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500">
                No fields yet — add a text, email, or textarea field to start collecting input.
              </div>
            ) : (
              <ul className="space-y-2">
                {form.schema.map((f, i) => (
                  <li key={i} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_140px_auto_auto]">
                    <Input value={f.key} disabled={!editable} onChange={(e) => updateField(i, { key: e.target.value })} placeholder="key" className="h-8" />
                    <Input value={f.label} disabled={!editable} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="Label" className="h-8" />
                    <select
                      value={f.type}
                      disabled={!editable}
                      onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <label className="flex items-center gap-1 self-center text-xs">
                      <input type="checkbox" checked={f.required} disabled={!editable} onChange={(e) => updateField(i, { required: e.target.checked })} />
                      Req
                    </label>
                    <Button size="sm" variant="outline" disabled={!editable} className="h-8 px-2 text-red-600 hover:bg-red-50" onClick={() => removeField(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Recent submissions</h2>
            <p className="text-xs text-slate-500">{subsQ.data?.length ?? 0} shown · most recent first</p>
          </div>
          {subsQ.isPending ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Loading…</div>
          ) : (subsQ.data ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">No submissions yet.</div>
          ) : (
            <ul className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
              {(subsQ.data ?? []).map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{s.submitter_email ?? "Anonymous"}</span>
                    <span>{relativeTime(s.created_at)}</span>
                  </div>
                  <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-[11px] leading-snug text-slate-700">
{JSON.stringify(s.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
