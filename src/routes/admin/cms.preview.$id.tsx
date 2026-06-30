import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { PageBlock } from "@/types/blocks";

export const Route = createFileRoute("/admin/cms/preview/$id")({
  head: () => ({ meta: [{ title: "Preview — CMS" }, { name: "robots", content: "noindex" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch() as { draft?: string };
  const useDraft = search.draft !== "0";

  const q = useQuery({
    queryKey: ["cms-preview", id, useDraft],
    refetchInterval: 1500,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("title, body, draft_body, blocks, draft_blocks, theme, status")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isPending) return <div className="p-12 text-sm text-slate-500">Loading preview…</div>;
  if (!q.data) return <div className="p-12 text-sm text-slate-500">Page not found.</div>;

  const blocks = (useDraft ? (q.data.draft_blocks ?? q.data.blocks ?? []) : (q.data.blocks ?? [])) as unknown as PageBlock[];
  const theme = (q.data.theme as Record<string, string> | null) ?? {};

  // If there are no blocks but there is legacy body text, we can render it as a fallback
  const fallbackBody = useDraft ? (q.data.draft_body ?? q.data.body ?? "") : (q.data.body ?? "");

  return (
    <SiteLayout>
      <article
        className="container-tight py-16 md:py-24"
        style={{
          background: theme.background,
          maxWidth: theme.container_width,
        }}
      >
        <header className="mb-10 border-b border-hairline pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: theme.accent }}>
            {q.data.title}
          </h1>
          {q.data.status !== "published" && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Preview · {useDraft ? "Draft" : "Published"}
            </p>
          )}
        </header>
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} />
        ) : fallbackBody ? (
          <div
            className="prose prose-neutral max-w-none prose-headings:font-extrabold prose-headings:tracking-tight"
            dangerouslySetInnerHTML={{ __html: fallbackBody }}
          />
        ) : null}
      </article>
    </SiteLayout>
  );
}
