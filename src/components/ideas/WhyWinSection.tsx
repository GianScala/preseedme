"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { InvestorIcon } from "../icons/InvestorIcon";

/* ---------------- Types ---------------- */

type AccentColor = "brand";

interface SectionItem {
  id: string;
  title: string;
  content: string;
  color: AccentColor;
}

/* ---------------- Theme Config ---------------- */

const THEMES = {
  brand: {
    accent: "text-brand",
    glow: "from-brand/20 to-transparent",
    border: "group-hover:border-brand/30",
  },
};

/* ---------------- Sub-Component ---------------- */

const WinCard = ({ title, content, color }: Omit<SectionItem, "id">) => {
  const theme = THEMES[color];

  return (
    <div
      className={`
        group relative w-full overflow-hidden rounded-2xl border
        bg-gradient-to-br from-neutral-950/40 via-neutral-900/20 to-neutral-900
        border-neutral-800/70
        shadow-xl
        px-5 py-5 sm:px-6 sm:py-6
        backdrop-blur-sm transition-all duration-300
        hover:-translate-y-1 hover:bg-neutral-900/60
        ${theme.border}
      `}
    >
      {/* Spotlight Effect */}
      <div
        className={`
          absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br 
          opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl
          pointer-events-none rounded-full
          ${theme.glow}
        `}
      />

      {/* Content */}
      <div className="relative z-10 space-y-3">
        <h3 className={`text-base sm:text-lg font-bold tracking-tight ${theme.accent}`}>
          {title}
        </h3>
        <p className="text-sm sm:text-base leading-relaxed text-neutral-300 whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export default function WhyWinSection({ idea }: { idea: IdeaWithLikes }) {
  // 1. Construct Data with Null Checks
  const rawSections: (SectionItem | null)[] = [
    idea.teamBackground
      ? {
          id: "team",
          title: "Team Background",
          content: idea.teamBackground,
          color: "brand" as const,
        }
      : null,
    idea.teamWhyYouWillWin
      ? {
          id: "win",
          title: "Competitive Edge",
          content: idea.teamWhyYouWillWin,
          color: "brand" as const,
        }
      : null,
    idea.industryInsights
      ? {
          id: "industry",
          title: "Industry Insights",
          content: idea.industryInsights,
          color: "brand" as const,
        }
      : null,
    idea.valuePropositionDetail
      ? {
          id: "value",
          title: "Value Proposition",
          content: idea.valuePropositionDetail,
          color: "brand" as const,
        }
      : null,
  ];

  // 2. Strict Type Filtering
  const sections = rawSections.filter(
    (item): item is SectionItem => item !== null
  );

  if (sections.length === 0) return null;

  return (
    <section className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <InvestorIcon className="w-5 h-5 text-brand" />
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Investment Thesis
        </h2>
      </div>

      {/* Stacked Layout: One card after another */}
      <div className="space-y-4">
        {sections.map(({ id, ...rest }) => (
          <WinCard key={id} {...rest} />
        ))}
      </div>
    </section>
  );
}