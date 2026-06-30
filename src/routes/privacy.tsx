import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BrokersConnect" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
        <div className="prose prose-neutral max-w-none text-muted-foreground">
          <p>Last updated: June 2026</p>
          <p>Your privacy is important to us. It is BrokersConnect's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
          
          <h3>1. Information we collect</h3>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.</p>
          
          <h3>2. KYC and Verification Data</h3>
          <p>To maintain the integrity of our B2B network, we collect business identification data (PAN, GST, RERA). This information is securely stored and used strictly for identity verification by our internal compliance team.</p>
          
          <h3>3. Data retention</h3>
          <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we'll protect within commercially acceptable means to prevent loss and theft, as well as unauthorised access, disclosure, copying, use or modification.</p>
          
          <h3>4. Third-party access</h3>
          <p>We don't share any personally identifying information publicly or with third-parties, except when required to by law.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
