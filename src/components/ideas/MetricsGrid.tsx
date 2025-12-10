// src/components/ideas/MetricsGrid.tsx
"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import { DollarSign, Users, TrendingUp, Calendar, LucideIcon } from "lucide-react";

/* ---------------- Types ---------------- */

interface MetricItem {
  id: string;
  label: string;
  value: string;
  badge: string;
  icon: LucideIcon;
  theme: "brand" | "purple" | "green" | "blue";
}

/* ---------------- Theme Config ---------------- */

const METRIC_THEMES: Record<
  MetricItem["theme"],
  {
    card: string;
    pill: string;
    glow: string;
  }
> = {
  brand: {
    // subtle brand tint on border + bg
    card: "border-brand/40 bg-brand/5",
    pill: "bg-brand/10 border-brand/40 text-brand",
    glow: "from-brand/20 to-transparent",
  },
  purple: {
    card: "border-purple-500/40 bg-purple-500/5",
    pill: "bg-purple-500/10 border-purple-500/40 text-purple-300",
    glow: "from-purple-500/20 to-transparent",
  },
  green: {
    card: "border-emerald-500/40 bg-emerald-500/5",
    pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
    glow: "from-emerald-500/20 to-transparent",
  },
  blue: {
    card: "border-blue-500/40 bg-blue-500/5",
    pill: "bg-blue-500/10 border-blue-500/40 text-blue-300",
    glow: "from-blue-500/20 to-transparent",
  },
};

/* ---------------- Card Component ---------------- */

function MetricCard({
  item,
  className = "",
}: {
  item: MetricItem;
  className?: string;
}) {
  const { theme, icon: Icon, label, value, badge } = item;
  const styles = METRIC_THEMES[theme];

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border
        px-3 py-3 sm:px-4 sm:py-4
        shadow-[0_18px_45px_rgba(0,0,0,0.45)]
        backdrop-blur-sm transition-all duration-300
        hover:-translate-y-1 hover:bg-opacity-90
        ${styles.card}
        ${className}
      `}
    >
      {/* Soft themed glow */}
      <div
        className={`
          pointer-events-none absolute -top-10 -right-10 h-20 w-20 rounded-full
          bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-2xl
          transition-opacity duration-500
          ${styles.glow}
        `}
      />

      <div className="relative z-10 flex items-start justify-between mb-3 sm:mb-4">
        {/* Icon – hidden on mobile for cleaner layout */}
        <div
          className="
            hidden sm:flex w-9 h-9 rounded-xl
            bg-neutral-950/80 border border-neutral-700/70
            items-center justify-center text-neutral-200 flex-shrink-0
          "
        >
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>

        {/* Badge */}
        <span
          className={`
            inline-flex items-center justify-center
            text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full
            border uppercase tracking-[0.16em]
            ${styles.pill}
          `}
        >
          {badge}
        </span>
      </div>

      <div className="relative z-10">
        <div className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
          {value}
        </div>
        <div className="text-[11px] sm:text-sm text-neutral-300 font-medium mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main Grid Component ---------------- */

export default function MetricsGrid({ idea }: { idea: IdeaWithLikes }) {
  // Safe formatting helpers
  const mrr = idea.monthlyRecurringRevenue
    ? formatCurrencyShort(idea.monthlyRecurringRevenue)
    : null;
  const users = idea.userCount ? formatNumberShort(idea.userCount) : null;
  const revenue = idea.totalRevenueSinceInception
    ? formatCurrencyShort(idea.totalRevenueSinceInception)
    : null;
  const founded = idea.foundedYear ? String(idea.foundedYear) : null;

  // Build the list explicitly
  const metrics: MetricItem[] = [];

  if (mrr) {
    metrics.push({
      id: "mrr",
      label: "Monthly Recurring Rev",
      value: mrr,
      badge: "MRR",
      icon: DollarSign,
      theme: "brand",
    });
  }

  if (users) {
    metrics.push({
      id: "users",
      label: "Total Users",
      value: users,
      badge: "Active",
      icon: Users,
      theme: "purple",
    });
  }

  if (revenue) {
    metrics.push({
      id: "revenue",
      label: "Total Revenue",
      value: revenue,
      badge: "Lifetime",
      icon: TrendingUp,
      theme: "green",
    });
  }

  if (founded) {
    metrics.push({
      id: "founded",
      label: "Founded",
      value: founded,
      badge: "Year",
      icon: Calendar,
      theme: "blue",
    });
  }

  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
      {metrics.map((metric, index) => {
        // If there is an odd number of items, make the LAST item span 2 columns on mobile.
        const isOdd = metrics.length % 2 !== 0;
        const isLast = index === metrics.length - 1;
        const spanClass =
          isOdd && isLast ? "col-span-2 lg:col-span-1" : "col-span-1";

        return (
          <MetricCard key={metric.id} item={metric} className={spanClass} />
        );
      })}
    </div>
  );
}
