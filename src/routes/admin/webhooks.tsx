import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { Plus, Trash2, Webhook } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — Admin" }] }),
  component: WebhooksPage,
});

type Hook = Database["public"]["Tables"]["webhooks"]["Row"];

const EVENTS = [
  "listing.created",
  "listing.approved",
  "listing.rejected",
  "kyc.submitted",
  "kyc.verified",
  "user.registered",
  "subscription.activated",
  "subscription.canceled",
];

function WebhooksPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" });

  const hooksQ = useQuery({
    queryKey: ["admin", "webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Hook[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.url.trim()) throw new Error("Name and URL required");
      if (form.events.length === 0) throw new Error("Pick at least one event");
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          name: form.name,
          url: form.url,
          events: form.events,
          secret: form.secret || null,
          created_by: u.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({ action: "webhook.create", resource: "webhooks", resource_id: data.id, after: data });
    },
    onSuccess: () => {
      setForm({ name: "", url: "", events: [], secret: "" });
      qc.invalidateQueries({ queryKey: ["admin", "webhooks"] });
      toast.success("Webhook saved");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: async (h: Hook) => {
      const { error } = await supabase.from("webhooks").update({ is_active: !h.is_active }).eq("id", h.id);
      if (error) throw error;
      await logAdminAction({ action: "webhook.toggle", resource: "webhooks", resource_id: h.id, after: { is_active: !h.is_active } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (h: Hook) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", h.id);
      if (error) throw error;
      await logAdminAction({ action: "webhook.delete", resource: "webhooks", resource_id: h.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  function toggleEvent(ev: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Webhooks</h1>
        <p className="mt-1 text-sm text-slate-500">Send platform events to external endpoints.</p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">New webhook</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="https://example.com/hook" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <Input className="mt-3" placeholder="Signing secret (optional)" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} />
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Events</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVENTS.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (form.events.includes(ev)
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-500")
                }
              >
                {ev}
              </button>
            ))}
          </div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="h-4 w-4" /> Save webhook
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">URL</th>
              <th className="px-4 py-3">Events</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(hooksQ.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500"><Webhook className="mx-auto mb-2 h-6 w-6" /> No webhooks configured.</td></tr>
            )}
            {(hooksQ.data ?? []).map((h) => (
              <tr key={h.id} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3 font-semibold">{h.name}</td>
                <td className="px-4 py-3 max-w-[260px] truncate font-mono text-xs">{h.url}</td>
                <td className="px-4 py-3 text-xs">{(h.events ?? []).join(", ")}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(h.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle.mutate(h)}
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest " +
                      (h.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")
                    }
                  >
                    {h.is_active ? "On" : "Off"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(h)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
