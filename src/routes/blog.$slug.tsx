import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { relativeTime } from "@/lib/format";
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
      { name: "description", content: loaderData?.post.seo_description ?? loaderData?.post.excerpt ?? "" },
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

  return (
    <SiteLayout>
      <article className="container-tight py-16 md:py-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All articles
        </Link>
        <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full border border-hairline px-2 py-0.5 font-semibold uppercase tracking-widest text-foreground">
            Article
          </span>
          <span>{relativeTime(post.published_at)}</span>
          {post.reading_minutes ? (
            <>
              <span>·</span>
              <span>{post.reading_minutes} min read</span>
            </>
          ) : null}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{post.excerpt}</p>
        )}
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt=""
            className="mt-10 aspect-[16/9] w-full rounded-2xl border border-hairline object-cover"
          />
        )}
        <div className="prose prose-zinc mt-10 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {post.body}
        </div>
      </article>
    </SiteLayout>
  );
}
