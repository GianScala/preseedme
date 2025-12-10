"use client";

import type { Idea } from "@/types";
import { Target, Flag, CalendarRange } from "lucide-react";

interface MilestonesCardProps {
  idea: Idea;
}

export default function MilestonesCard({ idea }: MilestonesCardProps) {
  const overview = idea.deliverablesOverview;
  const milestonesText = idea.deliverablesMilestones;

  if (!overview && !milestonesText) return null;

  const milestoneLines =
    milestonesText
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  return (
    <div
      className="
        relative group rounded-2xl
        bg-gradient-to-br from-purple-500/10 via-purple-900/10 to-neutral-900/10
        shadow-xl overflow-hidden animate-fade-in
      "
    >
      {/* Inner glass card */}
      <div
        className="
          relative h-full rounded-2xl bg-neutral-900/60
          px-4 py-4 sm:px-6 sm:py-5
          backdrop-blur-xl
        "
      >
        {/* Amber spotlight effect */}
        <div
          className="
            pointer-events-none absolute -top-12 -right-10 h-32 w-32 
            rounded-full bg-purple-500/20 blur-3xl opacity-60
          "
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 sm:gap-4">

            {/* Header Icon — hidden on mobile */}
            <div
              className="
                hidden sm:flex w-11 h-11 sm:w-12 sm:h-12 rounded-xl
                bg-purple-500/10 border border-purple-500/30
                items-center justify-center text-purple-300 flex-shrink-0
              "
            >
              <Target className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.6} />
            </div>

            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Deliverables & Milestones
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-snug">
                What this round is meant to achieve and how progress will be measured.
              </p>
            </div>
          </div>

          {/* Execution Plan Pill — hidden on mobile */}
          <div
            className="
              hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full
              bg-purple-500/10 border border-purple-500/25 text-[11px]
              font-semibold text-purple-300 uppercase tracking-wide
            "
          >
            <CalendarRange className="w-3 h-3" />
            <span>Execution Plan</span>
          </div>
        </div>

        {/* Overview Section */}
        {overview && (
          <div className="space-y-1.5 mb-5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {/* Icon hidden on mobile */}
              <Flag className="hidden sm:inline-block w-3 h-3 text-purple-400" />
              <span>Overview</span>
            </div>

            <p className="text-sm leading-relaxed text-neutral-200 whitespace-pre-line">
              {overview}
            </p>
          </div>
        )}

        {/* Milestones Section */}
        {milestoneLines.length > 0 && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {/* Icon hidden on mobile */}
              <CalendarRange className="hidden sm:inline-block w-3 h-3 text-purple-400" />
              <span>Milestones</span>
            </div>

            <ul className="space-y-2">
              {milestoneLines.map((line, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-neutral-200"
                >
                  <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-purple-400/80 flex-shrink-0" />
                  <span className="leading-relaxed whitespace-pre-line">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
