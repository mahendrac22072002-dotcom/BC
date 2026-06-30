// Folder-style KYC review. Groups pending documents by broker and lets the
// reviewer approve all, reject the broker, or request re-upload of specific
// documents in one pass. Used by both Admin and Staff routes; staff variant
// masks PII and hides original-document links unless they hold the
// `kyc.documents:view_sensitive` permission.
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { getBrokerEmails } from "@/lib/broker-emails.functions";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { errMessage, initials, relativeTime } from "@/lib/format";
import { maskEmail, maskName, maskPhone } from "@/lib/privacy";
import { logAdminAction } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { Database } from "@/integrations/supabase/types";

type Doc = Database["public"]["Tables"]["kyc_documents"]["Row"];
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "firm" | "city" | "phone" | "kyc_status" | "created_at"
>;

const DOC_LABEL: Record<string, string> = {
  broker_photo: "Broker photo",
  visiting_card: "Visiting card",
  office_photo: "Office photo",
  pan: "PAN",
  gst: "GST",
  rera: "RERA",
  aadhaar: "Aadhaar",
};

export function KycReview({ mode }: { mode: "admin" | "staff" }) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const canViewPii = mode === "admin" || can("broker", "view_pii");
  const canOpenDoc = mode === "admin" || can("kyc.documents", "view_sensitive");

  const docsQ = useQuery({
    queryKey: [mode, "kyc-folder", "docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .in("status", ["uploaded"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  const brokerIds = useMemo(
    () => Array.from(new Set((docsQ.data ?? []).map((d) => d.broker_id))),
    [docsQ.data],
  );

  const brokersQ = useQuery({
    queryKey: [mode, "kyc-folder", "brokers", brokerIds.slice().sort().join(",")],
    enabled: brokerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, firm, city, phone, kyc_status, created_at")
        .in("id", brokerIds);
      if (error) throw error;
      const map = new Map<string, Profile>();
      (data ?? []).forEach((p) => map.set(p.id, p as Profile));
      return map;
    },
  });

  const fetchEmails = useServerFn(getBrokerEmails);
  const emailsQ = useQuery({
    queryKey: [mode, "kyc-folder", "emails", brokerIds.slice().sort().join(",")],
    enabled: brokerIds.length > 0,
    queryFn: async () => fetchEmails({ data: { ids: brokerIds } }),
  });

  const folders = useMemo(() => {
    const m = new Map<string, Doc[]>();
    for (const d of docsQ.data ?? []) {
      const arr = m.get(d.broker_id) ?? [];
      arr.push(d);
      m.set(d.broker_id, arr);
    }
    return Array.from(m.entries());
  }, [docsQ.data]);

  const decide = useMutation({
    mutationFn: async ({
      brokerId,
      docs,
      decision,
      notes,
    }: {
      brokerId: string;
      docs: Doc[];
      decision: "approved" | "rejected" | "re_upload";
      notes?: string;
    }) => {
      if (!can("kyc", decision === "approved" ? "approve" : "reject")) {
        throw new Error("Forbidden: missing KYC review permission");
      }
      const now = new Date().toISOString();
      const targetStatus =
        decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "uploaded";

      const ids = docs.map((d) => d.id);
      const { error: e1 } = await supabase
        .from("kyc_documents")
        .update({
          status: targetStatus,
          reviewer_id: user!.id,
          rejection_reason: notes ?? null,
          reviewed_at: now,
        })
        .in("id", ids);
      if (e1) throw e1;

      // Only flip profile.kyc_status on full approve/reject of the whole folder.
      if (decision !== "re_upload") {
        const { error: e2 } = await supabase
          .from("profiles")
          .update({ kyc_status: decision === "approved" ? "verified" : "rejected" })
          .eq("id", brokerId);
        if (e2) throw e2;
      }

      await logAdminAction({
        action: `kyc.${decision}`,
        resource: "kyc_documents",
        resource_id: brokerId,
        after: { decision, notes, count: ids.length },
      });

      await notify({
        user_id: brokerId,
        kind: decision === "approved" ? "kyc_approved" : "kyc_rejected",
        title:
          decision === "approved"
            ? "Your KYC was approved"
            : decision === "rejected"
              ? "Your KYC was rejected"
              : "Please re-upload your KYC documents",
        body: notes ?? undefined,
        link: "/kyc",
      });
    },
    onSuccess: (_d, v) => {
      const msg =
        v.decision === "approved"
          ? "Broker verified"
          : v.decision === "rejected"
            ? "KYC rejected"
            : "Re-upload requested";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: [mode] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  async function viewDoc(path: string) {
    if (!canOpenDoc) {
      toast.error("You don't have permission to open original documents");
      return;
    }
    const { data, error } = await supabase.storage.from("kyc").createSignedUrl(path, 300);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">KYC Verification</h1>
        <p className="text-sm text-slate-500">
          {folders.length === 0
            ? "Inbox zero. Nothing pending."
            : `${folders.length} broker${folders.length === 1 ? "" : "s"} awaiting review.`}
        </p>
      </header>

      {docsQ.isPending ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-16 text-center text-sm text-slate-500">
          All caught up.
        </div>
      ) : (
        <ul className="space-y-3">
          {folders.map(([brokerId, docs]) => {
            const profile = brokersQ.data?.get(brokerId);
            const open = openId === brokerId;
            const displayName = canViewPii ? profile?.full_name : maskName(profile?.full_name);
            const displayPhone = canViewPii ? profile?.phone : maskPhone(profile?.phone);
            const rawEmail = emailsQ.data?.[brokerId];
            const displayEmail = rawEmail ? (canViewPii ? rawEmail : maskEmail(rawEmail)) : "—";
            return (
              <motion.li
                key={brokerId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : brokerId)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {initials(profile?.full_name)}
                  </div>
                  <Folder className="h-5 w-5 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {displayName || "Unnamed broker"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {[profile?.firm, profile?.city, displayPhone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    {docs.length} pending
                  </Badge>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:inline">
                    In review
                  </span>
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="folder-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="grid gap-6 px-5 py-5 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-1">
                          <Section title="Broker">
                            <Field label="Name" value={displayName || "—"} />
                            <Field
                              label="Email"
                              value={displayEmail}
                              hint={canViewPii ? undefined : "masked"}
                            />
                            <Field label="Phone" value={displayPhone || "—"} />
                          </Section>
                          <Section title="Company">
                            <Field label="Firm" value={profile?.firm || "—"} />
                            <Field label="City" value={profile?.city || "—"} />
                          </Section>
                          <Section title="Timeline">
                            <Field
                              label="Account created"
                              value={profile?.created_at ? relativeTime(profile.created_at) : "—"}
                            />
                            <Field
                              label="Earliest pending"
                              value={relativeTime(docs[0]?.created_at)}
                            />
                          </Section>
                        </div>

                        <div className="space-y-3 lg:col-span-2">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Documents ({docs.length})
                          </div>
                          <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                            {docs.map((d) => (
                              <li
                                key={d.id}
                                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                              >
                                <FileText className="h-4 w-4 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {DOC_LABEL[d.doc_type] ?? d.doc_type}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    Uploaded {relativeTime(d.created_at)}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewDoc(d.file_path)}
                                  disabled={!canOpenDoc}
                                  title={canOpenDoc ? "Open original" : "Needs kyc.documents:view_sensitive"}
                                >
                                  {canOpenDoc ? (
                                    <>
                                      <Eye className="mr-1 h-3.5 w-3.5" /> View
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="mr-1 h-3.5 w-3.5" /> Masked
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    decide.mutate({
                                      brokerId,
                                      docs: [d],
                                      decision: "approved",
                                    })
                                  }
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    const reason = prompt(
                                      `Why is ${DOC_LABEL[d.doc_type] ?? d.doc_type} rejected?`,
                                    );
                                    if (reason == null) return;
                                    decide.mutate({
                                      brokerId,
                                      docs: [d],
                                      decision: "rejected",
                                      notes: reason || undefined,
                                    });
                                  }}
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Reject
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-700 hover:bg-amber-50"
                                  onClick={() => {
                                    const reason = prompt(
                                      `Why does ${DOC_LABEL[d.doc_type] ?? d.doc_type} need to be re-uploaded?`,
                                    );
                                    if (reason == null) return;
                                    decide.mutate({
                                      brokerId,
                                      docs: [d],
                                      decision: "re_upload",
                                      notes: reason || undefined,
                                    });
                                  }}
                                >
                                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                  Re-upload
                                </Button>
                              </li>
                            ))}
                          </ul>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500"
                              disabled={!can("kyc", "approve") || decide.isPending}
                              onClick={() =>
                                decide.mutate({ brokerId, docs, decision: "approved" })
                              }
                            >
                              {decide.isPending ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-1 h-4 w-4" />
                              )}
                              Approve all
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              disabled={decide.isPending}
                              onClick={() => {
                                const reason = prompt("Why request changes?");
                                if (reason == null) return;
                                decide.mutate({
                                  brokerId,
                                  docs,
                                  decision: "re_upload",
                                  notes: reason || undefined,
                                });
                              }}
                            >
                              <RefreshCw className="mr-1 h-4 w-4" />
                              Request re-upload (all)
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={!can("kyc", "reject") || decide.isPending}
                              onClick={() => {
                                const reason = prompt("Reason for rejection (optional):") ?? undefined;
                                decide.mutate({
                                  brokerId,
                                  docs,
                                  decision: "rejected",
                                  notes: reason,
                                });
                              }}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Reject KYC
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {title}
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900" title={hint}>
        {value}
      </dd>
    </div>
  );
}
