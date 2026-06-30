import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { usePermissions } from "@/hooks/use-permissions";
import { Trash2, Upload, Copy, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/media")({
  head: () => ({ meta: [{ title: "Media Library — Admin" }] }),
  component: MediaPage,
});

type Asset = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  folder: string;
  created_at: string;
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function AssetThumb({ path, mime }: { path: string; mime: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.storage.from("media").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [path]);
  if (!mime.startsWith("image/")) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
        {mime.split("/")[1]?.toUpperCase() ?? "FILE"}
      </div>
    );
  }
  return url ? (
    <img src={url} alt="" className="h-32 w-full rounded-md object-cover" />
  ) : (
    <div className="h-32 w-full animate-pulse rounded-md bg-slate-100" />
  );
}

function MediaPage() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const editable = can("media", "write");
  const deletable = can("media", "delete");
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Asset[];
    },
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      for (const file of Array.from(files)) {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        let width: number | null = null;
        let height: number | null = null;
        if (file.type.startsWith("image/")) {
          try {
            const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = reject;
              img.src = URL.createObjectURL(file);
            });
            width = dims.w;
            height = dims.h;
          } catch { /* ignore */ }
        }
        const { data: row, error: insErr } = await supabase.from("media_assets").insert({
          filename: file.name,
          storage_path: path,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          width,
          height,
          uploaded_by: userId ?? null,
        }).select().single();
        if (insErr) throw insErr;
        await logAdminAction({
          action: "media.upload",
          resource: "media_assets",
          resource_id: row.id,
          after: { filename: file.name, size_bytes: file.size },
        });
      }
    },
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (asset: Asset) => {
      const { error: sErr } = await supabase.storage.from("media").remove([asset.storage_path]);
      if (sErr) throw sErr;
      const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
      if (error) throw error;
      await logAdminAction({
        action: "media.delete",
        resource: "media_assets",
        resource_id: asset.id,
        before: { filename: asset.filename },
      });
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  async function copyPath(path: string) {
    await navigator.clipboard.writeText(path);
    toast.success("Path copied");
  }

  const filtered = (q.data ?? []).filter((a) =>
    a.filename.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-slate-500">Shared image and document storage for CMS, blog, and listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename"
            className="h-9 w-56"
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length) {
                upload.mutate(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={!editable || upload.isPending}
            className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      {!editable && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Read-only — you don't have media:write permission.
        </div>
      )}

      {q.isPending ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No media yet</p>
          <p className="mt-1 text-xs text-slate-500">Upload images, PDFs, or documents to reuse across the site.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <AssetThumb path={a.storage_path} mime={a.mime_type} />
              <div className="space-y-1 p-3">
                <div className="truncate text-sm font-medium text-slate-900">{a.filename}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatBytes(a.size_bytes)}</span>
                  <span>{relativeTime(a.created_at)}</span>
                </div>
                {a.width && a.height && (
                  <div className="text-[11px] text-slate-400">{a.width}×{a.height}</div>
                )}
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 gap-1 text-[11px]"
                    onClick={() => copyPath(a.storage_path)}
                  >
                    <Copy className="h-3 w-3" /> Path
                  </Button>
                  {deletable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Delete ${a.filename}?`)) remove.mutate(a);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
