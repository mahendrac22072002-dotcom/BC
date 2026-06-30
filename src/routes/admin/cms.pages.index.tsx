import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Copy, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/cms/pages/")({
  head: () => ({ meta: [{ title: "Pages — CMS" }] }),
  component: PagesList,
});

type Page = Database["public"]["Tables"]["pages"]["Row"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function PagesList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Page | null>(null);

  const pagesQ = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Page[];
    },
  });

  const create = useMutation({
    mutationFn: async (t: string) => {
      const slug = slugify(t) || `page-${Date.now()}`;
      const { data, error } = await supabase
        .from("pages")
        .insert({ title: t, slug, author_id: user!.id, body: "" })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.create",
        resource: "pages",
        resource_id: data.id,
        after: { slug, title: t },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Page created");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const duplicate = useMutation({
    mutationFn: async (p: Page) => {
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
          author_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.duplicate",
        resource: "pages",
        resource_id: data.id,
        metadata: { from: p.id },
      });
    },
    onSuccess: () => {
      toast.success("Duplicated");
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const archive = useMutation({
    mutationFn: async (p: Page) => {
      const { error } = await supabase
        .from("pages")
        .update({ status: "archived" })
        .eq("id", p.id);
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.archive",
        resource: "pages",
        resource_id: p.id,
      });
    },
    onSuccess: () => {
      toast.success("Archived");
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const restore = useMutation({
    mutationFn: async (p: Page) => {
      const { error } = await supabase
        .from("pages")
        .update({ status: "draft" })
        .eq("id", p.id);
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.restore",
        resource: "pages",
        resource_id: p.id,
      });
    },
    onSuccess: () => {
      toast.success("Restored to draft");
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (p: Page) => {
      // Clean up dependent references first so FK constraints don't block.
      await supabase.from("nav_items").delete().eq("href", `/${p.slug}`);
      await supabase.from("page_revisions").delete().eq("page_id", p.id);
      const { error } = await supabase.from("pages").delete().eq("id", p.id);
      if (error) throw error;
      await logAdminAction({
        action: "cms.pages.delete",
        resource: "pages",
        resource_id: p.id,
        before: { slug: p.slug, title: p.title, status: p.status },
      });
    },
    onSuccess: () => {
      toast.success("Page deleted permanently");
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CMS — Pages</h1>
        <p className="text-sm text-slate-500">Marketing & legal pages.</p>
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
          placeholder="New page title…"
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
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(pagesQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No pages yet.
                </td>
              </tr>
            ) : (
              pagesQ.data!.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600">/{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{relativeTime(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                        <Link to="/admin/cms/pages/$id" params={{ id: p.id }}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => duplicate.mutate(p)}
                        disabled={duplicate.isPending}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate
                      </Button>
                      {p.status === "archived" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => restore.mutate(p)}
                          disabled={restore.isPending}
                        >
                          <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => archive.mutate(p)}
                          disabled={archive.isPending}
                        >
                          <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setConfirmDelete(p)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-900">{confirmDelete?.title}</span>
              {" "}(/{confirmDelete?.slug})? This will also remove its revisions and nav
              references. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) remove.mutate(confirmDelete);
              }}
              disabled={remove.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {remove.isPending ? "Deleting…" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
