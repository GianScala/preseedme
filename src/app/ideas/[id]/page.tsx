"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { toggleLikeIdea } from "@/lib/ideas";
import { useAuth } from "@/context/AuthContext";
import type { Idea } from "@/types";

// Components
import SignInModal from "@/components/common/modal/SignInModal";
import IdeaHeader from "@/components/ideas/IdeaHeader";
import MetricsGrid from "@/components/ideas/MetricsGrid";
import FundraisingCard from "@/components/ideas/FundraisingCard";
import InfoCard from "@/components/ideas/InfoCard";
import WhyWinSection from "@/components/ideas/WhyWinSection";
import ActionButtons from "@/components/ideas/ActionButtons";
import LoadingSpinner from "@/components/common/ideas/LoadingSpinner";
import NotFound from "@/components/common/ideas/NotFound";

export type IdeaWithLikes = Idea & {
  likeCount?: number;
  likedByUserIds?: string[];
};

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  
  // State
  const [idea, setIdea] = useState<IdeaWithLikes | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const id = params?.id;

  // 1. Fetch Data
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const loadIdea = async () => {
      setLoading(true);
      setError("");
      try {
        const db = getFirebaseDb();
        const ref = doc(db, "ideas", id);
        const snap = await getDoc(ref);

        if (mounted) {
          if (snap.exists()) {
            setIdea({ ...(snap.data() as IdeaWithLikes), id: snap.id });
          } else {
            setIdea(null);
          }
        }
      } catch (err) {
        console.error("Error loading idea:", err);
        if (mounted) setError("Failed to load idea");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadIdea();
    return () => { mounted = false; };
  }, [id]);

  // 2. Optimistic Like Handler (Matches HomePage pattern)
  const handleToggleLike = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    if (!idea || likeLoading) return;

    // Snapshot current state for rollback
    const previousIdea = { ...idea };
    const isLiked = idea.likedByUserIds?.includes(user.uid);
    
    // Optimistic Update
    setIdea((prev) => {
      if (!prev) return null;
      const currentLikes = prev.likedByUserIds || [];
      const newLikes = isLiked 
        ? currentLikes.filter(uid => uid !== user.uid)
        : [...currentLikes, user.uid];
        
      return {
        ...prev,
        likedByUserIds: newLikes,
        likeCount: (prev.likeCount || 0) + (isLiked ? -1 : 1)
      };
    });

    try {
      setLikeLoading(true);
      await toggleLikeIdea(idea.id, user.uid);
    } catch (error) {
      console.error("Like failed:", error);
      // Rollback on error
      setIdea(previousIdea);
      setError("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return <NotFound />;

  const isOwner = !!(user && idea.founderId === user.uid);
  
  // Feature flags based on data existence
  const hasMetrics = !!(idea.monthlyRecurringRevenue || idea.userCount || idea.totalRevenueSinceInception || idea.foundedYear);
  const hasWhyWin = !!(idea.teamBackground || idea.teamWhyYouWillWin || idea.industryInsights || idea.valuePropositionDetail);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      {/* Header handles display, Page handles logic */}
      <IdeaHeader 
        idea={idea}
        user={user}
        isOwner={isOwner}
        onToggleLike={handleToggleLike}
        likeLoading={likeLoading}
      />

      {/* Content Grid */}
      <div className="grid gap-6">
        {hasMetrics && <MetricsGrid idea={idea} />}

        {idea.isFundraising && <FundraisingCard idea={idea} />}

        {idea.description && (
          <InfoCard
            icon="document"
            title="About this idea"
            content={idea.description}
            isSelected={selectedCard === 'description'}
            onSelect={() => setSelectedCard(selectedCard === 'description' ? null : 'description')}
          />
        )}

        {idea.targetMarket && (
          <InfoCard
            icon="globe"
            title="Target Market"
            content={idea.targetMarket}
            isSelected={selectedCard === 'targetMarket'}
            onSelect={() => setSelectedCard(selectedCard === 'targetMarket' ? null : 'targetMarket')}
          />
        )}

        {hasWhyWin && <WhyWinSection idea={idea} />}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-8 right-8 z-50">
          <div className="flex items-center gap-2 text-sm text-red-200 bg-red-900/90 border border-red-700/50 rounded-lg px-4 py-3 shadow-xl backdrop-blur-md">
            <span>{error}</span>
          </div>
        </div>
      )}

      <ActionButtons 
        idea={idea}
        user={user}
        isOwner={isOwner}
        setError={setError}
      />
    </div>
  );
}