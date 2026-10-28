// client/src/components/admin/StatCard.jsx
import * as React from "react";
import { Package, CalendarCheck2, ShoppingBag, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  purple: Package,
  blue: CalendarCheck2,
  emerald: ShoppingBag,
  amber: IndianRupee,
};

const COLOR_CLASSES = {
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
  },
};

/**
 * Reusable Metric Card for Dashboard
 */
export function StatCard({
  title,
  value,
  change,
  trend = "up",
  subtext,
  accentColor = "purple",
  icon: CustomIcon,
  className,
}) {
  const Icon = CustomIcon || ICON_MAP[accentColor] || Package;
  const colorStyle = COLOR_CLASSES[accentColor] || COLOR_CLASSES.purple;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-sm flex flex-col justify-between",
        className
      )}
    >
      {/* Top row: Squircle Icon */}
      <div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl border",
            colorStyle.bg
          )}
        >
          <Icon className="size-5" />
        </div>

        {/* Title */}
        <p className="mt-3 text-xs font-medium text-muted-foreground">{title}</p>

        {/* Value + Change Badge */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                trend === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {change}
            </span>
          )}
        </div>
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="mt-2 text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}

export default StatCard;
