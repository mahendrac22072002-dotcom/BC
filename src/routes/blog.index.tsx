import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — BrokersConnect" },
      { name: "description", content: "Insights, updates, and news from BrokersConnect." },
    ],
  }),
  component: Blog,
});

function Blog() {
  const { data: posts, isPending } = useQuery({
    queryKey: ["public", "blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SiteLayout>
      <div className="container-tight py-16 md:py-24">
        <section className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Our Blog</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-6">
            Insights, updates, and news from BrokersConnect.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with the latest features and industry trends.
          </p>
        </section>

        {isPending ? (
          <div className="text-center text-sm text-muted-foreground">Loading posts...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center p-12 bg-surface rounded-2xl border border-hairline">
            <p className="text-muted-foreground">No posts published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <article key={p.id} className="group bg-card p-8 rounded-2xl border border-hairline transition-colors hover:bg-surface">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border border-hairline px-2 py-0.5 font-semibold uppercase tracking-widest text-foreground">
                    Article
                  </span>
                  <span>{relativeTime(p.published_at)}</span>
                  {p.reading_minutes && (
                    <>
                      <span>·</span>
                      <span>{p.reading_minutes} min read</span>
                    </>
                  )}
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight md:text-3xl">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                )}
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-foreground"
                >
                  Read article{" "}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
