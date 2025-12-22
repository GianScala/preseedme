"use client";

import { useEffect, useState } from "react";
import PublicFeaturedCard from "@/components/public/PublicFeaturedCard";
import PublicWeeklyWinner from "@/components/public/PublicWeeklyWinner";
import CrownIcon from "@/components/icons/CrownIcon";
import type { IdeaWithLikes } from "@/lib/ideas";
import {
  fetchWeeklyWinnersFromFirebase,
  type WeeklyWinner,
} from "@/lib/weeklyWinners";

/* -------------------------------------------------------------------------- */
/* FEATURED IDEA SECTION                           */
/* -------------------------------------------------------------------------- */

type FeaturedIdeaSectionProps = {
  featuredIdea: IdeaWithLikes | null;
  loading: boolean;
  currentUserId: string | null;
  onToggleLike: (ideaId: string) => void;
  loadingLikeId: string | null;
};

export function FeaturedIdeaSection({
  featuredIdea,
  loading,
  currentUserId,
  onToggleLike,
  loadingLikeId,
}: FeaturedIdeaSectionProps) {
  return (
    <section className="mb-16 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-1.5 h-8 rounded-full bg-[var(--brand)]" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none mb-1">
            Daily Pick
          </h2>
        </div>
      </div>

      {loading && !featuredIdea ? (
        <div className="w-full h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
      ) : !featuredIdea ? (
        <div className="p-16 text-center bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
          <p className="text-neutral-500 font-medium">No featured idea for today.</p>
        </div>
      ) : (
        <PublicFeaturedCard
          idea={featuredIdea}
          currentUserId={currentUserId}
          onToggleLike={() => onToggleLike(featuredIdea.id)}
          loadingLike={loadingLikeId === featuredIdea.id}
        />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* WEEKLY WINNERS SECTION                           */
/* -------------------------------------------------------------------------- */

type WeeklyWinnersSectionProps = {
  currentUserId: string | null;
  onToggleLike: (ideaId: string) => void;
  loadingLikeId: string | null;
};

export function WeeklyWinnersSection({
  currentUserId,
  onToggleLike,
  loadingLikeId,
}: WeeklyWinnersSectionProps) {
  const [winners, setWinners] = useState<WeeklyWinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWeeklyWinnersFromFirebase();
        if (!cancelled) setWinners(data);
      } catch (err) {
        console.error("Failed to load weekly winners", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleLike = (ideaId: string) => {
    if (currentUserId) {
      setWinners((prev) =>
        prev.map((winner) => {
          if (winner.idea.id !== ideaId) return winner;
          const idea = winner.idea;
          const likedBy = idea.likedByUserIds ?? [];
          const alreadyLiked = likedBy.includes(currentUserId);
          return {
            ...winner,
            idea: {
              ...idea,
              likedByUserIds: alreadyLiked
                ? likedBy.filter((id) => id !== currentUserId)
                : [...likedBy, currentUserId],
              likeCount: alreadyLiked
                ? (idea.likeCount ?? 0) - 1
                : (idea.likeCount ?? 0) + 1,
            },
          };
        })
      );
    }
    onToggleLike(ideaId);
  };

  const hasWinners = winners.length > 0;
  const topFour = winners.slice(0, 4);

  return (
    <section className="pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
        <span className="w-1.5 h-8 rounded-full bg-amber-300" />

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none mb-1">
              Weekly Winners
            </h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:gap-6">
        {loading && !hasWinners ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-44 rounded-3xl bg-white/5 animate-pulse border border-white/5"
            />
          ))
        ) : !hasWinners ? (
          <div className="p-16 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
            <p className="text-neutral-500 font-medium">Calculating winners...</p>
          </div>
        ) : (
          topFour.map(({ idea, rank }) => (
            <PublicWeeklyWinner
              key={idea.id}
              idea={idea}
              currentUserId={currentUserId}
              onToggleLike={() => handleToggleLike(idea.id)}
              loadingLike={loadingLikeId === idea.id}
              rank={rank}
            />
          ))
        )}
      </div>
    </section>
  );
}