import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, FileText, Loader2, ShieldCheck, Trash2, Upload, XCircle } from "lucide-react";
import { relativeTime, errMessage } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({ meta: [{ title: "KYC — BrokersConnect" }] }),
  component: KycPage,
});

type Doc = Database["public"]["Tables"]["kyc_documents"]["Row"];
type DocType = "broker_photo" | "visiting_card" | "office_photo";
const DOC_TYPES: { value: DocType; label: string; hint: string }[] = [
  { value: "broker_photo", label: "Broker photo", hint: "Clear headshot, face fully visible." },
  { value: "visiting_card", label: "Visiting card", hint: "Front side of your business card." },
  { value: "office_photo", label: "Office photo", hint: "Photo of your office signage or workspace." },
];

function KycPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DocType>("broker_photo");

  const docsQ = useQuery({
    queryKey: ["kyc-docs", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${user!.id}/${type}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("kyc").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (up.error) throw up.error;
      const ins = await supabase.from("kyc_documents").insert({
        broker_id: user!.id,
        doc_type: type,
        file_path: path,
        status: "uploaded",
      } as any);
      if (ins.error) throw ins.error;

      // Submit-for-review marker on profile
      await supabase
        .from("profiles")
        .update({
          onboarding_kyc_submitted: true,
          kyc_status: profile?.kyc_status === "verified" ? "verified" : "in_review",
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
    },
    onSuccess: () => {
      setFile(null);
      toast.success("Document uploaded for review");
      qc.invalidateQueries({ queryKey: ["kyc-docs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: async (d: Doc) => {
      await supabase.storage.from("kyc").remove([d.file_path]);
      const { error } = await supabase.from("kyc_documents").delete().eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-docs"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="flex-1 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="eyebrow">Verification</div>
        <h1 className="mt-2 text-4xl tracking-tight md:text-5xl">KYC documents</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Upload your identity and broker credentials. Our team reviews submissions within 24 hours.
        </p>

        <div className="mt-8 rounded-2xl border border-hairline bg-foreground p-6 text-background">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-background/60">
                  Current status
                </div>
                <p className="text-lg font-bold capitalize">
                  {(profile?.kyc_status ?? "pending").replace("_", " ")}
                </p>
              </div>
            </div>
            {profile?.kyc_submitted_at && (
              <p className="text-xs text-background/60">
                Submitted {relativeTime(profile.kyc_submitted_at)}
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); upload.mutate(); }}
          className="mt-8 grid gap-4 rounded-2xl border border-hairline bg-card p-6 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {DOC_TYPES.find((d) => d.value === type)?.hint}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kyc-file">File</Label>
            <Input id="kyc-file" type="file" accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">JPG/PNG/PDF up to ~5 MB.</p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={upload.isPending || !file}>
              {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload document
            </Button>
          </div>
        </form>

        <div className="mt-10">
          <h2 className="text-xl font-bold">Uploaded documents</h2>
          {docsQ.isPending ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : (docsQ.data ?? []).length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-hairline bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No documents yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-card">
              {(docsQ.data ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{DOC_TYPES.find((t) => t.value === d.doc_type)?.label ?? d.doc_type}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Uploaded {relativeTime(d.created_at)}
                      {d.reviewer_notes && ` · ${d.reviewer_notes}`}
                    </p>
                  </div>
                  <DocStatus status={d.status} />
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (confirm("Remove this document?")) remove.mutate(d);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DocStatus({ status }: { status: Doc["status"] }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      In review
    </span>
  );
}
