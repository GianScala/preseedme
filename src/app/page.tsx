"use client";

import React, { useEffect, useState } from "react";
import AdBanner from "@/components/common/AdBanner";
import SignInModal from "@/components/common/modal/SignInModal";
import {
  IdeaWithLikes,
  getProjectDaily,
  getLatestIdeas,
  toggleLikeIdea,
} from "@/lib/ideas";
import { useAuth } from "@/context/AuthContext";
import {
  FeaturedIdeaSection,
  WeeklyWinnersSection,
} from "@/components/public/PublicPageSections";

export default function Page() {
  const { user } = useAuth();

  const [featuredIdea, setFeaturedIdea] = useState<IdeaWithLikes | null>(null);
  const [ideas, setIdeas] = useState<IdeaWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const [dailyProjectData, latest] = await Promise.all([
          getProjectDaily(),
          getLatestIdeas(30),
        ]);

        if (!mounted) return;

        const filteredLatest =
          dailyProjectData && latest.length
            ? latest.filter((idea) => idea.id !== dailyProjectData.id)
            : latest;

        setFeaturedIdea(dailyProjectData);
        setIdeas(filteredLatest);
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleToggleLike(ideaId: string) {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    const updateIdeaLikes = (prevIdeas: IdeaWithLikes[]) =>
      prevIdeas.map((idea) => {
        if (idea.id !== ideaId) return idea;

        const isLiked = idea.likedByUserIds?.includes(user.uid);
        const newLikes = (idea.likedByUserIds || []).filter(
          (id) => id !== user.uid
        );

        return {
          ...idea,
          likedByUserIds: isLiked
            ? newLikes
            : [...(idea.likedByUserIds || []), user.uid],
          likeCount: (idea.likeCount || 0) + (isLiked ? -1 : 1),
        };
      });

    try {
      setLoadingLikeId(ideaId);

      await toggleLikeIdea(ideaId, user.uid);

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
    <div className="space-y-12 animate-fade-in">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <AdBanner />

      <FeaturedIdeaSection
        featuredIdea={featuredIdea}
        loading={loading}
        currentUserId={user?.uid || null}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />

      <WeeklyWinnersSection
        currentUserId={user?.uid || null}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />
    </div>
  );
}
