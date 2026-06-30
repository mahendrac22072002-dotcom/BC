import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/staff/reports")({
  head: () => ({ meta: [{ title: "Reports — Staff" }] }),
  component: ReportsQueue,
});

type Report = Database["public"]["Tables"]["listing_reports"]["Row"];
type ReportStatus = Database["public"]["Enums"]["listing_report_status"];

const statusFilters: { value: ReportStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export function ReportsQueue() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | "all">("open");

  const reportsQ = useQuery({
    queryKey: ["staff", "reports", filter],
    queryFn: async () => {
      let q = supabase.from("listing_reports").select("*").order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });

  const update = useMutation({
    mutationFn: async ({
      report,
      patch,
      action,
    }: {
      report: Report;
      patch: Partial<Report>;
      action: string;
    }) => {
      const { error } = await supabase.from("listing_reports").update(patch as never).eq("id", report.id);
      if (error) throw error;
      await logAdminAction({
        action: `reports.${action}`,
        resource: "listing_reports",
        resource_id: report.id,
        before: { status: report.status },
        after: patch,
      });
      await notify({
        user_id: report.reporter_id,
        kind: "report_update",
        title: `Report ${patch.status ?? "updated"}`,
        body: typeof patch.resolution_notes === "string" ? patch.resolution_notes : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["staff", "reports"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listing Reports</h1>
          <p className="text-sm text-zinc-500">Triage, assign, and resolve reports.</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as ReportStatus | "all")}>
          <SelectTrigger className="h-9 w-44 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reportsQ.isPending ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (reportsQ.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-5 py-16 text-center text-sm text-zinc-500">
          No reports.
        </div>
      ) : (
        <ul className="space-y-3">
          {reportsQ.data!.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{r.reason}</p>
                  {r.description && (
                    <p className="mt-1 text-sm text-zinc-600">{r.description}</p>
                  )}
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {r.status} · {relativeTime(r.created_at)}
                  </p>
                  {r.resolution_notes && (
                    <p className="mt-2 text-xs text-zinc-600">↳ {r.resolution_notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "assigned" && r.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          report: r,
                          patch: { status: "assigned", assigned_to: user!.id },
                          action: "assign",
                        })
                      }
                    >
                      Take
                    </Button>
                  )}
                  {r.status !== "escalated" && r.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          report: r,
                          patch: { status: "escalated" },
                          action: "escalate",
                        })
                      }
                    >
                      Escalate
                    </Button>
                  )}
                  {r.status !== "resolved" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      disabled={update.isPending}
                      onClick={() => {
                        const notes = prompt("Resolution notes:") ?? "";
                        if (!notes) return;
                        update.mutate({
                          report: r,
                          patch: {
                            status: "resolved",
                            resolution_notes: notes,
                            resolved_at: new Date().toISOString(),
                          },
                          action: "resolve",
                        });
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                  {r.status !== "dismissed" && r.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          report: r,
                          patch: { status: "dismissed" },
                          action: "dismiss",
                        })
                      }
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
