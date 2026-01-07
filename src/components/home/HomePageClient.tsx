"use client";

import { useState, useMemo } from "react";
import SignInModal from "@/components/common/modal/SignInModal";
import { IdeaWithLikes, toggleLikeIdea } from "@/lib/ideas";
import { useAuth } from "@/context/AuthContext";

// Section Components
import HeroSection from "./HeroSection";
import ProcessSteps from "@/components/home/ProcessSteps";
import AudienceSection from "@/components/home/AudienceSection";
import LatestIdeas from "@/components/home/LatestIdeas";
import FAQSection from "@/components/home/FAQSection";

interface HomePageClientProps {
  initialIdeas: IdeaWithLikes[];
}

const getMillis = (timestamp: any): number => {
  if (!timestamp) return 0;
  if (typeof timestamp === "number") return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp === "string") return new Date(timestamp).getTime();
  return 0;
};

export default function HomePageClient({ initialIdeas }: HomePageClientProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const [ideas, setIdeas] = useState(initialIdeas);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Sort by newest first and take only first 10
  const sortedIdeas = useMemo(() => {
    return [...ideas]
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
      .slice(0, 10);
  }, [ideas]);

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

      {/* BEFORE Latest Ideas */}
      <HeroSection />
      <ProcessSteps />
      <AudienceSection />

      {/* Latest Ideas - Original Section */}
      <LatestIdeas
        ideas={sortedIdeas}
        totalCount={ideas.length}
        currentUserId={userId}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />

      <FAQSection />
    </>
  );
}