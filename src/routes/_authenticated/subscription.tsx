import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { errMessage, formatINR } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({ meta: [{ title: "Subscription — BrokersConnect" }] }),
  component: SubscriptionPage,
});

type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];
type Sub = Database["public"]["Tables"]["subscriptions"]["Row"];

function SubscriptionPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const plansQ = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  const subQ = useQuery({
    queryKey: ["my-sub", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Sub | null;
    },
  });

  const choose = useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error("Not signed in");
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const existing = subQ.data;
      if (existing) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            current_period_end: periodEnd.toISOString(),
            canceled_at: null,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: user.id,
          plan_id: planId,
          status: "active",
          current_period_end: periodEnd.toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-sub"] });
      toast.success("Plan activated");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      if (!subQ.data) return;
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("id", subQ.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-sub"] });
      toast.success("Subscription canceled");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const plans = plansQ.data ?? [];
  const sub = subQ.data;
  const currentPlan = plans.find((p) => p.id === sub?.plan_id);

  return (
    <div className="container-tight space-y-8 px-6 py-10">
      <div>
        <div className="eyebrow">Billing</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a plan that fits your brokerage. Switch anytime.
        </p>
      </div>

      {sub && currentPlan && sub.status !== "canceled" && (
        <div className="rounded-xl border border-hairline bg-foreground p-6 text-background">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-background/60">
                Current plan
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{currentPlan.name}</div>
              <div className="mt-1 text-sm text-background/70">
                {sub.status} • Renews {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
              </div>
            </div>
            <Button variant="secondary" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              Cancel subscription
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = sub?.plan_id === p.id && sub?.status !== "canceled";
          return (
            <div key={p.id} className="flex flex-col bg-card p-6">
              <h3 className="text-xl font-bold tracking-tight">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                  {(p.price_inr || 0) === 0 ? "Free" : formatINR(p.price_inr || 0)}
                </span>
                {(p.price_inr || 0) > 0 && <span className="pb-1.5 text-xs text-muted-foreground">/ {p.interval}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {(Array.isArray(p.features) ? (p.features as string[]) : []).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                disabled={isCurrent || choose.isPending}
                onClick={() => choose.mutate(p.id)}
              >
                {isCurrent ? "Current plan" : `Choose ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-hairline bg-card p-6 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 shrink-0" />
          <div>
            Payments are not connected yet. Plans activate immediately for testing.{" "}
            <Link to="/help" className="font-semibold text-foreground underline">
              Contact support
            </Link>{" "}
            to enable live billing.
          </div>
        </div>
      </div>
    </div>
  );
}
