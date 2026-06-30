import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, FormInput } from "lucide-react";

export const Route = createFileRoute("/admin/forms")({
  head: () => ({ meta: [{ title: "Forms — Admin" }] }),
  component: FormsPage,
});

type FormRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  updated_at: string;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function FormsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { can } = usePermissions();
  const editable = can("forms", "manage");
  const [draft, setDraft] = useState({ name: "", slug: "" });

  const q = useQuery({
    queryKey: ["admin", "forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("id,slug,name,description,published,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FormRow[];
    },
  });

  const counts = useQuery({
    queryKey: ["admin", "form_submission_counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("form_submissions").select("form_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.form_id] = (map[r.form_id] ?? 0) + 1;
      return map;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const name = draft.name.trim();
      if (!name) throw new Error("Name required");
      const slug = (draft.slug.trim() || slugify(name));
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("forms").insert({
        name,
        slug,
        schema: [] as never,
        created_by: u.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      await logAdminAction({ action: "form.create", resource: "forms", resource_id: data.id, after: { name, slug } });
      return data.id as string;
    },
    onSuccess: (id) => {
      setDraft({ name: "", slug: "" });
      qc.invalidateQueries({ queryKey: ["admin", "forms"] });
      toast.success("Form created");
      nav({ to: "/admin/forms/$id", params: { id } });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms</h1>
          <p className="text-sm text-slate-500">Build forms and collect submissions from the public site.</p>
        </div>
      </div>

      {editable && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label className="text-xs font-semibold">Form name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Newsletter Signup" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Slug (optional)</Label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="newsletter" />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending} className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5" /> Create
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {q.isPending ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Loading…</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FormInput className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No forms yet</p>
            <p className="mt-1 text-xs text-slate-500">Create your first form to start collecting submissions.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(q.data ?? []).map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to="/admin/forms/$id" params={{ id: f.id }} className="text-sm font-medium text-slate-900 hover:underline">
                      {f.name}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      f.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {f.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    /{f.slug} · {(counts.data?.[f.id] ?? 0)} submissions · updated {relativeTime(f.updated_at)}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link to="/admin/forms/$id" params={{ id: f.id }}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
