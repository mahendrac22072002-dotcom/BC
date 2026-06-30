import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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

const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    duration: "90 Days",
    activePeriod: "60-Day Active Period",
    features: [
      "30 Listings",
      "Maximum 3 property visits per week",
      "30-Day Trial",
      "Auto renewal",
      "Cancel anytime before renewal"
    ],
    highlighted: false
  },
  {
    name: "Growth",
    price: "₹7,999",
    duration: "150 Days",
    activePeriod: "150-Day Active Period",
    features: [
      "75 Listings",
      "Maximum 3 property visits per week",
      "30-Day Trial",
      "Auto renewal",
      "Cancel anytime before renewal"
    ],
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "₹14,999",
    duration: "335 Days",
    activePeriod: "335-Day Active Period",
    features: [
      "200 Listings",
      "Maximum 5 property visits per week",
      "30-Day Trial",
      "Auto renewal",
      "Cancel anytime before renewal"
    ],
    highlighted: false
  }
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        <section className="text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">
            Simple, transparent pricing for real professionals.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. Upgrade when you need more power.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div key={plan.name} className={`${plan.highlighted ? "bg-primary text-primary-foreground shadow-xl relative scale-100 md:scale-105 z-10" : "bg-card border border-hairline shadow-sm"} p-8 rounded-2xl flex flex-col overflow-hidden h-full`}>
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-white/20 px-3 py-1 rounded-bl-xl font-medium text-sm">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className={`${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"} mb-6`}>{plan.activePeriod}</p>
              
              <div className="text-4xl font-extrabold mb-8">
                {plan.price}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-emerald-300" : "text-emerald-500"}`} />
                    <span className={plan.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <Button variant={plan.highlighted ? "secondary" : "outline"} className="w-full" size="lg" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>Choose {plan.name}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
