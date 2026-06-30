import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BrokersConnect" },
      { name: "description", content: "We're building the trust layer for Indian real estate." },
      { property: "og:title", content: "About — BrokersConnect" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">About</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">
            We're building the trust layer for Indian real estate.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            BrokersConnect is a B2B platform built exclusively for real estate brokers. We verify professionals through KYC, moderate every listing, and give brokers the tools they need to collaborate on real deals.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 text-center">Mission</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center mb-8">
            Every broker verified. Every listing authentic. Every connection genuine.
          </h2>
          <div className="prose prose-neutral mx-auto text-muted-foreground text-lg">
            <p>India's real estate market runs on relationships — and yet, brokers are forced to operate through fragmented WhatsApp groups, paid lead portals built for buyers, and unverified listings copy-pasted across the internet.</p>
            <p>We think professionals deserve a platform of their own. One where the person on the other side of the deal is real, the inventory is genuine, and the tools actually fit the way deals happen.</p>
            <p>BrokersConnect is built around three non-negotiables: <strong>verification before access</strong>, <strong>moderation before publication</strong>, and <strong>transparency in every interaction</strong>.</p>
          </div>
        </section>

        {/* Principles */}
        <section className="mb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 text-center">Principles</p>
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            <div className="bg-card p-8 rounded-xl border border-hairline">
              <h3 className="text-xl font-bold mb-3">Trust is the product</h3>
              <p className="text-muted-foreground">We'd rather grow slowly with verified brokers than quickly with anonymous ones.</p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-hairline">
              <h3 className="text-xl font-bold mb-3">Professional, not promotional</h3>
              <p className="text-muted-foreground">No flashy buyer ads. No vanity metrics. Tools that respect your time.</p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-hairline">
              <h3 className="text-xl font-bold mb-3">Built in India, for India</h3>
              <p className="text-muted-foreground">RERA-aware, GST-aware, and tuned to how Indian deals actually close.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 border border-primary/10 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the verified network</h2>
          <p className="text-muted-foreground mb-8 text-lg">Stop chasing fake leads. Start closing real deals.</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg"><Link to="/auth?mode=signup">Create broker account</Link></Button>
            <Button variant="outline" size="lg" asChild><Link to="/contact">Talk to sales</Link></Button>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
