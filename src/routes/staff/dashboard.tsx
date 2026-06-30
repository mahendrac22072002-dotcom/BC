import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Flag, LifeBuoy, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/staff/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Staff" }] }),
  component: StaffDashboard,
});

async function count(table: string, filter?: (q: ReturnType<typeof supabase.from>) => unknown) {
  let q = supabase.from(table as never).select("*", { count: "exact", head: true });
  if (filter) q = filter(q as never) as typeof q;
  const { count: c, error } = await q;
  if (error) return 0;
  return c ?? 0;
}

function StaffDashboard() {
  const cards = useQuery({
    queryKey: ["staff", "dashboard-cards"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const since = today.toISOString();
      const [pendingKyc, pendingListings, reports, threads, todayApprovals, todayRejections] =
        await Promise.all([
          count("kyc_documents", (q) => q.eq("status", "uploaded")),
          count("listings", (q) => q.eq("moderation_status", "pending")),
          count("listing_reports", (q) => q.in("status", ["open", "assigned"])),
          count("support_threads", (q) => q.in("status", ["open", "pending"])),
          count("listing_status_history", (q) =>
            q.eq("new_status", "approved").gte("created_at", since),
          ),
          count("listing_status_history", (q) =>
            q.eq("new_status", "rejected").gte("created_at", since),
          ),
        ]);
      return {
        pendingKyc,
        pendingListings,
        reports,
        threads,
        todayApprovals,
        todayRejections,
      };
    },
  });

  const recentReports = useQuery({
    queryKey: ["staff", "recent-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listing_reports")
        .select("id, reason, status, created_at, listing_id")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const recentThreads = useQuery({
    queryKey: ["staff", "recent-threads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_threads")
        .select("id, subject, status, priority, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const c = cards.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-zinc-500">Live queues and today&rsquo;s activity.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending KYC" value={c?.pendingKyc ?? 0} to="/staff/kyc" icon={ShieldCheck} />
        <Stat
          label="Pending listings"
          value={c?.pendingListings ?? 0}
          to="/staff/listings"
          icon={Building2}
        />
        <Stat label="Open reports" value={c?.reports ?? 0} to="/staff/reports" icon={Flag} />
        <Stat
          label="Open tickets"
          value={c?.threads ?? 0}
          to="/staff/support"
          icon={LifeBuoy}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Today: approvals" value={c?.todayApprovals ?? 0} />
        <Mini label="Today: rejections" value={c?.todayRejections ?? 0} />
        <Mini
          label="Today: net actions"
          value={(c?.todayApprovals ?? 0) + (c?.todayRejections ?? 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Latest reports</h2>
          <ul className="mt-3 divide-y divide-zinc-100 text-sm">
            {(recentReports.data ?? []).length === 0 ? (
              <li className="py-6 text-center text-zinc-400">No reports yet.</li>
            ) : (
              recentReports.data!.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-zinc-700">{r.reason}</span>
                  <span className="text-xs text-zinc-400">{relativeTime(r.created_at)}</span>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/staff/reports"
            className="mt-3 inline-block text-xs font-semibold text-zinc-900 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Latest support tickets</h2>
          <ul className="mt-3 divide-y divide-zinc-100 text-sm">
            {(recentThreads.data ?? []).length === 0 ? (
              <li className="py-6 text-center text-zinc-400">Inbox zero.</li>
            ) : (
              recentThreads.data!.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-zinc-700">{t.subject}</span>
                  <span className="text-xs text-zinc-400">
                    {t.priority} · {relativeTime(t.last_message_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/staff/support"
            className="mt-3 inline-block text-xs font-semibold text-zinc-900 hover:underline"
          >
            Open inbox →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  to,
  icon: Icon,
}: {
  label: string;
  value: number;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-900"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</div>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-3 text-3xl font-bold text-zinc-900">{value}</div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-zinc-900">{value}</div>
    </div>
  );
}
