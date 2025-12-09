"use client";

import { useRef, useEffect, useState } from "react";
import PublicFeaturedCard from "@/components/public/PublicFeaturedCard";
import PublicWeeklyWinner from "@/components/public/PublicWeeklyWinner";
import CrownIcon from "@/components/icons/CrownIcon";
import type { IdeaWithLikes } from "@/lib/ideas";
import {
  fetchWeeklyWinnersFromFirebase,
  type WeeklyWinner,
} from "@/lib/weeklyWinners";


// --- Featured Section ---

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
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1 h-6 rounded-full bg-[var(--brand)]" />
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Project of the day
        </h2>
      </div>

      {loading && !featuredIdea ? (
        <div className="w-full h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
      ) : !featuredIdea ? (
        <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm">
          <p className="text-neutral-500">No featured idea selected for today.</p>
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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
    return () => { cancelled = true; };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 360; // Card width + gap
    container.scrollTo({
      left: container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
      behavior: "smooth",
    });
  };

  const hasWinners = winners.length > 0;
  const topFour = winners.slice(0, 4);

  return (
    <section className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
             <CrownIcon className="w-5 h-5 text-yellow-500" />
           </div>
           <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
             Weekly winners
           </h2>
        </div>

        {/* Scroll Buttons */}
        {hasWinners && topFour.length > 1 && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && !hasWinners ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[300px] sm:w-[340px] h-[450px] bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : !hasWinners ? (
        <div className="p-10 text-center bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm">
          <p className="text-neutral-500">Winners are being calculated...</p>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto pb-8 scroll-smooth snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {topFour.map(({ idea, rank }) => (
              <div key={idea.id} className="snap-start h-full">
                <PublicWeeklyWinner
                  idea={idea}
                  currentUserId={currentUserId}
                  onToggleLike={() => onToggleLike(idea.id)}
                  loadingLike={loadingLikeId === idea.id}
                  rank={rank}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}