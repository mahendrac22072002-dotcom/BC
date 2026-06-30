import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { errMessage } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BrokersConnect" },
      { name: "description", content: "Get in touch with the BrokersConnect team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      status: "unread",
    };

    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert([data]);

    setLoading(false);

    if (dbError) {
      console.error(dbError);
      setError(errMessage(dbError));
    } else {
      setSuccess(true);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left Column - Contact Info */}
          <div>
            <div className="eyebrow mb-2">Get in Touch</div>
            <h1 className="text-4xl tracking-tight md:text-5xl lg:text-6xl">
              Let's build your <span className="text-primary">broker network.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question about our platform, enterprise pricing, or need support? Our team is ready to help you grow your real estate business.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              <div className="rounded-2xl border border-hairline bg-surface p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Email us</h3>
                <p className="mt-1 text-sm text-muted-foreground">We usually respond within 24 hours.</p>
                <a href="mailto:ravinderkumar@brokersconnect.space" className="mt-4 block font-medium hover:text-primary transition-colors break-all">
                  ravinderkumar@brokersconnect.space
                </a>
              </div>

              <div className="rounded-2xl border border-hairline bg-surface p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Call us</h3>
                <p className="mt-1 text-sm text-muted-foreground">Mon-Fri from 9am to 6pm IST.</p>
                <div className="mt-4 space-y-1">
                  <a href="tel:+918826062033" className="block font-medium hover:text-primary transition-colors">
                    +91 88260 62033
                  </a>
                  <a href="tel:+918053638033" className="block font-medium hover:text-primary transition-colors">
                    +91 80536 38033
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-hairline bg-surface p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-bold">Our Office</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                BrokerConnect<br />
                CoElevate, DLF Corporate Greens<br />
                Sector 74A<br />
                Gurugram, Haryana 122004<br />
                India
              </p>
              <a 
                href="https://maps.app.goo.gl/2JSo2NMRmTowjMjV8?g_st=awb" 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-medium text-primary hover:underline"
              >
                View on Google Maps <ArrowRight className="h-4 w-4" />
              </a>
              
              <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-slate-100 relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.349079979401!2d76.98595851507742!3d28.408711482506454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d3d5ac2b4fb2b%3A0xc6c7bc1c9a60e0a5!2sCoElevate%20Workspace!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, position: 'absolute', top: 0, left: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BrokerConnect Office Map"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <div className="bg-card p-8 md:p-12 rounded-3xl border border-hairline shadow-sm">
              {success ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✓</div>
                  <h3 className="text-2xl font-bold mb-2">Message sent successfully</h3>
                  <p className="text-muted-foreground">We'll get back to you as soon as possible.</p>
                  <Button className="mt-8" onClick={() => setSuccess(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                      <input required id="name" name="name" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                      <input required type="email" id="email" name="email" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                      <input id="phone" name="phone" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium">Company/Agency</label>
                      <input id="company" name="company" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject <span className="text-red-500">*</span></label>
                    <input required id="subject" name="subject" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
                    <textarea required id="message" name="message" rows={5} className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
