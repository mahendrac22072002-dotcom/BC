import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserCog, UserMinus, UserPlus } from "lucide-react";
import { errMessage, initials, relativeTime } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: UsersPage,
});

type AppRole = Database["public"]["Enums"]["app_role"];
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "firm" | "city" | "phone" | "kyc_status" | "suspended_at" | "created_at"
>;

function UsersPage() {
  const { user: me } = useAuth();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  // Fetch all role rows where role is admin or staff, then their profiles.
  const rolesQ = useQuery({
    queryKey: ["admin", "users", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "staff"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const userIds = useMemo(
    () => Array.from(new Set((rolesQ.data ?? []).map((r) => r.user_id))),
    [rolesQ.data],
  );

  const profilesQ = useQuery({
    queryKey: ["admin", "users", "profiles", userIds.slice().sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, firm, city, phone, kyc_status, suspended_at, created_at")
        .in("id", userIds);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const rolesByUser = useMemo(() => {
    const m = new Map<string, Set<AppRole>>();
    for (const r of rolesQ.data ?? []) {
      const set = m.get(r.user_id) ?? new Set<AppRole>();
      set.add(r.role as AppRole);
      m.set(r.user_id, set);
    }
    return m;
  }, [rolesQ.data]);

  const filtered = (profilesQ.data ?? []).filter((p) => {
    if (!search.trim()) return true;
    const hay = `${p.full_name ?? ""} ${p.firm ?? ""} ${p.city ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const toggleRole = useMutation({
    mutationFn: async ({
      userId,
      role,
      grant,
    }: {
      userId: string;
      role: AppRole;
      grant: boolean;
    }) => {
      if (!can("users", "update")) throw new Error("Forbidden: missing users:update");
      if (grant) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
        await logAdminAction({
          action: "user.role.grant",
          resource: "user_roles",
          resource_id: userId,
          after: { role },
        });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .match({ user_id: userId, role });
        if (error) throw error;
        await logAdminAction({
          action: "user.role.revoke",
          resource: "user_roles",
          resource_id: userId,
          before: { role },
        });
      }
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">Admins and staff with portal access.</p>
        </div>
        <InviteByEmail
          onInvite={(userId, role) => toggleRole.mutate({ userId, role, grant: true })}
          disabled={!can("users", "invite")}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <Input
            placeholder="Search by name, firm or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 max-w-sm border-slate-200"
          />
        </div>
        {rolesQ.isPending || profilesQ.isPending ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No admin or staff users found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">User</th>
                <th className="px-5 py-2.5 text-left font-semibold">Roles</th>
                <th className="px-5 py-2.5 text-left font-semibold">Joined</th>
                <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const roles = rolesByUser.get(p.id) ?? new Set<AppRole>();
                const isMe = p.id === me?.id;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                          {initials(p.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {p.full_name || "Unnamed"}
                            {isMe && (
                              <span className="ml-2 text-[10px] font-semibold uppercase text-blue-600">
                                you
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {[p.firm, p.city].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(["admin", "staff", "broker"] as AppRole[]).map((r) => {
                          const has = roles.has(r);
                          const disabled =
                            !can("users", "update") || (isMe && r === "admin" && has); // can't self-demote from admin
                          return (
                            <button
                              key={r}
                              type="button"
                              disabled={disabled || toggleRole.isPending}
                              onClick={() =>
                                toggleRole.mutate({ userId: p.id, role: r, grant: !has })
                              }
                              className={
                                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset transition " +
                                (has
                                  ? "bg-slate-900 text-white ring-slate-900 hover:bg-slate-700"
                                  : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50") +
                                (disabled ? " cursor-not-allowed opacity-60" : "")
                              }
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {relativeTime(p.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-slate-400">
                        <UserCog className="inline h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Click a role chip to grant or revoke. Inviting a new admin requires the user to already have
        a BrokersConnect account.
      </p>
    </div>
  );
}

function InviteByEmail({
  onInvite,
  disabled,
}: {
  onInvite: (userId: string, role: AppRole) => void;
  disabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      // Look up existing profile by exact email via auth.users is not possible client-side;
      // we resolve via a profiles row that brokers create their own auth and we cross-reference by phone/name otherwise.
      // Use the admin RPC pattern: find profile where id = (auth user id with email). Since auth.users isn't queryable
      // from client, we rely on inviting via existing broker phone or asking them to register first.
      // For this Phase 1 we require the user to already have signed up: we look them up by the public profiles.id
      // is auth.users.id. We search by email in auth via supabase.auth.admin — not available with anon key.
      // Workaround: require an existing profile match by email-derived check via RPC in a later phase.
      // Phase-1 minimal: tell user we need their UUID. Provide hint.
      toast.info(
        "Self-serve invite by email lands in Phase 1.5. For now, ask the user to sign up first, then grant their role from their broker row in the Brokers module.",
      );
      void onInvite;
      void role;
      void email;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 w-56 border-slate-200"
        disabled={disabled}
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as AppRole)}
        disabled={disabled}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <Button
        size="sm"
        onClick={go}
        disabled={disabled || busy}
        className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Invite
      </Button>
    </div>
  );
}
