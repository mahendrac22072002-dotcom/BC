import { supabase } from "@/integrations/supabase/client";

export interface AuditEntry {
  action: string;
  resource: string;
  resource_id?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only admin audit log. Best-effort: failures are logged to console,
 * never thrown, so they don't block the underlying mutation. RLS enforces that
 * only staff/admin can write, and that `actor_id = auth.uid()`.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const actor_id = u.user?.id;
    if (!actor_id) return;
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id ?? null,
      before: (entry.before ?? null) as never,
      after: (entry.after ?? null) as never,
      metadata: (entry.metadata ?? null) as never,
    });
    if (error) console.warn("[audit] insert failed", error);
  } catch (e) {
    console.warn("[audit] threw", e);
  }
}
