"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import type { ReactNode } from "react";

type TagVariant = "sector" | "audience" | "demographic" | "pricing" | "misc";

interface TagChipProps {
  children: ReactNode;
  variant: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  sector: "bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-700/50",
  audience: "bg-blue-950/40 border-blue-800/40 text-blue-300 hover:bg-blue-900/50 hover:border-blue-700/50",
  demographic: "bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-700/50",
  pricing: "bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-700/50",
  misc: "bg-neutral-900/70 border-neutral-700/70 text-neutral-200 hover:bg-neutral-800/70 hover:border-neutral-600",
};

function TagChip({ children, variant }: TagChipProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-lg
        px-2 py-2
        text-xs font-medium
        border ${variantClasses[variant]}
        transition-all
      `}
    >
      {children}
    </span>
  );
}

export function IdeaMetaChips({ idea }: { idea: IdeaWithLikes }) {
  // Helpers to normalize data
  const toArray = (single?: string, multi?: string[]) => {
    if (multi && multi.length > 0) return multi;
    if (single) return [single];
    return [];
  };

  const groups: { variant: TagVariant; items: string[] }[] = [
    { variant: "sector", items: toArray(idea.sector, idea.sectors) },
    { variant: "audience", items: toArray(idea.targetAudience, idea.targetAudiences) },
    { variant: "demographic", items: idea.targetDemographics ?? [] },
    { variant: "pricing", items: idea.revenueModels ?? [] },
    { variant: "misc", items: [...(idea.category ? [idea.category] : []), ...(idea.tags ?? [])] },
  ];

  if (!groups.some((g) => g.items.length > 0)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {groups.flatMap((group, gIdx) =>
        group.items.map((item, iIdx) => (
          <TagChip key={`${group.variant}-${gIdx}-${iIdx}`} variant={group.variant}>
            {item}
          </TagChip>
        ))
      )}
    </div>
  );
}