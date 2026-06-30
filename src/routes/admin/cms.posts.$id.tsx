import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/cms/posts/$id")({
  head: () => ({ meta: [{ title: "Edit Post — Blog" }] }),
  component: EditPost,
});

type Post = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogStatus = Database["public"]["Enums"]["blog_status"];

function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function EditPost() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const postQ = useQuery({
    queryKey: ["admin", "post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Post;
    },
  });

  const [form, setForm] = useState<Partial<Post>>({});
  useEffect(() => {
    if (postQ.data) setForm(postQ.data);
  }, [postQ.data]);

  const save = useMutation({
    mutationFn: async (publish?: boolean) => {
      const before = postQ.data!;
      const patch: Partial<Post> = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        body: form.body ?? "",
        cover_url: form.cover_url,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        scheduled_at: form.scheduled_at,
        reading_minutes: readingMinutes(form.body ?? ""),
        status: publish ? "published" : ((form.status as BlogStatus) ?? "draft"),
        published_at: publish ? new Date().toISOString() : before.published_at,
      };
      const { error } = await supabase.from("blog_posts").update(patch as never).eq("id", id);
      if (error) throw error;
      await logAdminAction({
        action: publish ? "cms.posts.publish" : "cms.posts.update",
        resource: "blog_posts",
        resource_id: id,
        before: { status: before.status },
        after: patch,
      });
    },
    onSuccess: (_d, publish) => {
      toast.success(publish ? "Published" : "Saved");
      qc.invalidateQueries({ queryKey: ["admin", "post", id] });
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction({
        action: "cms.posts.delete",
        resource: "blog_posts",
        resource_id: id,
      });
    },
    onSuccess: () => {
      toast.success("Deleted");
      navigate({ to: "/admin/cms/posts" });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (postQ.isPending) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!postQ.data) return <p className="text-sm text-slate-500">Not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/cms/posts"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" /> All posts
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{postQ.data.title}</h1>
          <p className="text-xs text-slate-500">
            {postQ.data.status} · updated {relativeTime(postQ.data.updated_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
            Save draft
          </Button>
          <Button onClick={() => save.mutate(true)} disabled={save.isPending}>
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <Field label="Title">
            <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label="Excerpt">
            <Textarea
              rows={3}
              value={form.excerpt ?? ""}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </Field>
          <Field label="Body (markdown)">
            <Textarea
              rows={20}
              value={form.body ?? ""}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <Field label="Status">
              <Select
                value={(form.status as string) ?? "draft"}
                onValueChange={(v) => setForm({ ...form, status: v as BlogStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["draft", "scheduled", "published", "archived"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cover image URL">
              <Input
                value={form.cover_url ?? ""}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Schedule for">
              <Input
                type="datetime-local"
                value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">SEO</div>
            <Field label="SEO title">
              <Input
                value={form.seo_title ?? ""}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              />
            </Field>
            <Field label="SEO description">
              <Textarea
                rows={3}
                value={form.seo_description ?? ""}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              />
            </Field>
          </div>

          <Button
            variant="ghost"
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              if (confirm("Delete this post?")) del.mutate();
            }}
          >
            Delete post
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
