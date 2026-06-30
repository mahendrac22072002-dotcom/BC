import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit2, Layout, LayoutTemplate } from "lucide-react";

export const Route = createFileRoute("/admin/visual-builder")({
  head: () => ({ meta: [{ title: "Visual Builder" }] }),
  component: VisualBuilder,
});

function VisualBuilder() {
  const q = useQuery({
    queryKey: ["admin", "pages-for-visual-builder"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("id, title, slug, status").order("title");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visual Builder</h1>
          <p className="text-sm text-zinc-500">Select a page to edit visually with the Drag & Drop builder.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {q.isPending ? (
          <div className="col-span-full p-8 text-center text-sm text-zinc-500">Loading pages...</div>
        ) : q.data?.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center">
            <LayoutTemplate className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
            <div className="text-sm font-medium">No pages found</div>
            <div className="text-xs text-zinc-500 mt-1">Create a page in the CMS first to edit it visually.</div>
          </div>
        ) : (
          q.data?.map(page => (
            <div key={page.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-zinc-400" />
                  <h3 className="font-semibold text-zinc-900">{page.title}</h3>
                </div>
                <div className="mt-1 font-mono text-[10px] text-zinc-500">/{page.slug}</div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${page.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {page.status}
                </span>
                {/* Visual builder canvas route to be implemented */}
                <Button size="sm" variant="secondary" asChild className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Link to={`/admin/cms/pages/${page.id}`}>
                    <Edit2 className="mr-1.5 h-3 w-3" /> Edit Visual
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
