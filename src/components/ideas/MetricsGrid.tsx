// src/components/ideas/MetricsGrid.tsx
"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import { DollarSign, Users, TrendingUp, Calendar, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// 1. Define strict types for the card
interface MetricItem {
  id: string;
  label: string;
  value: string;
  badge: string;
  icon: LucideIcon;
  theme: "brand" | "purple" | "green" | "blue";
}

// 2. The Card Component
function MetricCard({ 
  item, 
  className = "" 
}: { 
  item: MetricItem; 
  className?: string 
}) {
  const { theme, icon: Icon, label, value, badge } = item;

  // Theme Styles Configuration
  const styles = {
    brand: "border-brand/20 bg-brand/5 text-brand",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
    green: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  };

  const badgeStyles = {
    brand: "bg-brand/10 border-brand/20 text-brand",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  };

  const activeStyle = styles[theme];
  const activeBadge = badgeStyles[theme];

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border 
        p-4 sm:p-5 backdrop-blur-sm transition-all duration-300
        hover:-translate-y-1 hover:bg-opacity-80
        ${activeStyle}
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${activeBadge}`}>
          {badge}
        </span>
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
          {label}
        </div>
      </div>
      
      {/* Hover Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

// 3. Main Grid Component
export default function MetricsGrid({ idea }: { idea: IdeaWithLikes }) {
  // Safe formatting helpers
  const mrr = idea.monthlyRecurringRevenue ? formatCurrencyShort(idea.monthlyRecurringRevenue) : null;
  const users = idea.userCount ? formatNumberShort(idea.userCount) : null;
  const revenue = idea.totalRevenueSinceInception ? formatCurrencyShort(idea.totalRevenueSinceInception) : null;
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
        // Smart Span Logic:
        // If there is an odd number of items, make the LAST item span 2 columns on mobile.
        const isOdd = metrics.length % 2 !== 0;
        const isLast = index === metrics.length - 1;
        const spanClass = (isOdd && isLast) ? "col-span-2 lg:col-span-1" : "col-span-1";

        return (
          <MetricCard 
            key={metric.id} 
            item={metric} 
            className={spanClass}
          />
        );
      })}
    </div>
  );
}