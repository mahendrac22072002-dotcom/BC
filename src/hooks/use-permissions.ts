import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";

type PermRow = { resource: string; action: string };

/**
 * Returns the full permission set granted to the signed-in user (via their roles),
 * plus a `can(resource, action)` helper. Read once, evaluated client-side; RLS
 * + server-side `has_permission()` remain the source of truth for security.
 */
export function usePermissions() {
  const { user } = useAuth();
  const { roles } = useRoles();

  const query = useQuery({
    queryKey: ["permissions", user?.id, roles.slice().sort().join(",")],
    enabled: !!user && roles.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PermRow[]> => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permissions ( resource, action ), role")
        .in("role", roles);
      if (error) throw error;
      return (data ?? [])
        .map((r: { permissions: PermRow | null }) => r.permissions)
        .filter((p): p is PermRow => !!p);
    },
  });

  const set = new Set((query.data ?? []).map((p) => `${p.resource}:${p.action}`));
  return {
    ...query,
    permissions: query.data ?? [],
    can: (resource: string, action: string) => set.has(`${resource}:${action}`),
  };
}
