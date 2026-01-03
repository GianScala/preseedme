"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import FeaturedCard from "@/components/FeaturedCard";
import PublicIdeaCard from "@/components/public/PublicIdeaCard";
import PublicWeeklyWinner from "@/components/public/PublicWeeklyWinner";
import SignInModal from "@/components/common/modal/SignInModal";
import HeroSearchSection from "@/components/search/HeroSearchSection";
import FiltersSection from "@/components/search/FiltersSection";

// Context & Lib
import { useAuth } from "@/context/AuthContext";
import { IdeaWithLikes, toggleLikeIdea } from "@/lib/ideas";
import { sortIdeas } from "@/lib/sorting";
import type { WeeklyWinner } from "@/lib/weeklyWinners";

// ============================================================================
// Helper Components
// ============================================================================

function EmptyState() {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="text-6xl">💡</div>
      <div>
        <p className="text-neutral-400 text-lg font-medium">No ideas published yet</p>
        <p className="text-neutral-500 text-sm mt-1">Be the first to share your billion dollar idea!</p>
      </div>
    </div>
  );
}

function NoResultsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="text-6xl">🔍</div>
      <p className="text-neutral-400 text-base font-medium">No projects match your filters</p>
      <button onClick={onClearFilters} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-white transition-colors">
        Clear all filters
      </button>
    </div>
  );
}

function RefreshBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <p className="text-sm text-neutral-300">New ideas available</p>
        <button onClick={onRefresh} className="px-3 py-1 bg-[var(--brand)] text-white text-sm font-medium rounded">Refresh</button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Client Component
// ============================================================================

interface IdeasPageClientProps {
  initialIdeas: IdeaWithLikes[];
  initialFeaturedId: string | null;
  initialWeeklyWinners: WeeklyWinner[]; // <-- Add this prop
  serverGeneratedAt: string;
  initialError?: string;
}

