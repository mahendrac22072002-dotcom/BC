import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { PageBlock } from "@/types/blocks";

export const Route = createFileRoute("/$slug")({
  head: ({ loaderData }) => {
    const p = loaderData as { title: string; seo_title: string | null; seo_description: string | null; slug: string } | undefined;
    if (!p) return {};
    const title = p.seo_title || `${p.title} — BrokersConnect`;
    return {
      meta: [
        { title },
        { name: "description", content: p.seo_description ?? "" },
        { property: "og:title", content: title },
        { property: "og:url", content: `/${p.slug}` },
      ],
      links: [{ rel: "canonical", href: `/${p.slug}` }],
    };
  },
  component: DynamicCmsPage,
});

type PageRow = {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  blocks: PageBlock[] | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  template: string | null;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(src: string) {
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      out.push(`<h3>${esc(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      flushList();
      out.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${esc(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else {
      flushList();
      const bolded = esc(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      out.push(`<p>${bolded}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}

function DynamicCmsPage() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id,title,slug,body,blocks,seo_title,seo_description,status,template")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("not_found");
      return data as PageRow;
    },
  });

  if (q.isPending) {
    return (
      <SiteLayout>
        <div className="container-tight py-24 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }
  if (q.error || !q.data) {
    return (
      <SiteLayout>
        <div className="container-tight py-24 text-center">
          <h1 className="text-3xl font-extrabold">Page not found</h1>
          <p className="mt-2 text-muted-foreground">The page you're looking for isn't available.</p>
        </div>
      </SiteLayout>
    );
  }

  // System routes have their own dedicated pages.
  if (q.data.template === "route") {
    return (
      <SiteLayout>
        <div className="container-tight py-24 text-center">
          <h1 className="text-3xl font-extrabold">{q.data.title}</h1>
          <p className="mt-2 text-muted-foreground">
            This page is managed by the platform. Visit it directly at /{q.data.slug}.
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="container-tight py-16 md:py-24">
        {q.data.blocks && q.data.blocks.length > 0 ? (
          <BlockRenderer blocks={q.data.blocks} />
        ) : (
          <>
            <header className="mb-10 border-b border-hairline pb-8">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{q.data.title}</h1>
            </header>
            <div
              className="prose prose-neutral max-w-none prose-headings:font-extrabold prose-headings:tracking-tight"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(q.data.body ?? "") }}
            />
          </>
        )}
      </article>
    </SiteLayout>
  );
}
