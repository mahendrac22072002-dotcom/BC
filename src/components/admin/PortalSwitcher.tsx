import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { useRoles } from "@/hooks/use-role";

type Portal = { key: "broker" | "staff" | "admin"; label: string; to: string; icon: typeof Users };

export function PortalSwitcher({ current }: { current: Portal["key"] }) {
  const { isAdmin, isStaff, isBroker } = useRoles();

  const portals: Portal[] = [];
  if (isBroker)
    portals.push({ key: "broker", label: "Broker Portal", to: "/dashboard", icon: LayoutGrid });
  if (isStaff)
    portals.push({ key: "staff", label: "Staff Portal", to: "/staff/dashboard", icon: Users });
  if (isAdmin)
    portals.push({
      key: "admin",
      label: "Admin Portal",
      to: "/admin/dashboard",
      icon: ShieldCheck,
    });

  if (portals.length <= 1) return null;
  const active = portals.find((p) => p.key === current) ?? portals[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-slate-700">
          <active.icon className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">{active.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500">
          Switch portal
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {portals.map((p) => (
          <DropdownMenuItem key={p.key} asChild>
            <Link to={p.to} className="flex items-center gap-2">
              <p.icon className="h-4 w-4" />
              <span className="flex-1">{p.label}</span>
              {p.key === current && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
