import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive?: boolean };
  loading?: boolean;
  tone?: "default" | "warn" | "danger" | "success";
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-900",
  warn: "text-amber-600",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  loading,
  tone = "default",
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </div>
      <div className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", toneStyles[tone])}>
        {loading ? (
          <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
        ) : (
          value
        )}
      </div>
      {(hint || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn("font-semibold", trend.positive ? "text-emerald-600" : "text-red-600")}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {hint && <span className="text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
