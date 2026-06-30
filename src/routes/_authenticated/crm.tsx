import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Briefcase, Users as UsersIcon, Activity as ActivityIcon } from "lucide-react";
import { errMessage, formatINR, relativeTime } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM — BrokersConnect" }] }),
  component: CRMPage,
});

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Deal = Database["public"]["Tables"]["deals"]["Row"];
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];
type DealStage = Database["public"]["Enums"]["deal_stage"];

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const DEAL_STAGES: DealStage[] = ["prospect", "site_visit", "offer", "agreement", "closed_won", "closed_lost"];

function CRMPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"leads" | "deals" | "activities">("leads");

  const leadsQ = useQuery({
    queryKey: ["crm", "leads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const dealsQ = useQuery({
    queryKey: ["crm", "deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Deal[];
    },
  });

  const activitiesQ = useQuery({
    queryKey: ["crm", "activities", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });

  // Lead form
  const [leadForm, setLeadForm] = useState({ full_name: "", phone: "", city: "", requirement: "" });
  const createLead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!leadForm.full_name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("leads").insert({ owner_id: user.id, ...leadForm });
      if (error) throw error;
    },
    onSuccess: () => {
      setLeadForm({ full_name: "", phone: "", city: "", requirement: "" });
      qc.invalidateQueries({ queryKey: ["crm", "leads"] });
      toast.success("Lead added");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", "leads"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  // Deal form
  const [dealForm, setDealForm] = useState({ title: "", value: "", expected_close_date: "" });
  const createDeal = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!dealForm.title.trim()) throw new Error("Title required");
      const payload = {
        owner_id: user.id,
        title: dealForm.title,
        value: dealForm.value ? Number(dealForm.value) : null,
        expected_close_date: dealForm.expected_close_date || null,
      };
      const { error } = await supabase.from("deals").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setDealForm({ title: "", value: "", expected_close_date: "" });
      qc.invalidateQueries({ queryKey: ["crm", "deals"] });
      toast.success("Deal added");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", "deals"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  // Activity form
  const [actForm, setActForm] = useState({ subject: "", body: "" });
  const createActivity = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!actForm.subject.trim()) throw new Error("Subject required");
      const { error } = await supabase.from("activities").insert({
        owner_id: user.id,
        type: "note",
        subject: actForm.subject,
        body: actForm.body || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setActForm({ subject: "", body: "" });
      qc.invalidateQueries({ queryKey: ["crm", "activities"] });
      toast.success("Activity logged");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const leads = leadsQ.data ?? [];
  const deals = dealsQ.data ?? [];
  const activities = activitiesQ.data ?? [];

  const stats = {
    pipeline: deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0),
    won: deals.filter((d) => d.stage === "closed_won").reduce((s, d) => s + Number(d.value || 0), 0),
    leadCount: leads.length,
    openLeads: leads.filter((l) => !["won", "lost"].includes(l.status)).length,
  };

  return (
    <div className="container-tight space-y-8 px-6 py-10">
      <div>
        <div className="eyebrow">Workspace</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your leads, deals and follow-ups.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Open leads" value={String(stats.openLeads)} sub={`${stats.leadCount} total`} />
        <StatBlock label="Pipeline" value={formatINR(stats.pipeline)} sub="Active deals" />
        <StatBlock label="Won" value={formatINR(stats.won)} sub="Closed deals" />
        <StatBlock label="Activities" value={String(activities.length)} sub="Last 100" />
      </div>

      <div className="flex gap-2 border-b border-hairline">
        {(["leads", "deals", "activities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "border-b-2 px-3 py-2 text-sm font-medium capitalize " +
              (tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "leads" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-hairline bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
              <Input placeholder="Full name *" value={leadForm.full_name} onChange={(e) => setLeadForm({ ...leadForm, full_name: e.target.value })} />
              <Input placeholder="Phone" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
              <Input placeholder="City" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} />
              <Input placeholder="Requirement" value={leadForm.requirement} onChange={(e) => setLeadForm({ ...leadForm, requirement: e.target.value })} />
              <Button onClick={() => createLead.mutate()} disabled={createLead.isPending}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {leads.length === 0 ? (
            <Empty icon={UsersIcon} label="No leads yet. Add your first one above." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-hairline">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t border-hairline">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{l.full_name}</div>
                        {l.requirement && <div className="text-xs text-muted-foreground">{l.requirement}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">{l.phone || l.email || "—"}</td>
                      <td className="px-4 py-3 text-xs">{l.city || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => updateLeadStatus.mutate({ id: l.id, status: e.target.value as LeadStatus })}
                          className="rounded border border-hairline bg-background px-2 py-1 text-xs"
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{relativeTime(l.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteLead.mutate(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "deals" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-hairline bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <Input placeholder="Deal title *" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} />
              <Input type="number" placeholder="Value (₹)" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} />
              <Input type="date" value={dealForm.expected_close_date} onChange={(e) => setDealForm({ ...dealForm, expected_close_date: e.target.value })} />
              <Button onClick={() => createDeal.mutate()} disabled={createDeal.isPending}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {deals.length === 0 ? (
            <Empty icon={Briefcase} label="No deals yet." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {deals.map((d) => (
                <div key={d.id} className="rounded-xl border border-hairline bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{d.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {d.expected_close_date ? `Close by ${new Date(d.expected_close_date).toLocaleDateString()}` : "No date"}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteDeal.mutate(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-tight">{formatINR(d.value)}</div>
                  <select
                    value={d.stage}
                    onChange={(e) => updateDealStage.mutate({ id: d.id, stage: e.target.value as DealStage })}
                    className="mt-3 w-full rounded border border-hairline bg-background px-2 py-1.5 text-xs"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "activities" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-hairline bg-card p-4 space-y-3">
            <Input placeholder="Subject *" value={actForm.subject} onChange={(e) => setActForm({ ...actForm, subject: e.target.value })} />
            <Textarea placeholder="Notes" rows={3} value={actForm.body} onChange={(e) => setActForm({ ...actForm, body: e.target.value })} />
            <Button onClick={() => createActivity.mutate()} disabled={createActivity.isPending}>
              <Plus className="h-4 w-4" /> Log activity
            </Button>
          </div>

          {activities.length === 0 ? (
            <Empty icon={ActivityIcon} label="Nothing logged yet." />
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.id} className="rounded-lg border border-hairline bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{a.subject}</div>
                      {a.body && <div className="mt-1 text-xs text-muted-foreground">{a.body}</div>}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{relativeTime(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Empty({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-card p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
