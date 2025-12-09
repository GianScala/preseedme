"use client";

import type { ElementType } from "react";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { Users, Zap, Lightbulb, Gem, Sparkles } from "lucide-react";

/* ---------------- Types ---------------- */

type AccentColor = "brand" | "purple" | "amber" | "emerald";

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
    iconBg: "bg-brand/10 text-brand border-brand/20",
    glow: "from-brand/20 to-transparent",
    border: "group-hover:border-brand/30",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glow: "from-purple-500/20 to-transparent",
    border: "group-hover:border-purple-500/30",
  },
  amber: {
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "from-amber-500/20 to-transparent",
    border: "group-hover:border-amber-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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
        group relative overflow-hidden rounded-2xl border border-neutral-800/60
        bg-neutral-900/40 p-5 sm:p-6
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
        <div
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
            border shadow-lg transition-transform duration-300 group-hover:scale-110
            ${theme.iconBg}
          `}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-300 whitespace-pre-wrap">
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
          color: "purple" as const,
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