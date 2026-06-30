import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  const pages = [
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
          type: "grid",
          data: {
            eyebrow: "Principles",
            columns: 3
          },
          items: [
            { id: "3a", type: "rich-text", data: { title: "Trust is the product" }, content: "We'd rather grow slowly with verified brokers than quickly with anonymous ones." },
            { id: "3b", type: "rich-text", data: { title: "Professional, not promotional" }, content: "No flashy buyer ads. No vanity metrics. Tools that respect your time." },
            { id: "3c", type: "rich-text", data: { title: "Built in India, for India" }, content: "RERA-aware, GST-aware, and tuned to how Indian deals actually close." }
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
        }
      ]
    }
  ];

  for (const p of pages) {
    const { data: existing } = await supabase.from("pages").select("id").eq("slug", p.slug).maybeSingle();
    if (existing) {
      await supabase.from("pages").update({ blocks: p.blocks, status: "published" }).eq("id", existing.id);
      console.log("Updated", p.slug);
    } else {
      await supabase.from("pages").insert(p);
      console.log("Inserted", p.slug);
    }
  }
}

seed().catch(console.error);
