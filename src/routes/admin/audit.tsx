import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — Admin" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState<string>("all");

  const q = useQuery({
    queryKey: ["admin", "audit", { resource }],
    queryFn: async () => {
      let qb = supabase
        .from("admin_audit_log")
        .select("id, action, resource, resource_id, before, after, metadata, created_at, actor_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (resource !== "all") qb = qb.eq("resource", resource);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (q.data ?? []).filter(
    (r) =>
      !search.trim() ||
      `${r.action} ${r.resource} ${r.resource_id ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-slate-500">Append-only record of every admin action.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search action or resource id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-sm border-slate-200"
        />
        <select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
        >
          <option value="all">All resources</option>
          <option value="user_roles">user_roles</option>
          <option value="role_permissions">role_permissions</option>
          <option value="profiles">profiles</option>
          <option value="listings">listings</option>
          <option value="kyc_documents">kyc_documents</option>
          <option value="site_settings">site_settings</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {q.isPending ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">No entries match.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">When</th>
                <th className="px-5 py-2.5 text-left font-semibold">Action</th>
                <th className="px-5 py-2.5 text-left font-semibold">Resource</th>
                <th className="px-5 py-2.5 text-left font-semibold">ID</th>
                <th className="px-5 py-2.5 text-left font-semibold">Actor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  <td
                    className="px-5 py-2 text-xs text-slate-500"
                    title={new Date(r.created_at).toLocaleString()}
                  >
                    {relativeTime(r.created_at)}
                  </td>
                  <td className="px-5 py-2 font-mono text-xs font-medium text-slate-900">
                    {r.action}
                  </td>
                  <td className="px-5 py-2 text-xs text-slate-700">{r.resource}</td>
                  <td className="px-5 py-2 font-mono text-[10px] text-slate-500">
                    {r.resource_id?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="px-5 py-2 font-mono text-[10px] text-slate-500">
                    {r.actor_id?.slice(0, 8) ?? "system"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
