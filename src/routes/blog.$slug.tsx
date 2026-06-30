import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { relativeTime } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["blog_posts"]["Row"];

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { post: data as Post };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.seo_title ?? loaderData?.post.title} — BrokersConnect` },
      {
        name: "description",
        content: loaderData?.post.seo_description ?? loaderData?.post.excerpt ?? "",
      },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["public", "blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as Post;
    },
    initialData: Route.useLoaderData().post,
  });

  const post = data!;

  // Basic markdown header rendering for DB text
  const renderBody = (text: string) => {
    return text.split("\n\n").map((block, idx) => {
      if (block.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold mt-12 mb-4 text-foreground">
            {block.replace("## ", "")}
          </h2>
        );
      }
      return (
        <p key={idx} className="mb-6 text-lg text-muted-foreground leading-relaxed">
          {block}
        </p>
      );
    });
  };

  return (
    <SiteLayout>
      <article className="py-16 md:py-24 bg-background">
        <div className="container-tight max-w-4xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <div className="mt-12">
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 uppercase tracking-wider text-xs font-semibold">
              Founder Story
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 max-w-3xl text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-12 border-y border-hairline py-8 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
              <div className="flex flex-col gap-5 max-w-xl">
                <div className="w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] rounded-full overflow-hidden border shadow-sm shrink-0">
                  <img
                    src="/founder.jpeg"
                    alt="Ravinder Kumar"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div>
                  <div className="font-bold text-foreground text-lg">Ravinder Kumar</div>
                  <div className="text-sm text-muted-foreground mb-3 font-medium">
                    Founder, BrokersConnect
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                    Real estate professional building India's trusted broker network.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-5 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-3 font-medium">
                  <span>{relativeTime(post.published_at)}</span>
                  {post.reading_minutes ? (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                      <span>{post.reading_minutes} min read</span>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label="Copy Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-tight">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-zinc prose-lg">
              {post.body ? renderBody(post.body) : null}
            </div>

            {/* About the Founder Card */}
            <div className="mt-20 bg-muted/30 rounded-2xl p-8 md:p-10 border border-hairline flex flex-col sm:flex-row gap-8 items-start shadow-sm">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] rounded-full overflow-hidden border shadow-sm shrink-0">
                <img
                  src="/founder.jpeg"
                  alt="Ravinder Kumar"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground mb-2">About the Founder</h3>
                <div className="font-semibold text-foreground mb-3">Ravinder Kumar</div>
                <p className="text-muted-foreground leading-relaxed">
                  Real estate professional building India's trusted broker network. Dedicated to
                  removing friction from B2B real estate transactions and empowering verified
                  brokers to collaborate seamlessly.
                </p>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-16 bg-primary/5 rounded-3xl p-10 md:p-14 text-center border border-primary/10 shadow-sm">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
                Join BrokersConnect Today
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Connect Better.
                <br />
                Close Faster.
                <br />
                Grow Together.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className={buttonVariants({ size: "lg", className: "px-8 py-6 text-lg shadow-sm" })}
              >
                Join BrokersConnect
              </Link>
            </div>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}