export default function IdeasPageClient({
  initialIdeas,
  initialFeaturedId,
  initialWeeklyWinners,
  serverGeneratedAt,
  initialError,
}: IdeasPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<IdeaWithLikes[]>(initialIdeas);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinner[]>(initialWeeklyWinners);
  const [featuredId, setFeaturedId] = useState<string | null>(initialFeaturedId);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(serverGeneratedAt);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"smart" | "newest" | "mostLiked" | "recentlyUpdated">("smart");
  const [minLikes, setMinLikes] = useState(0);

  const currentUserId = user?.uid ?? null;

  // Get set of weekly winner IDs for filtering
  const weeklyWinnerIds = useMemo(() => 
    new Set(weeklyWinners.map(w => w.idea.id)),
    [weeklyWinners]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setShowRefreshBanner(false);
    try {
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally { setIsRefreshing(false); }
  }, [router]);

  useEffect(() => {
    if (serverGeneratedAt !== lastGeneratedAt) {
      setIdeas(initialIdeas);
      setWeeklyWinners(initialWeeklyWinners);
      setFeaturedId(initialFeaturedId);
      setLastGeneratedAt(serverGeneratedAt);
    }
  }, [initialIdeas, initialWeeklyWinners, initialFeaturedId, serverGeneratedAt, lastGeneratedAt]);

  const handleToggleLike = useCallback(async (ideaId: string) => {
    if (!user) { setShowSignInModal(true); return; }
    
    const updateLikes = (idea: IdeaWithLikes) => {
      if (idea.id !== ideaId) return idea;
      const likedByUserIds = idea.likedByUserIds ?? [];
      const alreadyLiked = likedByUserIds.includes(user.uid);
      return {
        ...idea,
        likedByUserIds: alreadyLiked 
          ? likedByUserIds.filter(id => id !== user.uid) 
          : [...likedByUserIds, user.uid],
        likeCount: Math.max(0, (idea.likeCount ?? 0) + (alreadyLiked ? -1 : 1)),
      };
    };

    try {
      setLoadingLikeId(ideaId);
      
      // Update main ideas list
      setIdeas(prev => prev.map(updateLikes));
      
      // Also update weekly winners if the liked idea is in there
      setWeeklyWinners(prev => prev.map(winner => ({
        ...winner,
        idea: updateLikes(winner.idea),
      })));

      await toggleLikeIdea(ideaId, user.uid);
    } catch (err) { 
      router.refresh(); 
    } finally { 
      setLoadingLikeId(null); 
    }
  }, [user, router]);

  const featuredIdea = useMemo(() => 
    featuredId ? ideas.find(i => i.id === featuredId) || null : null
  , [ideas, featuredId]);

  // Filter and sort ideas, EXCLUDING weekly winners
  const filteredIdeas = useMemo(() => {
    // Start with ideas that are NOT in weekly winners
    let result = ideas.filter(idea => !weeklyWinnerIds.has(idea.id));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => `${i.title} ${i.oneLiner}`.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      result = result.filter(i => {
        const tags = new Set([...(i.tags ?? []), i.sector, i.targetAudience]);
        return selectedTags.every(t => tags.has(t));
      });
    }
    if (minLikes > 0) {
      result = result.filter(i => (i.likeCount ?? 0) >= minLikes);
    }
    
    return sortIdeas(result, sortBy);
  }, [ideas, weeklyWinnerIds, searchQuery, selectedTags, minLikes, sortBy]);

  // Filter weekly winners when search/filters are active
  const filteredWeeklyWinners = useMemo(() => {
    if (!searchQuery.trim() && selectedTags.length === 0 && minLikes === 0) {
      return weeklyWinners;
    }

    return weeklyWinners.filter(({ idea }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!`${idea.title} ${idea.oneLiner}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedTags.length > 0) {
        const tags = new Set([...(idea.tags ?? []), idea.sector, idea.targetAudience]);
        if (!selectedTags.every(t => tags.has(t))) {
          return false;
        }
      }
      if (minLikes > 0 && (idea.likeCount ?? 0) < minLikes) {
        return false;
      }
      return true;
    });
  }, [weeklyWinners, searchQuery, selectedTags, minLikes]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("smart");
    setMinLikes(0);
  };

  const hasActiveFilters = searchQuery !== "" || selectedTags.length > 0 || minLikes > 0 || sortBy !== "smart";
  const totalResults = filteredWeeklyWinners.length + filteredIdeas.length;

  if (ideas.length === 0 && weeklyWinners.length === 0 && !initialError) {
    return (
      <div className="space-y-8 pb-20">
        <HeroSearchSection searchQuery={searchQuery} onSearchChange={setSearchQuery} totalResults={0} isLoading={false} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />
      {showRefreshBanner && <RefreshBanner onRefresh={handleRefresh} />}

      <HeroSearchSection 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        totalResults={totalResults} 
        isLoading={isRefreshing} 
      />

      <div className="space-y-12">
        {/* Featured Card */}
        {featuredIdea && !searchQuery && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                Featured Selection
              </span>
            </div>
            <FeaturedCard 
              idea={featuredIdea} 
              currentUserId={currentUserId} 
              onToggleLike={() => handleToggleLike(featuredIdea.id)} 
              loadingLike={loadingLikeId === featuredIdea.id} 
            />
          </section>
        )}

        <FiltersSection
          sortBy={sortBy} 
          onSortChange={setSortBy} 
          minLikes={minLikes} 
          onMinLikesChange={setMinLikes}
          maxLikeCount={ideas.reduce((max, i) => Math.max(max, i.likeCount ?? 0), 0)}
          selectedTags={selectedTags} 
          onToggleTag={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
          onClearTags={() => setSelectedTags([])} 
          allTags={[]}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearFilters}
        />

        {totalResults === 0 ? (
          <NoResultsState onClearFilters={clearFilters} />
        ) : (
          <>
            {/* Weekly Winners Section */}
            {filteredWeeklyWinners.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Projects of the Week</h2>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {filteredWeeklyWinners.map(({ idea, rank }) => (
                    <PublicWeeklyWinner
                      key={idea.id}
                      idea={idea}
                      rank={rank}
                      currentUserId={currentUserId}
                      onToggleLike={() => handleToggleLike(idea.id)}
                      loadingLike={loadingLikeId === idea.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Remaining Ideas Leaderboard (excluding weekly winners) */}
            {filteredIdeas.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {filteredWeeklyWinners.length > 0 ? "Leaderboard" : "All Ideas"}
                  </h2>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    {filteredIdeas.length} {filteredIdeas.length === 1 ? "IDEA" : "IDEAS"}
                  </span>
                </div>

                <div className="flex flex-col gap-5">
                  {filteredIdeas.map((idea, index) => (
                    <PublicIdeaCard
                      key={idea.id}
                      idea={idea}
                      rank={filteredWeeklyWinners.length + index + 1}
                      currentUserId={currentUserId}
                      onToggleLike={() => handleToggleLike(idea.id)}
                      loadingLike={loadingLikeId === idea.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}