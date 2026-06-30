import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMessage, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — Admin" }] }),
  component: ApiKeysPage,
});

type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomKey(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ApiKeysPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const keysQ = useQuery({
    queryKey: ["admin", "api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const raw = `bc_${randomKey()}`;
      const prefix = raw.slice(0, 10);
      const hashed = await sha256Hex(raw);
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("api_keys")
        .insert({ name, prefix, hashed_key: hashed, created_by: u.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({ action: "apikey.create", resource: "api_keys", resource_id: data.id, after: { name, prefix } });
      return raw;
    },
    onSuccess: (raw) => {
      setNewKey(raw);
      setName("");
      qc.invalidateQueries({ queryKey: ["admin", "api-keys"] });
      toast.success("API key created");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const revoke = useMutation({
    mutationFn: async (k: ApiKey) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", k.id);
      if (error) throw error;
      await logAdminAction({ action: "apikey.revoke", resource: "api_keys", resource_id: k.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (k: ApiKey) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", k.id);
      if (error) throw error;
      await logAdminAction({ action: "apikey.delete", resource: "api_keys", resource_id: k.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Keys</h1>
        <p className="mt-1 text-sm text-slate-500">
          Issue keys for server-to-server integrations. Only the hashed value is stored — copy the key when it is shown.
        </p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <Input className="flex-1 min-w-[200px]" placeholder="Key name (e.g. CRM Sync)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="h-4 w-4" /> Generate
          </Button>
        </div>
        {newKey && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
            <div className="font-semibold text-amber-900">Copy this now — it will not be shown again:</div>
            <code className="mt-2 block break-all rounded bg-white p-2 font-mono text-xs">{newKey}</code>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewKey(null)}>I've copied it</Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Prefix</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(keysQ.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500"><KeyRound className="mx-auto mb-2 h-6 w-6" /> No keys yet.</td></tr>
            )}
            {(keysQ.data ?? []).map((k) => (
              <tr key={k.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-semibold">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{k.prefix}…</td>
                <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(k.created_at)}</td>
                <td className="px-4 py-3">
                  {k.revoked_at ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Revoked</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!k.revoked_at && (
                    <Button size="sm" variant="outline" onClick={() => revoke.mutate(k)}>Revoke</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(k)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
