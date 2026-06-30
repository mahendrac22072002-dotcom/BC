import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, EyeOff, MessageSquareWarning, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errMessage, formatINR, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/staff/listings")({
  head: () => ({ meta: [{ title: "Listings — Staff" }] }),
  component: ListingsModeration,
});

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ModStatus = Database["public"]["Enums"]["listing_moderation_status"];

const filters: { value: ModStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
];

export function ListingsModeration() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ModStatus | "all">("pending");

  const listingsQ = useQuery({
    queryKey: ["staff", "listings", filter],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filter !== "all") q = q.eq("moderation_status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });

  const act = useMutation({
    mutationFn: async ({
      listing,
      to,
      reason,
      kind,
      notifKind,
      notifTitle,
    }: {
      listing: Listing;
      to: ModStatus;
      reason?: string;
      kind: string;
      notifKind?: Database["public"]["Enums"]["notification_kind"];
      notifTitle?: string;
    }) => {
      const previous = listing.moderation_status;
      const patch: Partial<Listing> = { moderation_status: to, moderation_notes: reason ?? null };
      if (to === "approved") (patch as { status?: string }).status = "active";
      if (to === "hidden") (patch as { status?: string }).status = "draft";
      const { error: e1 } = await supabase
        .from("listings")
        .update(patch as never)
        .eq("id", listing.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("listing_status_history").insert({
        listing_id: listing.id,
        moderator_id: user!.id,
        previous_status: previous,
        new_status: to,
        reason: reason ?? null,
      });
      if (e2) throw e2;
      await logAdminAction({
        action: `listings.${kind}`,
        resource: "listings",
        resource_id: listing.id,
        before: { moderation_status: previous },
        after: { moderation_status: to, reason },
      });
      if (notifKind && notifTitle) {
        await notify({
          user_id: listing.broker_id,
          kind: notifKind,
          title: notifTitle,
          body: reason ?? undefined,
          link: "/listings",
        });
      }
    },
    onSuccess: () => {
      toast.success("Moderation applied");
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const feature = useMutation({
    mutationFn: async (listing: Listing) => {
      const until = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("listings")
        .update({ featured_until: until })
        .eq("id", listing.id);
      if (error) throw error;
      await logAdminAction({
        action: "listings.feature",
        resource: "listings",
        resource_id: listing.id,
        after: { featured_until: until },
      });
      await notify({
        user_id: listing.broker_id,
        kind: "listing_featured",
        title: "Your listing was featured",
        body: `“${listing.title}” is featured for 14 days.`,
        link: "/listings",
      });
    },
    onSuccess: () => {
      toast.success("Listing featured for 14 days");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings Moderation</h1>
          <p className="text-sm text-zinc-500">Review broker submissions and feature listings.</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as ModStatus | "all")}>
          <SelectTrigger className="h-9 w-56 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listingsQ.isPending ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (listingsQ.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-5 py-16 text-center text-sm text-zinc-500">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {listingsQ.data!.map((l) => (
            <li key={l.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{l.title}</p>
                  <p className="text-xs text-zinc-500">
                    {l.property_type} · {l.listing_type} · {l.city} · {formatINR(l.price)}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {l.moderation_status} · submitted {relativeTime(l.created_at)}
                  </p>
                  {l.moderation_notes && (
                    <p className="mt-2 text-xs text-zinc-600">
                      <MessageSquareWarning className="mr-1 inline h-3 w-3" />
                      {l.moderation_notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    disabled={act.isPending}
                    onClick={() =>
                      act.mutate({
                        listing: l,
                        to: "approved",
                        kind: "approve",
                        notifKind: "listing_approved",
                        notifTitle: `Approved: ${l.title}`,
                      })
                    }
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={act.isPending}
                    onClick={() => {
                      const reason = prompt("What needs to change?") ?? "";
                      if (!reason) return;
                      act.mutate({
                        listing: l,
                        to: "changes_requested",
                        reason,
                        kind: "request_changes",
                        notifKind: "listing_rejected",
                        notifTitle: `Changes requested: ${l.title}`,
                      });
                    }}
                  >
                    Request changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={act.isPending}
                    onClick={() => {
                      const reason = prompt("Reason for rejection:") ?? "";
                      if (!reason) return;
                      act.mutate({
                        listing: l,
                        to: "rejected",
                        reason,
                        kind: "reject",
                        notifKind: "listing_rejected",
                        notifTitle: `Rejected: ${l.title}`,
                      });
                    }}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={act.isPending}
                    onClick={() =>
                      act.mutate({
                        listing: l,
                        to: l.moderation_status === "hidden" ? "approved" : "hidden",
                        kind: l.moderation_status === "hidden" ? "unhide" : "hide",
                        notifKind: "listing_hidden",
                        notifTitle:
                          l.moderation_status === "hidden"
                            ? `Restored: ${l.title}`
                            : `Hidden: ${l.title}`,
                      })
                    }
                  >
                    {l.moderation_status === "hidden" ? (
                      <>
                        <Eye className="mr-1 h-4 w-4" /> Unhide
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" /> Hide
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={feature.isPending}
                    onClick={() => feature.mutate(l)}
                  >
                    <Star className="mr-1 h-4 w-4" /> Feature
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
