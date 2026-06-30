import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errMessage, formatINR, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { Plus, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Admin" }] }),
  component: AdminSubscriptionsPage,
});

type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];
type Sub = Database["public"]["Tables"]["subscriptions"]["Row"];

function AdminSubscriptionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"plans" | "subs">("plans");

  const plansQ = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  const subsQ = useQuery({
    queryKey: ["admin", "subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Sub[];
    },
  });

  const [form, setForm] = useState({ 
    code: "", name: "", price_inr: "0", description: "", features: "",
    badge: "", cta_text: "", cta_url: "", trial_days: "0", highlighted: false 
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      if (!form.code || !form.name) throw new Error("Code and name required");
      const features = form.features
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const { error, data } = await supabase
        .from("subscription_plans")
        .insert({
          code: form.code,
          name: form.name,
          description: form.description || null,
          price_inr: Number(form.price_inr) || 0,
          features,
          badge: form.badge || null,
          cta_text: form.cta_text || null,
          cta_url: form.cta_url || null,
          trial_days: Number(form.trial_days) || 0,
          highlighted: form.highlighted,
        })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({ action: "plan.create", resource: "subscription_plans", resource_id: data.id, after: data });
    },
    onSuccess: () => {
      setForm({ 
        code: "", name: "", price_inr: "0", description: "", features: "",
        badge: "", cta_text: "", cta_url: "", trial_days: "0", highlighted: false 
      });
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      toast.success("Plan created");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const togglePlan = useMutation({
    mutationFn: async (p: Plan) => {
      const { error } = await supabase.from("subscription_plans").update({ is_active: !p.is_active }).eq("id", p.id);
      if (error) throw error;
      await logAdminAction({ action: "plan.toggle", resource: "subscription_plans", resource_id: p.id, after: { is_active: !p.is_active } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const deletePlan = useMutation({
    mutationFn: async (p: Plan) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", p.id);
      if (error) throw error;
      await logAdminAction({ action: "plan.delete", resource: "subscription_plans", resource_id: p.id, before: p });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const plans = plansQ.data ?? [];
  const subs = subsQ.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">Manage plans and view active subscriptions.</p>
      </header>

      <div className="flex gap-2 border-b border-slate-200">
        {(["plans", "subs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "border-b-2 px-3 py-2 text-sm font-medium " +
              (tab === t
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900")
            }
          >
            {t === "plans" ? "Plans" : "Subscriptions"}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">New plan</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Input placeholder="Code (e.g. pro)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input type="number" placeholder="Price INR" value={form.price_inr} onChange={(e) => setForm({ ...form, price_inr: e.target.value })} />
              <Input placeholder="Badge (e.g. Most Popular)" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Input placeholder="CTA Text (e.g. Start Trial)" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
              <Input placeholder="CTA URL (e.g. /register)" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
              <Input type="number" placeholder="Trial Days" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="highlight" checked={form.highlighted} onChange={(e) => setForm({ ...form, highlighted: e.target.checked })} />
                <label htmlFor="highlight" className="text-sm">Highlight as Pro tier</label>
              </div>
            </div>
            <Input className="mt-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Textarea className="mt-3" placeholder="Features, one per line" rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            <Button className="mt-3" onClick={() => createPlan.mutate()} disabled={createPlan.isPending}>
              <Plus className="h-4 w-4 mr-2" /> Add plan
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-16">Sort</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold flex items-center gap-2">
                        {p.name}
                        {p.highlighted && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Pro</span>}
                        {p.badge && <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded border border-slate-200">{p.badge}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{p.code}</div>
                    </td>
                    <td className="px-4 py-3">{formatINR(p.price_inr)} / {p.interval}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePlan.mutate(p)}
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest " +
                          (p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")
                        }
                      >
                        {p.is_active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => {
                        const newSort = prompt("Enter new sort order (current: " + p.sort_order + ")", p.sort_order.toString());
                        if (newSort !== null && !isNaN(Number(newSort))) {
                          supabase.from("subscription_plans").update({ sort_order: Number(newSort) }).eq("id", p.id).then(() => qc.invalidateQueries({ queryKey: ["admin", "plans"] }));
                        }
                      }}>
                        Reorder
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => {
                        if(confirm("Delete this plan?")) deletePlan.mutate(p);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "subs" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Renews</th>
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No subscriptions yet.</td></tr>
              )}
              {subs.map((s) => {
                const plan = plans.find((p) => p.id === s.plan_id);
                return (
                  <tr key={s.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-mono text-xs">{s.user_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{plan?.name ?? "—"}</td>
                    <td className="px-4 py-3">{s.status}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(s.started_at)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
