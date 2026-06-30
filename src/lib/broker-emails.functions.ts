// Returns a map of broker_id -> email for the requesting admin/staff user.
// Uses the privileged admin client (auth.users is not exposed via Data API).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBrokerEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    // Authorize: caller must be admin or staff
    const { data: roles, error: rolesErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesErr) throw new Error(rolesErr.message);
    const rs = (roles ?? []).map((r) => r.role as string);
    if (!rs.includes("admin") && !rs.includes("staff")) {
      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: Record<string, string> = {};
    // listUsers is paginated; for moderate scale fetch in pages and pick wanted ids.
    const wanted = new Set(data.ids);
    let page = 1;
    const perPage = 200;
    while (wanted.size > 0 && page <= 25) {
      const { data: res, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      for (const u of res.users) {
        if (wanted.has(u.id) && u.email) {
          out[u.id] = u.email;
          wanted.delete(u.id);
        }
      }
      if (res.users.length < perPage) break;
      page += 1;
    }
    return out;
  });
