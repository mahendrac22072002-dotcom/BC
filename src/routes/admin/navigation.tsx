import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMessage } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/navigation")({
  head: () => ({ meta: [{ title: "Navigation — Admin" }] }),
  component: NavigationPage,
});

type Loc = "header" | "footer";
type Item = {
  id: string;
  location: Loc;
  label: string;
  href: string;
  position: number;
  visible: boolean;
  open_in_new_tab: boolean;
};

function NavigationPage() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const editable = can("navigation", "manage");
  const [tab, setTab] = useState<Loc>("header");
  const [draft, setDraft] = useState({ label: "", href: "" });

  const q = useQuery({
    queryKey: ["admin", "nav", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .eq("location", tab)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const inval = () => qc.invalidateQueries({ queryKey: ["nav_items"] });

  const create = useMutation({
    mutationFn: async () => {
      if (!draft.label.trim() || !draft.href.trim()) throw new Error("Label and link required");
      const nextPos = ((q.data ?? []).at(-1)?.position ?? 0) + 10;
      const { data, error } = await supabase
        .from("nav_items")
        .insert({ location: tab, label: draft.label.trim(), href: draft.href.trim(), position: nextPos })
        .select().single();
      if (error) throw error;
      await logAdminAction({ action: "nav.create", resource: "nav_items", resource_id: data.id, after: draft });
    },
    onSuccess: () => {
      setDraft({ label: "", href: "" });
      qc.invalidateQueries({ queryKey: ["admin", "nav", tab] });
      inval();
      toast.success("Link added");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const patch = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Item> }) => {
      const { error } = await supabase.from("nav_items").update(patch).eq("id", id);
      if (error) throw error;
      await logAdminAction({ action: "nav.update", resource: "nav_items", resource_id: id, after: patch });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "nav", tab] });
      inval();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (item: Item) => {
      const { error } = await supabase.from("nav_items").delete().eq("id", item.id);
      if (error) throw error;
      await logAdminAction({ action: "nav.delete", resource: "nav_items", resource_id: item.id, before: item });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "nav", tab] });
      inval();
      toast.success("Removed");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  function move(item: Item, dir: -1 | 1) {
    const items = q.data ?? [];
    const idx = items.findIndex((i) => i.id === item.id);
    const swap = items[idx + dir];
    if (!swap) return;
    patch.mutate({ id: item.id, patch: { position: swap.position } });
    patch.mutate({ id: swap.id, patch: { position: item.position } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation Builder</h1>
          <p className="text-sm text-slate-500">Manage links shown in the public site header and footer.</p>
        </div>
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium">
          {(["header", "footer"] as Loc[]).map((l) => (
            <button
              key={l}
              onClick={() => setTab(l)}
              className={`rounded px-3 py-1.5 capitalize ${
                tab === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {editable && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
            <div>
              <Label className="text-xs font-semibold">Label</Label>
              <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Pricing" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Link (URL or path)</Label>
              <Input value={draft.href} onChange={(e) => setDraft({ ...draft, href: e.target.value })} placeholder="/pricing or https://…" />
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {q.isPending ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Loading…</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">No links in this menu yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(q.data ?? []).map((item, idx) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => move(item, -1)}
                    disabled={!editable || idx === 0}
                    className="rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(item, 1)}
                    disabled={!editable || idx === (q.data ?? []).length - 1}
                    className="rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={item.label}
                  disabled={!editable}
                  onChange={(e) => patch.mutate({ id: item.id, patch: { label: e.target.value } })}
                  className="h-8 w-40"
                />
                <Input
                  value={item.href}
                  disabled={!editable}
                  onChange={(e) => patch.mutate({ id: item.id, patch: { href: e.target.value } })}
                  className="h-8 flex-1 min-w-[200px]"
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.open_in_new_tab}
                    disabled={!editable}
                    onChange={(e) => patch.mutate({ id: item.id, patch: { open_in_new_tab: e.target.checked } })}
                  />
                  New tab
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editable}
                  className="h-8 gap-1"
                  onClick={() => patch.mutate({ id: item.id, patch: { visible: !item.visible } })}
                >
                  {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {item.visible ? "Visible" : "Hidden"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editable}
                  className="h-8 px-2 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Delete "${item.label}"?`)) remove.mutate(item);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
