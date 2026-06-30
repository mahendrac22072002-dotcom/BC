import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BrokersConnect" },
      { name: "description", content: "Learn about BrokersConnect, India's trusted broker collaboration platform." },
      { property: "og:title", content: "About BrokersConnect" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">About Us</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">
            The Trust Layer for Indian Real Estate
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            BrokersConnect is India's first B2B platform built exclusively for professional real estate brokers. We combine KYC verification, authentic inventory, and deal collaboration tools into a single trusted network.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/auth" search={{ mode: "signup" }} className={buttonVariants({ size: "lg" })}>
              Join the Network
            </Link>
            <Link to="/blog/$slug" params={{ slug: "why-brokersconnect-exists" }} className={buttonVariants({ variant: "outline", size: "lg" })}>
              Read Our Story
            </Link>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-24 grid md:grid-cols-2 gap-12">
          <div className="bg-card p-8 rounded-2xl border border-hairline shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To eliminate fake leads and unverified inventory by building a secure, exclusive ecosystem where serious real estate professionals can collaborate and close deals with confidence.
            </p>
          </div>
          <div className="bg-card p-8 rounded-2xl border border-hairline shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To become the standard operating system for India's real estate brokers, where every genuine transaction originates from a trusted, verified connection.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Our Core Values</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-2">Verification First</h3>
              <p className="text-muted-foreground">Access is restricted to professionals who pass rigorous identity, PAN, and RERA checks.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-2">Authentic Inventory</h3>
              <p className="text-muted-foreground">Every listing is moderated for accuracy, eliminating duplicates and ghost properties.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-2">Professional Respect</h3>
              <p className="text-muted-foreground">We build tools that respect a broker's time, protecting their leads and direct relationships.</p>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
