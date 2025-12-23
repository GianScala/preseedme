"use client";

import React, { useState } from "react";
import Link from "next/link";
import SignInModal from "@/components/common/modal/SignInModal";
import {
  IdeaWithLikes,
  toggleLikeIdea,
} from "@/lib/ideas";
import { useAuth } from "@/context/AuthContext";
import {
  FeaturedIdeaSection,
  WeeklyWinnersSection,
} from "@/components/public/PublicPageSections";
import type { WeeklyWinner } from "@/lib/weeklyWinners";

interface HomePageClientProps {
  initialFeaturedIdea: IdeaWithLikes | null;
  initialIdeas: IdeaWithLikes[];
  initialWeeklyWinners: WeeklyWinner[];
}

export default function HomePageClient({
  initialFeaturedIdea,
  initialIdeas,
  initialWeeklyWinners,
}: HomePageClientProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [featuredIdea, setFeaturedIdea] = useState(initialFeaturedIdea);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  async function handleToggleLike(ideaId: string) {
    if (!userId) {
      setShowSignInModal(true);
      return;
    }

    const updateIdeaLikes = (prevIdeas: IdeaWithLikes[]) =>
      prevIdeas.map((idea) => {
        if (idea.id !== ideaId) return idea;

        const isLiked = idea.likedByUserIds?.includes(userId);
        const withoutUser = (idea.likedByUserIds || []).filter(
          (id) => id !== userId
        );

        return {
          ...idea,
          likedByUserIds: isLiked
            ? withoutUser
            : [...(idea.likedByUserIds || []), userId],
          likeCount: (idea.likeCount || 0) + (isLiked ? -1 : 1),
        };
      });

    try {
      setLoadingLikeId(ideaId);
      await toggleLikeIdea(ideaId, userId);

      if (featuredIdea?.id === ideaId) {
        setFeaturedIdea((prev) => (prev ? updateIdeaLikes([prev])[0] : null));
      }

      setIdeas((prev) => updateIdeaLikes(prev));
    } catch (error) {
      console.error("Like action failed:", error);
    } finally {
      setLoadingLikeId(null);
    }
  }

  return (
    <>
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <FeaturedIdeaSection
        featuredIdea={featuredIdea}
        loading={false}
        currentUserId={userId}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />

      <WeeklyWinnersSection
        initialWinners={initialWeeklyWinners}
        currentUserId={userId}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />

      <div className="flex justify-center w-full pt-4">
        <Link
          href="/ideas"
          aria-label="Discover more ideas"
          className="group inline-flex items-center gap-1 text-sm font-medium text-neutral-200 hover:text-brand hover:underline underline-offset-4 transition-colors"
        >
          <span>Discover more</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </>
  );
}