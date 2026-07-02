import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/format";

export function BlogListBlock({ data }: { data?: any }) {
  const { data: posts, isPending } = useQuery({
    queryKey: ["public", "blog-posts"],
    queryFn: async () => {
      const { data: qData, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(data?.limit || 50);
      if (error) throw error;
      return qData ?? [];
    },
  });

  return (
    <section>
      <div className="container-tight py-16">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !posts || posts.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-surface p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No posts published yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-2">
            {posts.map((p) => (
              <article
                key={p.id}
                className="group bg-card p-8 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border border-hairline px-2 py-0.5 font-semibold uppercase tracking-widest text-foreground">
                    Article
                  </span>
                  <span>{relativeTime(p.published_at)}</span>
                  {p.reading_minutes ? (
                    <>
                      <span>·</span>
                      <span>{p.reading_minutes} min read</span>
                    </>
                  ) : null}
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
    </section>
  );
}
