"use client";

import { useEffect, useState, ReactNode } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { mapIdeaDoc, toggleLikeIdea } from "@/lib/ideas";
import type { IdeaWithLikes } from "@/lib/ideas";

import { useAuth } from "@/context/AuthContext";

import SignInModal from "@/components/common/modal/SignInModal";
import IdeaHeader from "@/components/ideas/IdeaHeader";
import MetricsGrid from "@/components/ideas/MetricsGrid";
import FundraisingCard from "@/components/ideas/FundraisingCard";
import InfoCard from "@/components/ideas/InfoCard";
import WhyWinSection from "@/components/ideas/WhyWinSection";
import ActionButtons from "@/components/ideas/ActionButtons";
import LoadingSpinner from "@/components/common/ideas/LoadingSpinner";
import NotFound from "@/components/common/ideas/NotFound";
import MilestonesCard from "@/components/ideas/MilestonesCard";
import RightSection from "@/components/ideas/RightSection";
import { Lock } from "lucide-react";

export type { IdeaWithLikes };

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();

  const [idea, setIdea] = useState<IdeaWithLikes | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const loadIdea = async () => {
      setLoading(true);
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "ideas", id));
        if (mounted) {
          snap.exists() ? setIdea(mapIdeaDoc(snap)) : setIdea(null);
        }
      } catch (err) {
        console.error("Error loading idea:", err);
        if (mounted) setError("Failed to load idea");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadIdea();
    return () => { mounted = false; };
  }, [id]);

  const handleToggleLike = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    if (!idea || likeLoading) return;

    const previousIdea = { ...idea };
    const isLiked = (idea.likedByUserIds ?? []).includes(user.uid);

    // FIX: Optimistic update with strict null-safety for the array
    setIdea((prev) => {
      if (!prev) return null;
      const currentLikes = prev.likedByUserIds ?? [];
      const newLikes = isLiked
        ? currentLikes.filter((uid) => uid !== user.uid)
        : [...currentLikes, user.uid];

      return {
        ...prev,
        likedByUserIds: newLikes,
        likeCount: (prev.likeCount ?? 0) + (isLiked ? -1 : 1),
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

  if (loading) return <LoadingSpinner />;
  if (!idea) return <NotFound />;

  const isOwner = !!(user && idea.founderId === user.uid);

  const RestrictedSection = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
    if (user) return <div className={className}>{children}</div>;
    return (
      <div
        onClick={() => setShowSignInModal(true)}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl ${className}`}
      >
        <div className="blur-md select-none pointer-events-none grayscale opacity-60 transition-all duration-500">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl transition-transform group-hover:scale-105">
            <Lock className="w-3 h-3 text-brand" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Login to view</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-12 px-4 max-w-7xl mx-auto">
      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />

      <div className="mb-6">
        <IdeaHeader
          idea={idea}
          user={user}
          isOwner={isOwner}
          onToggleLike={handleToggleLike}
          likeLoading={likeLoading}
        />
      </div>

      {/* items-start prevents RightSection from being pushed down */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1 lg:w-3/4 space-y-6">
          <div className="lg:hidden">
            <RightSection 
              idea={idea} 
              user={user} 
              onToggleLike={handleToggleLike} 
              likeLoading={likeLoading} 
              onAuthTrigger={() => setShowSignInModal(true)}
              isOwner={isOwner}
            />
          </div>

          <div className="grid gap-6">
            <MetricsGrid idea={idea} />
            {idea.description && <InfoCard title="About" content={idea.description} />}
            {idea.isFundraising && <RestrictedSection><FundraisingCard idea={idea} /></RestrictedSection>}
            <RestrictedSection className="space-y-6">
              <MilestonesCard idea={idea} />
              <WhyWinSection idea={idea} />
            </RestrictedSection>
            {/* Comments are now in RightSection for Desktop */}
          </div>
        </div>

        <aside className="hidden lg:block lg:w-1/4 sticky top-24">
          <RightSection 
            idea={idea} 
            user={user} 
            onToggleLike={handleToggleLike} 
            likeLoading={likeLoading} 
            onAuthTrigger={() => setShowSignInModal(true)}
            isOwner={isOwner}
          />
        </aside>
      </div>

      {error && (
        <div className="fixed bottom-8 right-8 z-50 bg-red-900/90 border border-red-700/50 text-white px-4 py-3 rounded-lg backdrop-blur-md text-sm shadow-2xl">
          {error}
        </div>
      )}
      <ActionButtons idea={idea} user={user} isOwner={isOwner} setError={setError} />
    </div>
  );
}