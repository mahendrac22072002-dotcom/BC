import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NotificationKind = Database["public"]["Enums"]["notification_kind"];

export interface NotifyArgs {
  user_id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert an in-app notification. Best-effort: failures log but never throw,
 * so they don't roll back the underlying mutation. RLS allows staff/admin
 * (or service_role) to insert. Users see notifications via /notifications.
 */
export async function notify(args: NotifyArgs): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: args.user_id,
      kind: args.kind,
      title: args.title,
      body: args.body ?? null,
      link: args.link ?? null,
      metadata: (args.metadata ?? {}) as never,
    });
    if (error) console.warn("[notify] insert failed", error);
  } catch (e) {
    console.warn("[notify] threw", e);
  }
}
