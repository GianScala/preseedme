"use client";

import type { ElementType } from "react";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { Users, Zap, Lightbulb, Gem, Sparkles } from "lucide-react";

/* ---------------- Types ---------------- */

type AccentColor = "brand" | "blue" | "amber" | "emerald";

interface SectionItem {
  id: string;
  icon: ElementType;
  title: string;
  content: string;
  color: AccentColor;
}

/* ---------------- Theme Config ---------------- */

const THEMES = {
  brand: {
    iconRing: "sm:border-brand/40",
    glow: "from-brand/20 to-transparent",
    border: "group-hover:border-brand/30",
  },
  blue: {
    iconRing: "sm:border-blue-500/40",
    glow: "from-blue-500/20 to-transparent",
    border: "group-hover:border-blue-500/30",
  },
  amber: {
    iconRing: "sm:border-amber-500/40",
    glow: "from-amber-500/20 to-transparent",
    border: "group-hover:border-amber-500/30",
  },
  emerald: {
    iconRing: "sm:border-emerald-500/40",
    glow: "from-emerald-500/20 to-transparent",
    border: "group-hover:border-emerald-500/30",
  },
};

/* ---------------- Sub-Component ---------------- */

const WinCard = ({ icon: Icon, title, content, color }: Omit<SectionItem, "id">) => {
  const theme = THEMES[color];

  return (
    <div
      className={`
        group relative w-full overflow-hidden rounded-2xl border
        bg-gradient-to-br from-neutral-950/40 via-neutral-900/20 to-neutral-900
        border-neutral-800/70
        shadow-[0_18px_45px_rgba(0,0,0,0.55)]
        px-4 py-4 sm:px-6 sm:py-5
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

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon (desktop / tablet only) */}
        <div
          className={`
            hidden sm:flex
            w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0
            items-center justify-center
            bg-neutral-900/70 border border-neutral-700/70
            shadow-lg transition-transform duration-300 group-hover:scale-110
            text-neutral-200
            ${theme.iconRing}
          `}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
        </div>

        {/* Text (full-width on mobile) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-200 whitespace-pre-wrap">
            {content}
          </p>
        </div>
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
          icon: Users,
          title: "Team Background",
          content: idea.teamBackground,
          color: "brand" as const,
        }
      : null,
    idea.teamWhyYouWillWin
      ? {
          id: "win",
          icon: Zap,
          title: "Competitive Edge",
          content: idea.teamWhyYouWillWin,
          color: "blue" as const,
        }
      : null,
    idea.industryInsights
      ? {
          id: "industry",
          icon: Lightbulb,
          title: "Industry Insights",
          content: idea.industryInsights,
          color: "amber" as const,
        }
      : null,
    idea.valuePropositionDetail
      ? {
          id: "value",
          icon: Gem,
          title: "Value Proposition",
          content: idea.valuePropositionDetail,
          color: "emerald" as const,
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
        <Sparkles className="w-5 h-5 text-brand" />
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Investment Thesis
        </h2>
      </div>

      {/* Grid Layout: 1 Col Mobile -> 2 Col Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ id, ...rest }) => (
          <WinCard key={id} {...rest} />
        ))}
      </div>
    </section>
  );
}
