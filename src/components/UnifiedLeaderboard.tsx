"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Flame,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import PublicIdeaCard from "@/components/public/PublicIdeaCard";
import PublicWeeklyWinner from "@/components/public/PublicWeeklyWinner";
import { sortIdeas } from "@/lib/sorting";

type SortOption = "smart" | "newest" | "mostLiked" | "recentlyUpdated";

const SORT_OPTIONS: Array<{
  id: SortOption;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "smart", label: "Smart Sort", icon: Sparkles },
  { id: "newest", label: "Newest", icon: Clock },
  { id: "mostLiked", label: "Popular", icon: Flame },
  { id: "recentlyUpdated", label: "Updated", icon: RefreshCw },
];

type Idea = {
  id: string;
  title: string;
  oneLiner?: string;
  founderId?: string | null;
  founderUsername?: string;
  founderAvatarUrl?: string | null;
  thumbnailUrl?: string | null;
  sector?: string;
  targetAudience?: string;
  isFundraising?: boolean;
  fundraisingGoal?: number | null;
  monthlyRecurringRevenue?: number | null;
  userCount?: number | null;
  likeCount?: number | null;
  likedByUserIds?: string[];
  createdAt: string | number | Date;
  updatedAt?: string | number | Date | null;
  isWinner?: boolean;
};

type DisplayItem = Idea & { rank?: number; isWinner?: boolean };
type WeeklyWinner = { idea: Idea; rank: number };

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const active = useMemo(
    () => SORT_OPTIONS.find((o) => o.id === value) ?? SORT_OPTIONS[0],
    [value]
  );

  const ActiveIcon = active.icon;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-neutral-800/80 border border-white/10 rounded-xl hover:bg-neutral-700 transition-all text-[11px] font-bold text-white shadow-xl"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ActiveIcon className="w-3.5 h-3.5 text-[var(--brand)]" />
        <span>{active.label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = value === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "text-neutral-400 hover:bg-white/5"
                }`}
                role="menuitem"
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
                {isActive && <Check className="ml-auto w-3 h-3" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface UnifiedLeaderboardProps {
  ideas: Idea[];
  weeklyWinners: WeeklyWinner[];
  currentUserId?: string | null;
  onToggleLike: (ideaId: string) => void;
  loadingLikeId: string | null;
  isLoading?: boolean;
  externalSearchQuery?: string;
}

const UnifiedLeaderboard = memo(function UnifiedLeaderboard({
  ideas,
  weeklyWinners,
  currentUserId,
  onToggleLike,
  loadingLikeId,
}: UnifiedLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("smart");

  const displayList = useMemo(() => {
    const winnerIds = new Set<string>();
    const winners: DisplayItem[] = [];

    for (const w of weeklyWinners) {
      const id = w.idea.id;
      winnerIds.add(id);
      winners.push({ ...w.idea, rank: w.rank, isWinner: true });
    }

    const regular: DisplayItem[] = ideas
      .filter((i) => !winnerIds.has(i.id))
      .map((i) => ({ ...i, isWinner: false }));

    if (sortBy === "smart") {
      const sortedWinners = winners
        .slice()
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

      const sortedRegular = sortIdeas(regular, "smart") as DisplayItem[];
      return [...sortedWinners, ...sortedRegular];
    }

    return sortIdeas([...winners, ...regular], sortBy) as DisplayItem[];
  }, [ideas, weeklyWinners, sortBy]);

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/30 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-black text-white tracking-tight">
          Leaderboard
        </h2>
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {displayList.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 border border-dashed border-white/10 rounded-2xl">
            No startups match your search.
          </div>
        ) : (
          displayList.map((item) =>
            item.isWinner && sortBy === "smart" ? (
              <PublicWeeklyWinner
                key={`winner-${item.id}`}
                idea={item}
                rank={item.rank!}
                currentUserId={currentUserId}
                onToggleLike={() => onToggleLike(item.id)}
                loadingLike={loadingLikeId === item.id}
              />
            ) : (
              <PublicIdeaCard
                  key={`idea-${item.id}`}
                  idea={item}
                  currentUserId={currentUserId}
                  onToggleLike={() => onToggleLike(item.id)}
                  loadingLike={loadingLikeId === item.id} 
                  rank={0}              
                />
            )
          )
        )}
      </div>
    </div>
  );
});

export default UnifiedLeaderboard;
