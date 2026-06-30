import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { relativeTime } from "@/lib/format";
import { Activity, Database, FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [{ title: "System Health — Admin" }] }),
  component: SystemPage,
});

async function tableCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table as never).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

function SystemPage() {
  const q = useQuery({
    queryKey: ["admin", "system_health"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [
        users, listings, kyc, audit, audit24, errors24, lastAudit
      ] = await Promise.all([
        tableCount("profiles"),
        tableCount("listings"),
        tableCount("kyc_documents"),
        tableCount("admin_audit_log"),
        supabase.from("admin_audit_log")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
        supabase.from("admin_audit_log")
          .select("*", { count: "exact", head: true })
          .ilike("action", "%error%")
          .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
        supabase.from("admin_audit_log").select("created_at,action,resource,actor_id").order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        users, listings, kyc, audit,
        audit24: audit24.count ?? 0,
        errors24: errors24.count ?? 0,
        recent: lastAudit.data ?? [],
      };
    },
  });

  const dbOk = !q.isError;
  const data = q.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-sm text-slate-500">Live snapshot of platform state. Refreshes every 30s.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Database" value={dbOk ? "Online" : "Error"} hint={dbOk ? "Read OK" : "Read failed"} icon={Database} />
        <StatCard label="Audit events (24h)" value={data?.audit24 ?? "—"} hint={`${data?.audit ?? 0} total`} icon={Activity} />
        <StatCard label="Error events (24h)" value={data?.errors24 ?? "—"} hint="from audit log" icon={ShieldCheck} />
        <StatCard label="Records" value={data ? (data.users + data.listings + data.kyc) : "—"} hint="users + listings + kyc" icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Table sizes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-500">profiles</span><span className="font-medium">{data?.users ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-slate-500">listings</span><span className="font-medium">{data?.listings ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-slate-500">kyc_documents</span><span className="font-medium">{data?.kyc ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-slate-500">admin_audit_log</span><span className="font-medium">{data?.audit ?? "—"}</span></li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Recent admin activity</h2>
          {!data?.recent.length ? (
            <p className="mt-3 text-xs text-slate-500">No recent activity.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {data.recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1.5 last:border-0">
                  <span className="truncate font-mono text-slate-700">{r.action}</span>
                  <span className="shrink-0 text-slate-400">{relativeTime(r.created_at as string)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
