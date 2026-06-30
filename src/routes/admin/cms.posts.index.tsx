import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/cms/posts/")({
  head: () => ({ meta: [{ title: "Blog — CMS" }] }),
  component: PostsList,
});

type Post = Database["public"]["Tables"]["blog_posts"]["Row"];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function PostsList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const postsQ = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const create = useMutation({
    mutationFn: async (t: string) => {
      const slug = slugify(t) || `post-${Date.now()}`;
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({ title: t, slug, body: "", author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        action: "cms.posts.create",
        resource: "blog_posts",
        resource_id: data.id,
        after: { slug, title: t },
      });
    },
    onSuccess: () => {
      toast.success("Post created");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog — Posts</h1>
        <p className="text-sm text-slate-500">Editorial content for /blog.</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate(title.trim());
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New post title…"
          maxLength={160}
        />
        <Button type="submit" disabled={create.isPending || !title.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Create
        </Button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(postsQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No posts yet.
                </td>
              </tr>
            ) : (
              postsQ.data!.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600">/blog/{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{relativeTime(p.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/cms/posts/$id"
                      params={{ id: p.id }}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
