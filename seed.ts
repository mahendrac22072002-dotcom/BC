import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Parse .env manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
}

const supabase = createClient(
  env["VITE_SUPABASE_URL"],
  env["VITE_SUPABASE_PUBLISHABLE_KEY"]
);

async function seed() {
  const pages = [
    {
      title: "BrokersConnect — India's verified broker marketplace",
      slug: "home",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "hero-1",
          type: "hero-with-preview",
          data: {
            eyebrow: "For verified real estate brokers only",
            title: "The broker network that actually connects.",
            subtitle: "BrokersConnect is India's first KYC-verified marketplace built for brokers, not buyers. List authentic inventory, collaborate on deals, and grow a trusted network — all in one place.",
            cta_primary: { label: "Get verified", url: "/auth/register" },
            cta_secondary: { label: "View pricing", url: "/pricing" }
          }
        },
        {
          id: "logos-1",
          type: "logo-cloud",
          data: {
            items: [
              "Verified by KYC",
              "RERA-aware",
              "Encrypted chat",
              "Audit logged",
              "Made in India"
            ]
          }
        },
        {
          id: "features-1",
          type: "features-grid",
          data: {
            eyebrow: "What you get",
            title: "A serious platform for serious brokers.",
            subtitle: "Everything you need to operate professionally — without buyer tire-kickers, fake leads or duplicate listings."
          },
          items: [
            { type: "feature", id: "f1", data: { icon: "ShieldCheck", title: "KYC-verified only", subtitle: "Every broker is reviewed by our staff against PAN, GST, RERA and identity documents." } },
            { type: "feature", id: "f2", data: { icon: "Building2", title: "Authentic inventory", subtitle: "Listings are moderated for accuracy and ownership before they go live." } },
            { type: "feature", id: "f3", data: { icon: "Users", title: "Broker-to-broker network", subtitle: "Discover peers by city, asset class and ticket size. Send connection requests and collaborate on closures." } },
            { type: "feature", id: "f4", data: { icon: "MessagesSquare", title: "Built-in chat & deals", subtitle: "Negotiate, share documents and track deal stages in one workspace — no scattered WhatsApp threads." } },
            { type: "feature", id: "f5", data: { icon: "BadgeCheck", title: "Trust by default", subtitle: "Public verification badges, transparent activity history and staff-moderated reporting keep the marketplace clean." } },
            { type: "feature", id: "f6", data: { icon: "Sparkles", title: "AI-ready matching", subtitle: "Smart suggestions surface the right brokers and properties for every requirement you post." } }
          ]
        },
        {
          id: "workflow-1",
          type: "timeline",
          data: {
            eyebrow: "How it works",
            title: "From signup to closure, in one workflow.",
            cta: { label: "Start your verification", url: "/auth/register" }
          },
          items: [
            { type: "step", id: "s1", data: { num: "01", title: "Register & submit KYC", subtitle: "Create your account and upload PAN, GST and RERA details. Our staff reviews within 24 hours." } },
            { type: "step", id: "s2", data: { num: "02", title: "Publish inventory", subtitle: "Add residential, commercial, plot or rental listings with photos, documents and ticket size." } },
            { type: "step", id: "s3", data: { num: "03", title: "Connect with peers", subtitle: "Search brokers by city and asset class. Send requests, chat, and share requirements." } },
            { type: "step", id: "s4", data: { num: "04", title: "Close deals together", subtitle: "Track every conversation, offer and document inside a deal room until closure." } }
          ]
        },
        {
          id: "stats-1",
          type: "stats",
          data: {},
          items: [
            { type: "stat", id: "st1", data: { value: 24, suffix: " hrs", label: "Average KYC turnaround" } },
            { type: "stat", id: "st2", data: { value: 0, label: "Unverified brokers allowed" } },
            { type: "stat", id: "st3", data: { value: 100, suffix: "%", label: "Listings moderated" } },
            { type: "stat", id: "st4", data: { value: 1, label: "Workspace for every deal" } }
          ]
        },
        {
          id: "cta-1",
          type: "cta",
          data: {
            title: "Stop chasing fake leads. Start closing real deals.",
            subtitle: "Join the broker-only network India's professionals have been waiting for.",
            cta_primary: { label: "Create broker account", url: "/auth/register" },
            cta_secondary: { label: "Talk to sales →", url: "/contact" }
          }
        }
      ]
    },
    {
      title: "Blog",
      slug: "blog",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "blog-hero",
          type: "hero",
          data: {
            eyebrow: "Our Blog",
            title: "Insights, updates, and news from BrokersConnect.",
            subtitle: "Stay up to date with the latest features and industry trends."
          }
        },
        {
          id: "blog-list",
          type: "blog-list",
          data: {}
        }
      ]
    },
    {
      title: "About",
      slug: "about",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "1",
          type: "hero",
          data: {
            eyebrow: "About",
            title: "We're building the trust layer for Indian real estate.",
            subtitle: "BrokersConnect is a B2B platform built exclusively for real estate brokers. We verify professionals through KYC, moderate every listing, and give brokers the tools they need to collaborate on real deals."
          }
        },
        {
          id: "2",
          type: "columns",
          data: {
            eyebrow: "Mission",
            title: "Every broker verified. Every listing authentic. Every connection genuine."
          },
          items: [
            { id: "2a", type: "rich-text", content: "<p>India's real estate market runs on relationships — and yet, brokers are forced to operate through fragmented WhatsApp groups, paid lead portals built for buyers, and unverified listings copy-pasted across the internet.</p><p>We think professionals deserve a platform of their own. One where the person on the other side of the deal is real, the inventory is genuine, and the tools actually fit the way deals happen.</p><p>BrokersConnect is built around three non-negotiables: <strong>verification before access</strong>, <strong>moderation before publication</strong>, and <strong>transparency in every interaction</strong>.</p>" }
          ]
        },
        {
          id: "3",
          type: "features-grid",
          data: {
            eyebrow: "Principles",
            columns: 3
          },
          items: [
            { id: "3a", type: "feature", data: { title: "Trust is the product", subtitle: "We'd rather grow slowly with verified brokers than quickly with anonymous ones." } },
            { id: "3b", type: "feature", data: { title: "Professional, not promotional", subtitle: "No flashy buyer ads. No vanity metrics. Tools that respect your time." } },
            { id: "3c", type: "feature", data: { title: "Built in India, for India", subtitle: "RERA-aware, GST-aware, and tuned to how Indian deals actually close." } }
          ]
        }
      ]
    },
    {
      title: "Pricing",
      slug: "pricing",
      page_type: "content",
      status: "published",
      template: "pricing",
      blocks: [
        {
          id: "p1",
          type: "hero",
          data: { eyebrow: "Pricing", title: "Simple, transparent pricing for real professionals.", subtitle: "Start for free. Upgrade when you need more power." }
        },
        {
          id: "p2",
          type: "pricing-table",
          data: {}
        }
      ]
    },
    {
      title: "Contact",
      slug: "contact",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "c1",
          type: "hero",
          data: { eyebrow: "Contact", title: "Get in touch", subtitle: "Have a question or need help? Our team is here for you." }
        },
        {
          id: "c2",
          type: "contact-form",
          data: {}
        }
      ]
    },
    {
      title: "FAQ",
      slug: "faq",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "f1",
          type: "faq",
          data: {
            eyebrow: "Support",
            title: "Frequently Asked Questions",
          },
          items: [
            { id: "fq1", type: "faq-item", data: { question: "What is BrokersConnect?", answer: "A B2B platform exclusively for verified real estate brokers." } },
            { id: "fq2", type: "faq-item", data: { question: "How does verification work?", answer: "We review PAN, GST, and RERA documents within 24 hours." } }
          ]
        }
      ]
    },
    {
      title: "Privacy Policy",
      slug: "privacy",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "pr1",
          type: "rich-text",
          content: "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>"
        }
      ]
    },
    {
      title: "Terms of Service",
      slug: "terms",
      page_type: "content",
      status: "published",
      template: "default",
      blocks: [
        {
          id: "t1",
          type: "rich-text",
          content: "<h1>Terms of Service</h1><p>By using BrokersConnect, you agree to these terms...</p>"
        }
      ]
    }
  ];

  for (const p of pages) {
    const { data: existing, error } = await supabase.from("pages").select("id").eq("slug", p.slug).maybeSingle();
    if (error) console.error("Error finding", p.slug, error);
    
    if (existing) {
      const { error: upErr } = await supabase.from("pages").update({ blocks: p.blocks, status: "published" }).eq("id", existing.id);
      if (upErr) console.error("Error updating", p.slug, upErr);
      else console.log("Updated", p.slug);
    } else {
      const { error: inErr } = await supabase.from("pages").insert(p);
      if (inErr) console.error("Error inserting", p.slug, inErr);
      else console.log("Inserted", p.slug);
    }
  }

  // Also seed navigation items if they don't exist
  const navItems = [
    { location: "header", label: "Home", href: "/", position: 1, visible: true, open_in_new_tab: false },
    { location: "header", label: "Pricing", href: "/pricing", position: 2, visible: true, open_in_new_tab: false },
    { location: "header", label: "About", href: "/about", position: 3, visible: true, open_in_new_tab: false },
    { location: "header", label: "Blog", href: "/blog", position: 4, visible: true, open_in_new_tab: false },
    { location: "header", label: "Contact", href: "/contact", position: 5, visible: true, open_in_new_tab: false },
    
    { location: "footer", label: "Pricing", href: "/pricing", position: 1, visible: true, open_in_new_tab: false },
    { location: "footer", label: "About", href: "/about", position: 2, visible: true, open_in_new_tab: false },
    { location: "footer", label: "Blog", href: "/blog", position: 3, visible: true, open_in_new_tab: false },
    { location: "footer", label: "Contact", href: "/contact", position: 4, visible: true, open_in_new_tab: false },
    { location: "footer", label: "Privacy Policy", href: "/privacy", position: 5, visible: true, open_in_new_tab: false },
    { location: "footer", label: "Terms of Service", href: "/terms", position: 6, visible: true, open_in_new_tab: false },
  ];

  const { data: navExisting } = await supabase.from("nav_items").select("id").limit(1);
  if (!navExisting || navExisting.length === 0) {
    for (const item of navItems) {
      await supabase.from("nav_items").insert(item);
    }
    console.log("Seeded nav items");
  } else {
    console.log("Nav items already exist");
  }

  // Seed site_settings
  const { data: setExisting } = await supabase.from("site_settings").select("id").limit(1);
  if (!setExisting || setExisting.length === 0) {
    await supabase.from("site_settings").insert({
      brand_name: "BrokersConnect",
      singleton: true
    });
    console.log("Seeded site settings");
  } else {
    console.log("Site settings already exist");
  }
}

seed().catch(console.error);
