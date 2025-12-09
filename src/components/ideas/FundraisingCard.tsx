// src/components/ideas/FundraisingCard.tsx
"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { formatCurrency } from "@/lib/utils";
import { Target, TrendingUp, Wallet, LucideIcon } from "lucide-react";

interface FundraisingCardProps {
  idea: IdeaWithLikes;
}

/* ---------------- Helper Component ---------------- */

interface StatBoxProps {
  label: string;
  value: string; // Strictly string now
  icon: LucideIcon;
  className?: string;
}

const StatBox = ({ label, value, icon: Icon, className = "" }: StatBoxProps) => (
  <div
    className={`
      flex flex-col justify-between
      rounded-xl border border-emerald-500/10 bg-emerald-900/5
      p-3 sm:p-4 relative overflow-hidden group
      backdrop-blur-sm
      ${className}
    `}
  >
    {/* Background Icon Decoration */}
    <div className="absolute -right-2 -bottom-2 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors transform rotate-12 pointer-events-none">
      <Icon size={48} strokeWidth={1.5} />
    </div>

    <div className="flex items-center gap-2 mb-1.5 z-10">
      <Icon className="w-3.5 h-3.5 text-emerald-400/70" />
      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-emerald-200/60">
        {label}
      </span>
    </div>
    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight z-10 truncate">
      {value}
    </div>
  </div>
);

/* ---------------- Main Component ---------------- */

export default function FundraisingCard({ idea }: FundraisingCardProps) {
  // 1. Safe Data Extraction & Formatting
  const goalNum = idea.fundraisingGoal ?? 0;
  const raisedNum = idea.fundraisingRaisedSoFar ?? 0;

  // Fix: Ensure these are strings, defaulting to "—" if format returns null
  const goalStr = formatCurrency(idea.fundraisingGoal) ?? "—";
  const raisedStr = formatCurrency(idea.fundraisingRaisedSoFar) ?? "—";
  const minCheckStr = formatCurrency(idea.fundraisingMinCheckSize) ?? "—";

  // 2. Calculate Progress
  const progress =
    goalNum > 0
      ? Math.min(100, Math.round((raisedNum / goalNum) * 100))
      : 0;

  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/30 via-emerald-900/10 to-neutral-900/50 shadow-xl overflow-hidden animate-fade-in my-6">
      
      <div className="relative h-full rounded-2xl bg-neutral-950/90 p-5 sm:p-6 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Fundraising Round
              </h3>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400">
              This startup is raising capital. Review terms below.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatBox label="Target Goal" value={goalStr} icon={Target} />
          <StatBox label="Raised So Far" value={raisedStr} icon={TrendingUp} />
          {/* Mobile optimization: Min Check spans full width on small screens */}
          <StatBox 
            label="Min Check Size" 
            value={minCheckStr} 
            icon={Wallet} 
            className="col-span-2 md:col-span-1"
          />
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-end justify-between text-xs">
            <span className="text-neutral-400 font-medium">Round Progress</span>
            <span className="text-emerald-400 font-mono font-bold">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <span className="text-emerald-400 font-semibold mr-1">The Ask:</span>
            Raising <span className="text-white font-medium">{goalStr}</span>.
            {idea.fundraisingMinCheckSize && (
              <> Min check: <span className="text-white font-medium">{minCheckStr}</span>.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}