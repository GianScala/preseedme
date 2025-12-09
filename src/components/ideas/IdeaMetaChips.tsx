"use client";

import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import type { ReactNode } from "react";

type TagVariant = "sector" | "audience" | "demographic" | "pricing" | "misc";

interface TagChipProps {
  children: ReactNode;
  variant: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  sector: "bg-emerald-900/30 border-emerald-500/30 text-emerald-300",
  audience: "bg-blue-900/30 border-blue-500/30 text-blue-200",
  demographic: "bg-amber-900/20 border-amber-500/30 text-amber-200",
  pricing: "bg-purple-900/30 border-purple-500/30 text-purple-300",
  misc: "bg-neutral-800/50 border-neutral-700 text-neutral-400",
};

function TagChip({ children, variant }: TagChipProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md
        px-2.5 py-1
        text-[11px] font-medium tracking-wide
        border ${variantClasses[variant]}
        transition-colors hover:bg-opacity-50
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
    <div className="flex flex-wrap gap-2 mt-2">
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