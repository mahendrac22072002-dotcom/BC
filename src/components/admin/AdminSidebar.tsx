import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  FormInput,
  Folder,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  LifeBuoy,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  to?: string;
  label: string;
  icon: LucideIcon;
  phase?: number; // if set, item is disabled until that phase ships
};

type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Overview",
    items: [{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "Access",
    items: [
      { to: "/admin/users", label: "Users", icon: UsersRound },
      { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "Brokers",
    items: [
      { to: "/admin/kyc", label: "KYC Verification", icon: ShieldCheck },
      { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { to: "/admin/listings", label: "Property Moderation", icon: Building2 },
      { to: "/admin/reports", label: "Listing Reports", icon: Sparkles },
    ],
  },

  {
    label: "Operations",
    items: [
      { to: "/admin/deals", label: "Deal Management", icon: Briefcase },
      { to: "/admin/contact", label: "Contact Center", icon: LifeBuoy },
      { to: "/admin/support", label: "Support", icon: LifeBuoy },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Site Settings", icon: Settings },
      { to: "/admin/system", label: "System Health", icon: Activity },
      { to: "/admin/audit", label: "Audit Logs", icon: Briefcase },
      { to: "/admin/api-keys", label: "API Keys", icon: Terminal },
      { to: "/admin/webhooks", label: "Webhooks", icon: Globe },
    ],
  },

];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
          BC
        </div>
        <div className="text-sm font-semibold tracking-tight text-slate-900">Admin</div>
        <div className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          v2
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {g.label}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = item.to && pathname.startsWith(item.to);
                const disabled = !item.to;
                const body = (
                  <span
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
                      disabled
                        ? "cursor-not-allowed text-slate-400"
                        : active
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {disabled && item.phase && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        P{item.phase}
                      </span>
                    )}
                  </span>
                );
                return (
                  <li key={item.label}>
                    {disabled ? (
                      <div title={`Available in Phase ${item.phase}`} aria-disabled>
                        {body}
                      </div>
                    ) : (
                      <Link to={item.to!}>{body}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
