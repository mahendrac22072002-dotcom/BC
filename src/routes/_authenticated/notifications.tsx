import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkAllRead } from "@/hooks/use-notifications";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BrokersConnect" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isPending } = useNotifications();
  const markAll = useMarkAllRead();
  const items = data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates on your KYC, listings and support tickets.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || !items.some((n) => !n.read_at)}
        >
          <Check className="mr-1 h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-10 text-center">
          <Bell className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-card">
          {items.map((n) => {
            const inner = (
              <div className="flex items-start gap-3 px-5 py-4">
                <div
                  className={
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                    (n.read_at ? "bg-hairline" : "bg-foreground")
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{n.title}</div>
                  {n.body && (
                    <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>
                  )}
                  <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    {n.kind} · {relativeTime(n.created_at)}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link to={n.link} className="block hover:bg-surface">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
