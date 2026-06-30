import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/use-permissions";
import { errMessage } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { Check } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — Admin" }] }),
  component: RolesPage,
});

type AppRole = Database["public"]["Enums"]["app_role"];
const ROLES: AppRole[] = ["admin", "staff", "broker"];

function RolesPage() {
  const { can } = usePermissions();
  const qc = useQueryClient();
  const editable = can("roles", "update");

  const permsQ = useQuery({
    queryKey: ["admin", "permissions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("id, resource, action, description")
        .order("resource", { ascending: true })
        .order("action", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const mapQ = useQuery({
    queryKey: ["admin", "role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("role, permission_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const grantSet = new Set((mapQ.data ?? []).map((r) => `${r.role}:${r.permission_id}`));

  const toggle = useMutation({
    mutationFn: async ({
      role,
      permissionId,
      grant,
    }: {
      role: AppRole;
      permissionId: string;
      grant: boolean;
    }) => {
      if (!editable) throw new Error("Forbidden: missing roles:update");
      if (grant) {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission_id: permissionId });
        if (error) throw error;
        await logAdminAction({
          action: "role.permission.grant",
          resource: "role_permissions",
          resource_id: `${role}:${permissionId}`,
          after: { role, permissionId },
        });
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .match({ role, permission_id: permissionId });
        if (error) throw error;
        await logAdminAction({
          action: "role.permission.revoke",
          resource: "role_permissions",
          resource_id: `${role}:${permissionId}`,
          before: { role, permissionId },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "role-permissions"] });
      qc.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  // Group by resource
  const byResource = new Map<string, typeof permsQ.data>();
  for (const p of permsQ.data ?? []) {
    const arr = byResource.get(p.resource) ?? [];
    arr.push(p);
    byResource.set(p.resource, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles &amp; Permissions</h1>
        <p className="text-sm text-slate-500">
          Granular permissions per role. Changes apply immediately to every signed-in user holding
          that role.
          {!editable && (
            <span className="ml-2 font-semibold text-amber-700">
              Read-only — you lack roles:update.
            </span>
          )}
        </p>
      </div>

      {permsQ.isPending || mapQ.isPending ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="w-24 px-3 py-2.5 text-center font-semibold">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(byResource.entries()).map(([resource, perms]) => (
                <RowGroup
                  key={resource}
                  resource={resource}
                  perms={perms ?? []}
                  grantSet={grantSet}
                  editable={editable}
                  pending={toggle.isPending}
                  onToggle={(role, permissionId, grant) =>
                    toggle.mutate({ role, permissionId, grant })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RowGroup({
  resource,
  perms,
  grantSet,
  editable,
  pending,
  onToggle,
}: {
  resource: string;
  perms: { id: string; action: string; description: string | null }[];
  grantSet: Set<string>;
  editable: boolean;
  pending: boolean;
  onToggle: (role: AppRole, permissionId: string, grant: boolean) => void;
}) {
  return (
    <>
      <tr className="border-b border-slate-200 bg-slate-50/60">
        <td
          colSpan={1 + ROLES.length}
          className="px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600"
        >
          {resource}
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p.id} className="border-b border-slate-100 last:border-0">
          <td className="px-5 py-2.5">
            <div className="font-medium text-slate-900">{p.action}</div>
            {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
          </td>
          {ROLES.map((role) => {
            const granted = grantSet.has(`${role}:${p.id}`);
            return (
              <td key={role} className="px-3 py-2.5 text-center">
                <button
                  type="button"
                  disabled={!editable || pending}
                  onClick={() => onToggle(role, p.id, !granted)}
                  aria-pressed={granted}
                  className={
                    "inline-flex h-6 w-6 items-center justify-center rounded border transition " +
                    (granted
                      ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
                      : "border-slate-200 bg-white text-transparent hover:border-slate-300") +
                    (!editable ? " cursor-not-allowed opacity-60" : "")
                  }
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
