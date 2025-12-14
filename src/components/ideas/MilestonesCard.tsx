// src/components/MilestonesCard.tsx
"use client";

import { useMemo } from "react";
import type { Idea } from "@/types";
import { Target, Flag, CalendarRange, Check, Clock } from "lucide-react";

// --- Types ---
interface Deliverable {
  id: string;
  text: string;
  progress: number;
  createdAt: number;
}

interface MilestonesCardProps {
  idea: Idea;
}

// --- Utilities ---
const formatLastUpdated = (timestamp?: number) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- Sub-Components ---
const DeliverableItem = ({ text, progress }: { text: string; progress: number }) => {
  const isCompleted = progress === 100;

  return (
    <div className="group/item relative overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800/50 p-3.5 sm:p-4 hover:bg-neutral-900/60 hover:border-neutral-700/50 transition-all duration-300">
      {/* Content Row */}
      <div className="flex items-start gap-3 relative z-10">
        
        {/* Status Icon - Fixed width, optically aligned to top line of text */}
        <div className="flex-shrink-0 pt-[2px]">
          {isCompleted ? (
            <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5 h-5">
              <div className="w-2 h-2 rounded-full bg-purple-400/80 shadow-[0_0_8px_rgba(192,132,252,0.6)] ring-4 ring-purple-500/10" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <p className="text-[13px] sm:text-sm leading-relaxed text-neutral-200 font-medium whitespace-pre-wrap">
              {text}
            </p>
            
            {/* Percentage Label - Pushed to right */}
            <span className={`text-[11px] font-bold tracking-wide flex-shrink-0 pt-[2px] ${
              isCompleted ? 'text-green-400' : 'text-purple-300'
            }`}>
              {progress}%
            </span>
          </div>

          {/* Progress Bar - Placed below text for better mobile vertical stacking */}
          <div 
            className="h-1.5 w-full bg-neutral-800/80 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                isCompleted
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function MilestonesCard({ idea }: MilestonesCardProps) {
  const overview = idea.deliverablesOverview;
  
  const { deliverables, legacyMilestones, overallProgress, hasContent } = useMemo(() => {
    const items = (idea.deliverables || []) as Deliverable[];
    
    const legacy = !items.length && idea.deliverablesMilestones
      ? idea.deliverablesMilestones.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      : [];

    const progress = items.length > 0
      ? Math.round(items.reduce((sum, d) => sum + d.progress, 0) / items.length)
      : 0;

    const hasContent = !!overview || items.length > 0 || legacy.length > 0;

    return { deliverables: items, legacyMilestones: legacy, overallProgress: progress, hasContent };
  }, [idea.deliverables, idea.deliverablesMilestones, idea.deliverablesOverview]);

  if (!hasContent) return null;

  const lastUpdated = formatLastUpdated(idea.deliverablesUpdatedAt || idea.updatedAt);

  return (
    <section className="w-full relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500/10 via-neutral-900/50 to-black/20 shadow-xl overflow-hidden animate-fade-in border border-white/5">
      {/* Mobile-optimized padding: p-4 on mobile, p-6 on desktop */}
      <div className="relative h-full bg-neutral-900/60 backdrop-blur-xl px-4 py-5 sm:p-6">
        
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-purple-500/20 blur-[60px] opacity-50" />
        
        {/* --- Header --- */}
        <header className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-start gap-3">
            {/* Icon Box - Slightly smaller on mobile */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 flex-shrink-0 shadow-inner shadow-purple-500/10">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
            </div>
            
            <div className="flex flex-col pt-0.5">
              <h3 className="text-[15px] sm:text-base font-bold text-white tracking-tight leading-tight">
                Deliverables <span className="hidden xs:inline">&amp; Milestones</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-snug mt-1">
                {deliverables.length > 0
                  ? `${deliverables.length} tracked item${deliverables.length !== 1 ? "s" : ""}`
                  : "Execution plan"}
              </p>
            </div>
          </div>

          {/* Overall Progress Dial */}
          {deliverables.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-200 to-purple-400 leading-none">
                {overallProgress}%
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mt-1">
                Done
              </span>
            </div>
          )}
        </header>

        {/* --- Last Updated --- */}
        {lastUpdated && (
          <div className="flex items-center gap-1.5 mb-6 ml-0.5">
            <Clock className="w-3 h-3 text-neutral-600" />
            <span className="text-[11px] font-medium text-neutral-500">{lastUpdated}</span>
          </div>
        )}

        <div className="space-y-6 sm:space-y-7">
          {/* --- Overview Section --- */}
          {overview && (
            <div className="group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 rounded-full bg-purple-500/50" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Overview
                </h4>
              </div>
              
              {/* Reduced padding-left on mobile to maximize width */}
              <div className="pl-3 sm:pl-5 border-l border-neutral-800 group-hover:border-purple-500/30 transition-colors duration-300">
                <p className="text-[13px] sm:text-sm leading-7 text-neutral-300 whitespace-pre-line">
                  {overview}
                </p>
              </div>
            </div>
          )}

          {/* --- Milestones List --- */}
          {(deliverables.length > 0 || legacyMilestones.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3 rounded-full bg-purple-500/50" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  {deliverables.length > 0 ? "Roadmap" : "Milestones"}
                </h4>
              </div>

              {deliverables.length > 0 ? (
                <div className="space-y-3">
                  {deliverables.map((deliverable) => (
                    <DeliverableItem 
                      key={deliverable.id} 
                      text={deliverable.text} 
                      progress={deliverable.progress} 
                    />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3 pl-3 sm:pl-5 border-l border-neutral-800">
                  {legacyMilestones.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[13px] sm:text-sm text-neutral-300 group/list">
                      <span className="mt-2.5 w-1 h-1 rounded-full bg-purple-500/40 group-hover/list:bg-purple-400 group-hover/list:scale-125 transition-all duration-300 flex-shrink-0" />
                      <span className="leading-relaxed whitespace-pre-line">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}