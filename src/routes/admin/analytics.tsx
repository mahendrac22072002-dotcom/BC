import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { BarChart3, Building2, CheckCircle2, CreditCard, Users } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const stats = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

      const [users, verified, listings, listingsLive, leads, deals, subsRows] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "verified"),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id, value, stage"),
        supabase.from("subscriptions").select("id, plan_id, status, started_at, current_period_end"),
      ]);

      const [newUsers7, newListings7] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", since30),
      ]);

      const dealsAll = (deals.data ?? []) as Array<{ value: number | null; stage: string }>;
      const subsAll = (subsRows.data ?? []) as Array<{ status: string; plan_id: string }>;

      const wonValue = dealsAll
        .filter((d) => d.stage === "closed_won")
        .reduce((s, d) => s + Number(d.value || 0), 0);
      const pipelineValue = dealsAll
        .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
        .reduce((s, d) => s + Number(d.value || 0), 0);

      const activeSubs = subsAll.filter((s) => s.status === "active").length;

      return {
        userCount: users.count ?? 0,
        verifiedCount: verified.count ?? 0,
        listingCount: listings.count ?? 0,
        liveListings: listingsLive.count ?? 0,
        leadCount: leads.count ?? 0,
        newUsers7: newUsers7.count ?? 0,
        newListings30: newListings7.count ?? 0,
        wonValue,
        pipelineValue,
        activeSubs,
        totalSubs: subsAll.length,
      };
    },
  });

  const s = stats.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Live platform metrics.</p>
      </header>

      {!s ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={Users} label="Total users" value={String(s.userCount)} sub={`${s.newUsers7} new this week`} />
            <Tile icon={CheckCircle2} label="Verified brokers" value={String(s.verifiedCount)} sub={`${s.userCount ? Math.round((s.verifiedCount / s.userCount) * 100) : 0}% of users`} />
            <Tile icon={Building2} label="Live listings" value={String(s.liveListings)} sub={`${s.listingCount} total`} />
            <Tile icon={CreditCard} label="Active subs" value={String(s.activeSubs)} sub={`${s.totalSubs} all-time`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <BarChart3 className="h-4 w-4" /> Pipeline
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight">{formatINR(s.pipelineValue)}</div>
              <p className="mt-1 text-sm text-slate-500">Active deals across the platform.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <BarChart3 className="h-4 w-4" /> Won (closed)
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight">{formatINR(s.wonValue)}</div>
              <p className="mt-1 text-sm text-slate-500">Cumulative closed-won deal value.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Activity (30d)</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <div className="text-2xl font-bold">{s.newListings30}</div>
                <div className="text-slate-500">New listings</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{s.leadCount}</div>
                <div className="text-slate-500">Leads in CRM</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{s.newUsers7}</div>
                <div className="text-slate-500">New signups (7d)</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
