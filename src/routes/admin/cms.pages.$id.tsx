// Full CMS Page Editor — General / Content / SEO / Settings / Theme / Revisions,
// with split-screen live preview (iframe → /admin/cms/preview/$id?draft=1), autosave,
// publish workflow, schedule, duplicate, archive, delete, and revision restore.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bold,
  Code,
  Copy,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  History,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Monitor,
  Quote,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";
import { BlockEditor } from "@/components/cms/BlockEditor";

export const Route = createFileRoute("/admin/cms/pages/$id")({
  head: () => ({ meta: [{ title: "Edit Page — CMS" }] }),
  component: EditPage,
});

type Page = Database["public"]["Tables"]["pages"]["Row"];
type Revision = Database["public"]["Tables"]["page_revisions"]["Row"];
type PageStatus = Database["public"]["Enums"]["page_status"];

const VISIBILITY = ["public", "logged_in", "subscribers", "admins"] as const;
const TEMPLATES = ["landing", "marketing", "legal", "pricing", "blog", "faq", "custom", "route", "default"];
const CONTAINER_WIDTHS = [
  { v: "", label: "Default" },
  { v: "640px", label: "Narrow" },
  { v: "960px", label: "Medium" },
  { v: "1200px", label: "Wide" },
  { v: "100%", label: "Full" },
];
const HERO_STYLES = ["default", "centered", "split", "minimal", "image-bg"];
const ROBOTS_CHOICES = [
  "index,follow",
  "noindex,follow",
  "index,nofollow",
  "noindex,nofollow",
];
const TWITTER_CARDS = ["summary", "summary_large_image"];

type Theme = {
  background?: string;
  accent?: string;
  container_width?: string;
  hero_style?: string;
  animations?: boolean;
};

type FormState = Partial<Page> & { theme: Theme };

function deepEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function EditPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [tab, setTab] = useState("content");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<FormState | null>(null);
  const baselineRef = useRef<FormState | null>(null);

  const pageQ = useQuery({
    queryKey: ["admin", "page", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Page;
    },
  });

  const revisionsQ = useQuery({
    queryKey: ["admin", "page-revisions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_revisions")
        .select("*")
        .eq("page_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Revision[];
    },
  });

  const [form, setForm] = useState<FormState>({ theme: {} });
  useEffect(() => {
    if (pageQ.data) {
      const seed: FormState = {
        ...pageQ.data,
        theme: ((pageQ.data.theme as Theme) ?? {}) as Theme,
      };
      setForm(seed);
      formRef.current = seed;
      baselineRef.current = seed;
    }
  }, [pageQ.data]);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Autosave: every 4s, write to draft_body / draft_blocks if changed.
  useEffect(() => {
    const t = setInterval(async () => {
      const f = formRef.current;
      const b = baselineRef.current;
      if (!f || !b) return;
      if (f.body === b.body && deepEqual(f.blocks, b.blocks)) return;
      const { error } = await supabase
        .from("pages")
        .update({ draft_body: f.body ?? "", draft_blocks: (f.blocks as never) ?? null })
        .eq("id", id);
      if (!error) {
        setSavedAt(new Date());
        baselineRef.current = { ...b, body: f.body, blocks: f.blocks };
      }
    }, 4000);
    return () => clearInterval(t);
  }, [id]);

  const save = useMutation({
    mutationFn: async (publish?: boolean) => {
      const before = pageQ.data!;
      const patch: Partial<Page> = {
        title: form.title,
        slug: form.slug,
        body: form.body,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        template: form.template,
        page_type: form.page_type,
        status: publish ? "published" : (form.status as PageStatus),
        published_at: publish ? new Date().toISOString() : before.published_at,
        scheduled_at: form.scheduled_at,
        featured: form.featured ?? false,
        icon: form.icon,
        keywords: form.keywords,
        canonical_url: form.canonical_url,
        og_image: form.og_image,
        twitter_card: form.twitter_card,
        robots: form.robots,
        schema_jsonld: form.schema_jsonld as never,
        visibility: form.visibility,
        show_in_nav: form.show_in_nav ?? false,
        show_in_footer: form.show_in_footer ?? false,
        nav_order: form.nav_order ?? 0,
        parent_id: form.parent_id,
        theme: form.theme as never,
        blocks: (form.blocks as never) ?? [],
        draft_body: null,
        draft_blocks: null,
      };
      const { error } = await supabase.from("pages").update(patch as never).eq("id", id);
      if (error) throw error;
      const { error: revErr } = await supabase.from("page_revisions").insert({
        page_id: id,
        editor_id: user!.id,
        snapshot: patch as never,
        reason: publish ? "publish" : "save",
      });
      if (revErr) console.warn(revErr);
      await logAdminAction({
        action: publish ? "cms.pages.publish" : "cms.pages.update",
        resource: "pages",
        resource_id: id,
        before: { status: before.status },
        after: patch,
      });
    },
    onSuccess: (_d, publish) => {
      toast.success(publish ? "Published" : "Saved");
      setSavedAt(new Date());
      qc.invalidateQueries({ queryKey: ["admin", "page", id] });
      qc.invalidateQueries({ queryKey: ["admin", "page-revisions", id] });
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const unpublish = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pages")
        .update({ status: "draft", published_at: null })
        .eq("id", id);
      if (error) throw error;
      await logAdminAction({ action: "cms.pages.unpublish", resource: "pages", resource_id: id });
    },
    onSuccess: () => {
      toast.success("Unpublished");
      qc.invalidateQueries({ queryKey: ["admin", "page", id] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const duplicate = useMutation({
    mutationFn: async () => {
      const p = pageQ.data!;
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title: `${p.title} (copy)`,
          slug: `${p.slug}-copy-${Date.now().toString(36)}`,
          body: p.body,
          seo_title: p.seo_title,
          seo_description: p.seo_description,
          template: p.template,
          page_type: p.page_type,
          theme: p.theme as never,
          blocks: p.blocks as never,
          author_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.duplicate",
        resource: "pages",
        resource_id: data.id,
        metadata: { from: id },
      });
      return data;
    },
    onSuccess: (d) => {
      toast.success("Duplicated");
      navigate({ to: "/admin/cms/pages/$id", params: { id: d.id } });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pages").update({ status: "archived" }).eq("id", id);
      if (error) throw error;
      await logAdminAction({ action: "cms.pages.archive", resource: "pages", resource_id: id });
    },
    onSuccess: () => {
      toast.success("Archived");
      qc.invalidateQueries({ queryKey: ["admin", "page", id] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction({ action: "cms.pages.delete", resource: "pages", resource_id: id });
    },
    onSuccess: () => {
      toast.success("Deleted");
      navigate({ to: "/admin/cms/pages" });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const restore = useMutation({
    mutationFn: async (rev: Revision) => {
      const snap = rev.snapshot as Partial<Page>;
      const { error } = await supabase.from("pages").update(snap as never).eq("id", id);
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.restore",
        resource: "pages",
        resource_id: id,
        metadata: { revision_id: rev.id },
      });
    },
    onSuccess: () => {
      toast.success("Restored");
      qc.invalidateQueries({ queryKey: ["admin", "page", id] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  function insertAtCursor(before: string, after = "") {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = form.body ?? "";
    const selected = text.slice(start, end);
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    setForm({ ...form, body: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }

  async function handleImageUpload(file: File) {
    try {
      const { uploadImage: uploadUtility } = await import("@/lib/imageUpload");
      const { path } = await uploadUtility({
        bucket: "media",
        file,
        category: "cms",
        folder: `cms/${id}`,
        upsert: false
      });
      const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (data?.signedUrl) {
        insertAtCursor(`![${file.name}](${data.signedUrl})`);
        toast.success("Image inserted");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to upload image");
    }
  }

  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? 820 : 390;
  const baseUrl = useMemo(() => `/admin/cms/preview/${id}?draft=1&t=${savedAt?.getTime() ?? 0}`, [id, savedAt]);

  if (pageQ.isPending) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!pageQ.data) return <p className="text-sm text-slate-500">Not found.</p>;

  const statusBadge = pageQ.data.status;

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[640px] flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/cms/pages"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Pages
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">{pageQ.data.title}</h1>
            <p className="text-[11px] text-slate-500">
              <Badge variant="outline" className="mr-1.5 capitalize">
                {statusBadge}
              </Badge>
              /{pageQ.data.slug} · updated {relativeTime(pageQ.data.updated_at)}
              {savedAt && <span className="ml-2 text-emerald-600">· autosaved {relativeTime(savedAt.toISOString())}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => duplicate.mutate()} disabled={duplicate.isPending}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate
          </Button>
          {pageQ.data.status === "published" ? (
            <Button variant="outline" size="sm" onClick={() => unpublish.mutate()} disabled={unpublish.isPending}>
              Unpublish
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
              <Save className="mr-1 h-3.5 w-3.5" /> Save draft
            </Button>
          )}
          <Button size="sm" onClick={() => save.mutate(true)} disabled={save.isPending}>
            Publish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            title="Toggle preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid min-h-0 flex-1 gap-4" style={{ gridTemplateColumns: previewOpen ? "minmax(0,1fr) minmax(0,1fr)" : "1fr" }}>
        {/* Editor pane */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="m-2 self-start">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="revisions">
                <History className="mr-1 h-3 w-3" /> Revisions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex min-h-0 flex-1 flex-col overflow-y-auto gap-2 px-4 pb-4">
              <BlockEditor 
                blocks={((form.blocks as any[]) || []) as import("@/types/blocks").PageBlock[]} 
                onChange={(blocks) => setForm({ ...form, blocks: blocks as any })} 
              />
            </TabsContent>

            <TabsContent value="general" className="space-y-4 p-4">
              <Field label="Title">
                <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Slug" hint="URL path under /">
                <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </Field>
              <Field label="Page icon" hint="Emoji or short text shown in nav">
                <Input
                  maxLength={4}
                  value={form.icon ?? ""}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-24"
                />
              </Field>
              <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <Label className="text-sm">Featured</Label>
                  <p className="text-xs text-slate-500">Highlight this page across the site.</p>
                </div>
                <Switch
                  checked={form.featured ?? false}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
              </div>
              <Field label="Status">
                <Select
                  value={(form.status as string) ?? "draft"}
                  onValueChange={(v) => setForm({ ...form, status: v as PageStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["draft", "published", "scheduled", "archived"] as const).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Schedule publish">
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
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 p-4">
              <Field label="SEO title">
                <Input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                <p className="text-[11px] text-slate-500">{(form.seo_title?.length ?? 0)}/60</p>
              </Field>
              <Field label="Meta description">
                <Textarea
                  rows={3}
                  value={form.seo_description ?? ""}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                />
                <p className="text-[11px] text-slate-500">{(form.seo_description?.length ?? 0)}/160</p>
              </Field>
              <Field label="Keywords" hint="Comma-separated">
                <Input value={form.keywords ?? ""} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </Field>
              <Field label="Canonical URL">
                <Input value={form.canonical_url ?? ""} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="OpenGraph image URL">
                <Input value={form.og_image ?? ""} onChange={(e) => setForm({ ...form, og_image: e.target.value })} placeholder="https://…/og.jpg" />
              </Field>
              <Field label="Twitter card">
                <Select value={form.twitter_card ?? "summary_large_image"} onValueChange={(v) => setForm({ ...form, twitter_card: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TWITTER_CARDS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Robots">
                <Select value={form.robots ?? "index,follow"} onValueChange={(v) => setForm({ ...form, robots: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROBOTS_CHOICES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Schema JSON-LD">
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  placeholder='{"@context":"https://schema.org","@type":"WebPage"}'
                  value={form.schema_jsonld ? JSON.stringify(form.schema_jsonld, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const v = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                      setForm({ ...form, schema_jsonld: v });
                    } catch {
                      // keep typing — only commit on parse success
                    }
                  }}
                />
              </Field>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 p-4">
              <Field label="Visibility">
                <Select value={form.visibility ?? "public"} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY.map((v) => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Template">
                <Select value={form.template ?? "default"} onValueChange={(v) => setForm({ ...form, template: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <Label className="text-sm">Show in navbar</Label>
                  <p className="text-xs text-slate-500">Top header navigation</p>
                </div>
                <Switch checked={form.show_in_nav ?? false} onCheckedChange={(v) => setForm({ ...form, show_in_nav: v })} />
              </div>
              <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <Label className="text-sm">Show in footer</Label>
                  <p className="text-xs text-slate-500">Site footer column</p>
                </div>
                <Switch checked={form.show_in_footer ?? false} onCheckedChange={(v) => setForm({ ...form, show_in_footer: v })} />
              </div>
              <Field label="Order">
                <Input
                  type="number"
                  value={form.nav_order ?? 0}
                  onChange={(e) => setForm({ ...form, nav_order: parseInt(e.target.value || "0", 10) })}
                  className="w-32"
                />
              </Field>
              <Field label="Parent page slug" hint="Optional parent for nested nav">
                <ParentSelect
                  currentId={id}
                  value={form.parent_id ?? null}
                  onChange={(v) => setForm({ ...form, parent_id: v })}
                />
              </Field>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4 p-4">
              <Field label="Page background">
                <Input
                  type="color"
                  value={form.theme.background ?? "#ffffff"}
                  onChange={(e) => setForm({ ...form, theme: { ...(form.theme as Theme), background: e.target.value } })}
                  className="h-10 w-24 p-1"
                />
              </Field>
              <Field label="Accent color">
                <Input
                  type="color"
                  value={form.theme.accent ?? "#0f172a"}
                  onChange={(e) => setForm({ ...form, theme: { ...(form.theme as Theme), accent: e.target.value } })}
                  className="h-10 w-24 p-1"
                />
              </Field>
              <Field label="Container width">
                <Select
                  value={form.theme.container_width ?? ""}
                  onValueChange={(v) => setForm({ ...form, theme: { ...(form.theme as Theme), container_width: v } })}
                >
                  <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                  <SelectContent>
                    {CONTAINER_WIDTHS.map((c) => <SelectItem key={c.label} value={c.v || "_default"}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Hero style">
                <Select
                  value={form.theme.hero_style ?? "default"}
                  onValueChange={(v) => setForm({ ...form, theme: { ...(form.theme as Theme), hero_style: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HERO_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <Label className="text-sm">Enable animations</Label>
                  <p className="text-xs text-slate-500">Subtle scroll & hover motion</p>
                </div>
                <Switch
                  checked={form.theme.animations ?? true}
                  onCheckedChange={(v) => setForm({ ...form, theme: { ...(form.theme as Theme), animations: v } })}
                />
              </div>
            </TabsContent>

            <TabsContent value="revisions" className="space-y-2 p-4">
              {(revisionsQ.data ?? []).length === 0 ? (
                <p className="text-xs text-slate-400">No revisions yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded border border-slate-200 text-sm">
                  {revisionsQ.data!.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium capitalize">{r.reason ?? "save"}</p>
                        <p className="text-[11px] text-slate-500">{relativeTime(r.created_at)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Restore this revision? Current content will be overwritten.")) restore.mutate(r);
                        }}
                      >
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Delete this page permanently? This cannot be undone.")) del.mutate();
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete page
                </Button>
                {pageQ.data.status !== "archived" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => archive.mutate()}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview pane */}
        {previewOpen && (
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700">Live preview</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={`rounded p-1.5 ${device === "desktop" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("tablet")}
                  className={`rounded p-1.5 ${device === "tablet" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Tablet className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={`rounded p-1.5 ${device === "mobile" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <div className="mx-auto h-full bg-white shadow-sm" style={{ width: deviceWidth, maxWidth: "100%" }}>
                <iframe
                  title="Page preview"
                  src={baseUrl}
                  className="h-full w-full border-0"
                  style={{ minHeight: 600 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

type ToolbarCmd =
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "quote"
  | "code"
  | "ul"
  | "ol"
  | "hr"
  | "link";

function Toolbar({ onCmd, onImage }: { onCmd: (cmd: ToolbarCmd) => void; onImage: (f: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const btn = "rounded p-1.5 text-slate-600 hover:bg-slate-100";
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 pb-2">
      <button type="button" className={btn} onClick={() => onCmd("h1")} title="Heading 1"><Heading1 className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("h2")} title="Heading 2"><Heading2 className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("h3")} title="Heading 3"><Heading3 className="h-4 w-4" /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button type="button" className={btn} onClick={() => onCmd("bold")} title="Bold"><Bold className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("italic")} title="Italic"><Italic className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("code")} title="Inline code"><Code className="h-4 w-4" /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button type="button" className={btn} onClick={() => onCmd("ul")} title="Bullet list"><List className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("ol")} title="Numbered list"><ListOrdered className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("quote")} title="Quote"><Quote className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => onCmd("hr")} title="Divider"><Minus className="h-4 w-4" /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button type="button" className={btn} onClick={() => onCmd("link")} title="Link"><LinkIcon className="h-4 w-4" /></button>
      <button type="button" className={btn} onClick={() => fileRef.current?.click()} title="Image">
        <ImageIcon className="h-4 w-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImage(f);
          e.currentTarget.value = "";
        }}
      />
      <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-400">
        <Upload className="h-3 w-3" /> autosave
      </span>
    </div>
  );
}

function runToolbar(cmd: ToolbarCmd, insert: (b: string, a?: string) => void) {
  switch (cmd) {
    case "h1": return insert("\n# ", "");
    case "h2": return insert("\n## ", "");
    case "h3": return insert("\n### ", "");
    case "bold": return insert("**", "**");
    case "italic": return insert("*", "*");
    case "code": return insert("`", "`");
    case "ul": return insert("\n- ", "");
    case "ol": return insert("\n1. ", "");
    case "quote": return insert("\n> ", "");
    case "hr": return insert("\n\n---\n\n", "");
    case "link": return insert("[", "](https://)");
  }
}

function ParentSelect({
  currentId,
  value,
  onChange,
}: {
  currentId: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const q = useQuery({
    queryKey: ["admin", "pages", "parent-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("id, title").order("title");
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <Select value={value ?? "_none"} onValueChange={(v) => onChange(v === "_none" ? null : v)}>
      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">— None —</SelectItem>
        {(q.data ?? [])
          .filter((p) => p.id !== currentId)
          .map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
