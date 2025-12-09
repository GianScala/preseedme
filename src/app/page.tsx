"use client";

import { useEffect, useState } from "react";
import AdBanner from "@/components/common/AdBanner";
import SignInModal from "@/components/common/modal/SignInModal";
// 👇 1. UPDATE IMPORT HERE
import {
  IdeaWithLikes,
  getProjectDaily, // Swapped this in
  getLatestIdeas,
  toggleLikeIdea,
} from "@/lib/ideas";
import { useAuth } from "@/context/AuthContext";
import {
  FeaturedIdeaSection,
  WeeklyWinnersSection,
} from "@/components/public/PublicPageSections";

export default function HomePage() {
  const { user } = useAuth();
  
  // We keep the state name 'featuredIdea' because it feeds the FeaturedIdeaSection,
  // but logically this now holds your "Project Daily" data.
  const [featuredIdea, setFeaturedIdea] = useState<IdeaWithLikes | null>(null);
  const [ideas, setIdeas] = useState<IdeaWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Consolidated Data Loading
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        
        // 👇 2. FETCH PROJECT DAILY HERE
        const [dailyProjectData, latest] = await Promise.all([
          getProjectDaily(), // Using the new function
          getLatestIdeas(30),
        ]);

        if (!mounted) return;

        // Filter the daily project out of the 'latest' list to avoid duplicates
        // (If the daily project happens to be one of the latest 30)
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
    return () => { mounted = false; };
  }, []);

  // Optimized Like Handler
  async function handleToggleLike(ideaId: string) {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    // Optimistic UI update helper
    const updateIdeaLikes = (prevIdeas: IdeaWithLikes[]) => 
      prevIdeas.map(idea => {
        if (idea.id !== ideaId) return idea;
        
        const isLiked = idea.likedByUserIds?.includes(user.uid);
        const newLikes = (idea.likedByUserIds || []).filter(id => id !== user.uid);
        
        return {
          ...idea,
          likedByUserIds: isLiked ? newLikes : [...(idea.likedByUserIds || []), user.uid],
          likeCount: (idea.likeCount || 0) + (isLiked ? -1 : 1)
        };
      });

    try {
      setLoadingLikeId(ideaId);
      
      // 1. Perform backend action
      await toggleLikeIdea(ideaId, user.uid);

      // 2. Update Local State (Featured / Project Daily)
      if (featuredIdea?.id === ideaId) {
        setFeaturedIdea(prev => prev ? updateIdeaLikes([prev])[0] : null);
      }

      // 3. Update Local State (List)
      setIdeas(prev => updateIdeaLikes(prev));

    } catch (error) {
      console.error("Like action failed:", error);
    } finally {
      setLoadingLikeId(null);
    }
  }

  // Calculate Winners
  const weeklyWinners = [...ideas]
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-12 animate-fade-in"> 
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <AdBanner />

      {/* This section now displays the PROJECT DAILY */}
      <FeaturedIdeaSection
        featuredIdea={featuredIdea}
        loading={loading}
        currentUserId={user?.uid || null}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />

      <WeeklyWinnersSection
        winners={weeklyWinners}
        loading={loading}
        currentUserId={user?.uid || null}
        onToggleLike={handleToggleLike}
        loadingLikeId={loadingLikeId}
      />
    </div>
  );
}