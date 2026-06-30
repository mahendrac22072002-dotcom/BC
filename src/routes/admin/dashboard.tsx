import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — BrokersConnect" }] }),
  component: AdminDashboard,
});

type CountFilter = { col: string; op: "eq" | "gte" | "not_null"; val?: string };

async function countRows(
  table: "profiles" | "listings" | "kyc_documents",
  filters: CountFilter[] = [],
) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  for (const f of filters) {
    if (f.op === "eq") q = q.eq(f.col, f.val!);
    else if (f.op === "gte") q = q.gte(f.col, f.val!);
    else if (f.op === "not_null") q = q.not(f.col, "is", null);
  }
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const todayIso = new Date(Date.now() - 24 * 3600_000).toISOString();
      const [
        totalBrokers,
        verifiedBrokers,
        pendingKyc,
        rejectedKyc,
        pendingListings,
        approvedListings,
        rejectedListings,
        todaySignups,
        suspended,
        unreadContacts,
      ] = await Promise.all([
        countRows("profiles"),
        countRows("profiles", [{ col: "kyc_status", op: "eq", val: "verified" }]),
        countRows("profiles", [{ col: "kyc_status", op: "eq", val: "in_review" }]),
        countRows("profiles", [{ col: "kyc_status", op: "eq", val: "rejected" }]),
        countRows("listings", [{ col: "moderation_status", op: "eq", val: "pending" }]),
        countRows("listings", [{ col: "moderation_status", op: "eq", val: "approved" }]),
        countRows("listings", [{ col: "moderation_status", op: "eq", val: "rejected" }]),
        countRows("profiles", [{ col: "created_at", op: "gte", val: todayIso }]),
        countRows("profiles", [{ col: "suspended_at", op: "not_null" }]),
        countRows("contact_submissions" as any, [{ col: "status", op: "eq", val: "unread" }]),
      ]);
      return {
        totalBrokers,
        verifiedBrokers,
        pendingKyc,
        rejectedKyc,
        pendingListings,
        approvedListings,
        rejectedListings,
        todaySignups,
        suspended,
        unreadContacts,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["admin", "dashboard", "recent-signups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, firm, city, kyc_status, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const audit = useQuery({
    queryKey: ["admin", "dashboard", "recent-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, action, resource, resource_id, created_at, actor_id")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const recentContacts = useQuery({
    queryKey: ["admin", "dashboard", "recent-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, subject, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading = stats.isPending;
  const s = stats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Operational overview across brokers, listings, and verification.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total brokers"
          value={s?.totalBrokers ?? 0}
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Verified"
          value={s?.verifiedBrokers ?? 0}
          icon={ShieldCheck}
          loading={loading}
          tone="success"
        />
        <StatCard
          label="Pending KYC"
          value={s?.pendingKyc ?? 0}
          icon={Clock}
          loading={loading}
          tone="warn"
        />
        <StatCard
          label="Rejected KYC"
          value={s?.rejectedKyc ?? 0}
          icon={XCircle}
          loading={loading}
          tone="danger"
        />
        <StatCard
          label="Listings pending"
          value={s?.pendingListings ?? 0}
          icon={Building2}
          loading={loading}
          tone="warn"
        />
        <StatCard
          label="Listings live"
          value={s?.approvedListings ?? 0}
          icon={CheckCircle2}
          loading={loading}
          tone="success"
        />
        <StatCard
          label="New brokers (24h)"
          value={s?.todaySignups ?? 0}
          icon={UserPlus}
          loading={loading}
        />
        <StatCard
          label="Suspended brokers"
          value={s?.suspended ?? 0}
          icon={Activity}
          loading={loading}
          tone={s?.suspended ? "danger" : "default"}
        />
        <StatCard
          label="Unread Contacts"
          value={s?.unreadContacts ?? 0}
          icon={Activity}
          loading={loading}
          tone={s?.unreadContacts ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white lg:col-span-2">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent broker signups</h2>
            <span className="text-xs text-slate-500">Last 8</span>
          </header>
          {recent.isPending ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading…</div>
          ) : (recent.data ?? []).length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No signups yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-2 text-left font-semibold">Name</th>
                  <th className="px-5 py-2 text-left font-semibold">Firm · City</th>
                  <th className="px-5 py-2 text-left font-semibold">KYC</th>
                  <th className="px-5 py-2 text-right font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(recent.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-900">{p.full_name || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {[p.firm, p.city].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <KycPill status={p.kyc_status} />
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent admin activity</h2>
          </header>
          {audit.isPending ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading…</div>
          ) : (audit.data ?? []).length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No activity yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(audit.data ?? []).map((a) => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <div className="font-medium text-slate-900">{a.action}</div>
                  <div className="text-xs text-slate-500">
                    {a.resource}
                    {a.resource_id ? ` · ${a.resource_id.slice(0, 8)}` : ""} ·{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white lg:col-span-3 mt-2">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Contact Submissions</h2>
          </header>
          {recentContacts.isPending ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading…</div>
          ) : (recentContacts.data ?? []).length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No submissions yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(recentContacts.data ?? []).map((c) => (
                <li key={c.id} className="px-5 py-3 text-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-900">{c.name} <span className="text-slate-500 font-normal ml-2">{c.subject}</span></div>
                    <div className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                    ${c.status === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KycPill({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    in_review: { label: "In review", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 ring-red-200" },
    pending: { label: "Pending", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  };
  const v = map[status ?? "pending"] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${v.cls}`}
    >
      {v.label}
    </span>
  );
}
