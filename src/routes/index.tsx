import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Users, MessagesSquare, BadgeCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrokersConnect — India's verified broker marketplace" },
      { name: "description", content: "The broker network that actually connects." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">For verified real estate brokers only</p>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl mb-6">
            The broker network that actually connects.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            BrokersConnect is India's first KYC-verified marketplace built for brokers, not buyers. List authentic inventory, collaborate on deals, and grow a trusted network — all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get verified</Link></Button>
            <Button variant="outline" size="lg" asChild><Link to="/pricing">View pricing</Link></Button>
          </div>
        </section>

        {/* Logos */}
        <section className="mb-24 py-10 border-y border-hairline overflow-hidden">
          <div className="flex items-center justify-center gap-12 flex-wrap text-muted-foreground font-semibold text-sm uppercase tracking-wider">
            <span>Verified by KYC</span>
            <span>RERA-aware</span>
            <span>Encrypted chat</span>
            <span>Audit logged</span>
            <span>Made in India</span>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">What you get</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">A serious platform for serious brokers.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to operate professionally — without buyer tire-kickers, fake leads or duplicate listings.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "KYC-verified only", desc: "Every broker is reviewed by our staff against PAN, GST, RERA and identity documents." },
              { icon: Building2, title: "Authentic inventory", desc: "Listings are moderated for accuracy and ownership before they go live." },
              { icon: Users, title: "Broker-to-broker network", desc: "Discover peers by city, asset class and ticket size. Send connection requests and collaborate on closures." },
              { icon: MessagesSquare, title: "Built-in chat & deals", desc: "Negotiate, share documents and track deal stages in one workspace — no scattered WhatsApp threads." },
              { icon: BadgeCheck, title: "Trust by default", desc: "Public verification badges, transparent activity history and staff-moderated reporting keep the marketplace clean." },
              { icon: Sparkles, title: "AI-ready matching", desc: "Smart suggestions surface the right brokers and properties for every requirement you post." }
            ].map((f, i) => (
              <div key={i} className="bg-card p-6 rounded-xl border border-hairline hover:shadow-sm transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-24">
          <div className="bg-surface rounded-3xl p-8 md:p-16 border border-hairline">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 text-center">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center mb-16">From signup to closure, in one workflow.</h2>
            
            <div className="space-y-12 max-w-3xl mx-auto">
              {[
                { num: "01", title: "Register & submit KYC", desc: "Create your account and upload PAN, GST and RERA details. Our staff reviews within 24 hours." },
                { num: "02", title: "Publish inventory", desc: "Add residential, commercial, plot or rental listings with photos, documents and ticket size." },
                { num: "03", title: "Connect with peers", desc: "Search brokers by city and asset class. Send requests, chat, and share requirements." },
                { num: "04", title: "Close deals together", desc: "Track every conversation, offer and document inside a deal room until closure." }
              ].map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{step.num}</div>
                    {i !== 3 && <div className="w-px h-full bg-border my-2"></div>}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button size="lg" asChild><Link to="/auth?mode=signup">Start your verification</Link></Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">24 hrs</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Average KYC turnaround</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">0</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Unverified brokers allowed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Listings moderated</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">1</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Workspace for every deal</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-card border border-hairline rounded-3xl p-12 shadow-sm">
          <h2 className="text-3xl font-bold mb-4">Stop chasing fake leads. Start closing real deals.</h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">Join the broker-only network India's professionals have been waiting for.</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg"><Link to="/auth?mode=signup">Create broker account</Link></Button>
            <Button variant="ghost" size="lg" asChild><Link to="/contact">Talk to sales &rarr;</Link></Button>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
