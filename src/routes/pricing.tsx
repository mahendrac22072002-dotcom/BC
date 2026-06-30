import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — BrokersConnect" },
      { name: "description", content: "Simple, transparent pricing for real professionals." },
      { property: "og:title", content: "Pricing — BrokersConnect" },
    ],
  }),
  component: Pricing,
});

type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];

function Pricing() {
  const { data: plans, isPending, isError } = useQuery({
    queryKey: ["subscription_plans", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Plan[];
    }
  });

  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        <section className="text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">
            Simple, transparent pricing for real professionals.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free. Upgrade when you need more power.
          </p>
        </section>

        {isPending ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : isError ? (
          <div className="text-center text-red-500 py-20">Error loading plans.</div>
        ) : !plans || plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No active plans found.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isPro = plan.highlighted;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              
              return (
                <div key={plan.id} className={`${isPro ? "bg-primary text-primary-foreground shadow-xl relative" : "bg-card border border-hairline shadow-sm"} p-8 rounded-2xl flex flex-col overflow-hidden`}>
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-white/20 px-3 py-1 rounded-bl-xl font-medium text-sm">
                      {plan.badge}
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  {plan.description && <p className={`${isPro ? "text-primary-foreground/80" : "text-muted-foreground"} mb-6`}>{plan.description}</p>}
                  
                  <div className="text-4xl font-extrabold mb-8">
                    {plan.price_inr === 0 ? "₹0" : formatINR(plan.price_inr)}
                    <span className={`text-base font-normal ${isPro ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {plan.price_inr === 0 ? " / forever" : ` / ${plan.interval}`}
                    </span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPro ? "text-emerald-300" : "text-emerald-500"}`} />
                        <span className={isPro ? "text-primary-foreground/90" : "text-muted-foreground"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.cta_text && (
                    <Button variant={isPro ? "secondary" : "outline"} className="w-full" size="lg" asChild>
                      <Link to={plan.cta_url || "/register"}>{plan.cta_text}</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
