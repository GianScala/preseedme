"use client";

import { useEffect, useState, ReactNode } from "react";
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
import MilestonesCard from "@/components/ideas/MilestonesCard"; // 👈 NEW

import { Lock } from "lucide-react";

export type IdeaWithLikes = Idea & {
  likeCount?: number;
  likedByUserIds?: string[];
};

type RestrictedSectionProps = {
  children: ReactNode;
  className?: string;
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

    void loadIdea();
    return () => {
      mounted = false;
    };
  }, [id]);

  // 2. Optimistic Like Handler
  const handleToggleLike = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    if (!idea || likeLoading) return;

    const previousIdea = { ...idea };
    const isLiked = idea.likedByUserIds?.includes(user.uid);

    // Optimistic update
    setIdea((prev) => {
      if (!prev) return null;
      const currentLikes = prev.likedByUserIds || [];
      const newLikes = isLiked
        ? currentLikes.filter((uid) => uid !== user.uid)
        : [...currentLikes, user.uid];

      return {
        ...prev,
        likedByUserIds: newLikes,
        likeCount: (prev.likeCount || 0) + (isLiked ? -1 : 1),
      };
    });

    try {
      setLikeLoading(true);
      await toggleLikeIdea(idea.id, user.uid);
    } catch (err) {
      console.error("Like failed:", err);
      setIdea(previousIdea);
      setError("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAuthTrigger = () => {
    setShowSignInModal(true);
  };

  // Same UX pattern as profile page: blur + "Login to view" pill
  const RestrictedSection = ({
    children,
    className = "",
  }: RestrictedSectionProps) => {
    if (user) {
      return <div className={className}>{children}</div>;
    }

    return (
      <div
        onClick={handleAuthTrigger}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl ${className}`}
      >
        <div className="blur-md select-none pointer-events-none grayscale opacity-60 transition-all duration-500 group-hover:opacity-70">
          {children}
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl transform transition-transform group-hover:scale-105">
            <Lock className="w-3 h-3 text-brand" />
            <span className="text-xs font-bold text-white tracking-wide">
              Login to view
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return <NotFound />;

  const isOwner = !!(user && idea.founderId === user.uid);

  // Feature flags based on data existence
  const hasMetrics = !!(
    idea.monthlyRecurringRevenue ||
    idea.userCount ||
    idea.totalRevenueSinceInception ||
    idea.foundedYear
  );
  const hasWhyWin = !!(
    idea.teamBackground ||
    idea.teamWhyYouWillWin ||
    idea.industryInsights ||
    idea.valuePropositionDetail
  );
  const hasDeliverables = !!(
    idea.deliverablesOverview || 
    idea.deliverablesMilestones ||
    (idea.deliverables && idea.deliverables.length > 0) // ✅ Add this
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
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

        {idea.description && (
          <InfoCard
            icon="document"
            title="About this idea"
            content={idea.description}
          />
        )}

        {/* Fundraising (gated when logged out) */}
        {idea.isFundraising && (
          <RestrictedSection>
            <FundraisingCard idea={idea} />
          </RestrictedSection>
        )}

        {/* Deliverables & milestones – directly below fundraising, same gating UX */}
        {hasDeliverables && (
          <RestrictedSection>
            <MilestonesCard idea={idea} />
          </RestrictedSection>
        )}

        {/* WhyWinSection (gated when logged out) */}
        {hasWhyWin && (
          <RestrictedSection>
            <WhyWinSection idea={idea} />
          </RestrictedSection>
        )}
      </div>

      {idea.targetMarket && (
          <InfoCard
            icon="globe"
            title="Target Market"
            content={idea.targetMarket}
          />
        )}

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
