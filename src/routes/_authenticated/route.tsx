import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Briefcase,
  Building2,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { initials } from "@/lib/format";
import { PortalSwitcher } from "@/components/admin/PortalSwitcher";
import { useUnreadCount } from "@/hooks/use-notifications";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const baseNav = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/listings", label: "Listings", icon: Building2 },
  { to: "/marketplace", label: "Marketplace", icon: Users },
  { to: "/crm", label: "CRM", icon: Briefcase },
  { to: "/deals", label: "Deal Rooms", icon: MessagesSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/help", label: "Help Center", icon: LifeBuoy },
  { to: "/kyc", label: "KYC", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const unread = useUnreadCount();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = baseNav;

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-hairline bg-surface lg:flex lg:flex-col">
        <div className="border-b border-hairline px-6 py-5">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-6">
          <ul className="space-y-1">
            {nav.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  activeProps={{
                    className:
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  }}
                >
                  <n.icon className="h-4 w-4" />
                  <span className="flex-1">{n.label}</span>
                  {n.to === "/notifications" && unread > 0 && (
                    <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User block */}
        <div className="border-t border-hairline p-3">
          <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {initials(profile?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{profile?.full_name || "Broker"}</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                {profile?.kyc_status === "verified" ? "Verified" : "Unverified"}
              </div>
            </div>
          </div>
          <div className="mb-2 px-1">
            <PortalSwitcher current="broker" />
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start gap-3">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <header className="flex items-center justify-between border-b border-hairline bg-background px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <PortalSwitcher current="broker" />
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-background px-4 py-2 text-xs">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-muted-foreground"
              activeProps={{ className: "bg-foreground text-background" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex min-w-0 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
