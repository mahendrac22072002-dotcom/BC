import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — BrokersConnect" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-neutral max-w-none text-muted-foreground">
          <p>Last updated: June 2026</p>
          <p>By accessing the website at BrokersConnect, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
          
          <h3>1. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on BrokersConnect's website for personal, non-commercial transitory viewing only.</p>
          
          <h3>2. Professional Conduct</h3>
          <p>BrokersConnect is a B2B platform. You agree to interact with other verified professionals in a respectful and legally compliant manner. Posting fake inventory or attempting to bypass the KYC system will result in immediate account termination.</p>
          
          <h3>3. Disclaimer</h3>
          <p>The materials on BrokersConnect's website are provided on an 'as is' basis. BrokersConnect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
