import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — BrokersConnect" },
      { name: "description", content: "Frequently Asked Questions about BrokersConnect." },
    ],
  }),
  component: FAQ,
});

function FAQ() {
  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24 max-w-3xl">
        <section className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Support</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-6">
            Frequently Asked Questions
          </h1>
        </section>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-xl border border-hairline">
            <h3 className="text-lg font-bold mb-2">What is BrokersConnect?</h3>
            <p className="text-muted-foreground">BrokersConnect is a B2B platform exclusively for verified real estate brokers in India. We facilitate secure communication, deal tracking, and verified listings between professionals.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-hairline">
            <h3 className="text-lg font-bold mb-2">How does verification work?</h3>
            <p className="text-muted-foreground">During signup, you provide your PAN, GST, and RERA registration. Our staff reviews these documents manually within 24 hours before approving your account to access the network.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-hairline">
            <h3 className="text-lg font-bold mb-2">Can buyers or sellers join?</h3>
            <p className="text-muted-foreground">No. BrokersConnect is strictly B2B. By keeping consumers off the platform, we eliminate tire-kickers and fake leads, allowing you to focus on collaborating with other professionals.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-hairline">
            <h3 className="text-lg font-bold mb-2">Is my data secure?</h3>
            <p className="text-muted-foreground">Yes. All chats and deals are end-to-end encrypted or securely stored with strict access controls. Only the brokers you explicitly share information with can view your deal data.</p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
