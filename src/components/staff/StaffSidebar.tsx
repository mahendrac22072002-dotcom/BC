import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Flag, LayoutGrid, LifeBuoy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/staff/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/staff/listings", label: "Listings", icon: Building2 },
  { to: "/staff/kyc", label: "KYC", icon: ShieldCheck },
  { to: "/staff/reports", label: "Reports", icon: Flag },
  { to: "/staff/support", label: "Support", icon: LifeBuoy },
] as const;

export function StaffSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white">
          BC
        </div>
        <div className="text-sm font-semibold tracking-tight text-zinc-900">Staff</div>
        <div className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Ops
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link to={item.to}>
                  <span
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-100",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
