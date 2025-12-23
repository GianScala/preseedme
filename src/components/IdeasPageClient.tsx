// components/IdeasPageClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Components
import FeaturedCard from "@/components/FeaturedCard";
import PublicIdeaCard from "@/components/public/PublicIdeaCard";
import SignInModal from "@/components/common/modal/SignInModal";
import HeroSearchSection from "@/components/search/HeroSearchSection";
import FiltersSection from "@/components/search/FiltersSection";

// Context & Lib
import { useAuth } from "@/context/AuthContext";
import { IdeaWithLikes, toggleLikeIdea } from "@/lib/ideas";
import { sortIdeas } from "@/lib/sorting";

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function IdeasLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-72 sm:h-80 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse" />
      <section>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-5 w-28 rounded-full bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse" />
      </section>
      <section>
        <div className="h-24 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState() {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="text-6xl">💡</div>
      <div>
        <p className="text-neutral-400 text-lg font-medium">
          No ideas published yet
        </p>
        <p className="text-neutral-500 text-sm mt-1">
          Be the first to share your billion dollar idea!
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// No Results Component
// ============================================================================

function NoResultsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="text-6xl">🔍</div>
      <div>
        <p className="text-neutral-400 text-base sm:text-lg font-medium">
          No projects match your filters
        </p>
        <p className="text-neutral-500 text-sm mt-1">
          Try adjusting your search or clearing filters
        </p>
      </div>
      <button
        type="button"
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-white transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Clear all filters
      </button>
    </div>
  );
}

// ============================================================================
// Refresh Banner Component
// ============================================================================

function RefreshBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <p className="text-sm text-neutral-300">
          New ideas available
        </p>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-medium rounded transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Error Banner Component
// ============================================================================

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start justify-between">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-red-200">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// Main Client Component
// ============================================================================

interface IdeasPageClientProps {
  initialIdeas: IdeaWithLikes[];
  initialFeaturedId: string | null;
  serverGeneratedAt: string;
  initialError?: string;
}

export default function IdeasPageClient({
  initialIdeas,
  initialFeaturedId,
  serverGeneratedAt,
  initialError,
}: IdeasPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Core state
  const [ideas, setIdeas] = useState<IdeaWithLikes[]>(initialIdeas);
  const [featuredId, setFeaturedId] = useState<string | null>(initialFeaturedId);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [clickedButtonRef, setClickedButtonRef] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(initialError || null);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(serverGeneratedAt);
  
  // Refs
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const visibilityCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"smart" | "newest" | "mostLiked" | "recentlyUpdated">("smart");
  const [minLikes, setMinLikes] = useState(0);

  // ============================================================================
  // Refresh Handler
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setShowRefreshBanner(false);
    
    try {
      // Force router to refetch server component
      router.refresh();
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Failed to refresh:', err);
      setError('Failed to refresh ideas. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  // ============================================================================
  // Auto-refresh on Page Visibility
  // ============================================================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 [Client] Tab became visible, refreshing...');
        
        // Debounce to avoid multiple rapid refreshes
        if (visibilityCheckRef.current) {
          clearTimeout(visibilityCheckRef.current);
        }
        
        visibilityCheckRef.current = setTimeout(() => {
          handleRefresh();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityCheckRef.current) {
        clearTimeout(visibilityCheckRef.current);
      }
    };
  }, [handleRefresh]);

  // ============================================================================
  // Update State When Server Data Changes
  // ============================================================================

  useEffect(() => {
    // Only update if server generated new data
    if (serverGeneratedAt !== lastGeneratedAt) {
      console.log('🔄 [Client] Server data changed, updating state');
      setIdeas(initialIdeas);
      setFeaturedId(initialFeaturedId);
      setLastGeneratedAt(serverGeneratedAt);
      
      // Show banner if user is active and data updated
      if (!document.hidden && ideas.length > 0 && initialIdeas.length !== ideas.length) {
        setShowRefreshBanner(true);
        
        // Auto-hide banner after 10 seconds
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
          setShowRefreshBanner(false);
        }, 10000);
      }
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [initialIdeas, initialFeaturedId, serverGeneratedAt, lastGeneratedAt, ideas.length]);

  // ============================================================================
  // Optional: Periodic Polling for Real-time Updates
  // ============================================================================

  useEffect(() => {
    // Poll every 30 seconds if tab is visible
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('⏰ [Client] Periodic refresh check');
        router.refresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [router]);

  // ============================================================================
  // Like Toggle Handler
  // ============================================================================

  const handleToggleLike = useCallback(
    async (ideaId: string, event?: React.MouseEvent) => {
      if (!user) {
        if (event) setClickedButtonRef(event.currentTarget as HTMLElement);
        setShowSignInModal(true);
        return;
      }

      try {
        setLoadingLikeId(ideaId);

        // Optimistic update
        setIdeas((prev) =>
          prev.map((idea) => {
            if (idea.id !== ideaId) return idea;

            const likedByUserIds = idea.likedByUserIds ?? [];
            const likeCount = idea.likeCount ?? 0;
            const alreadyLiked = likedByUserIds.includes(user.uid);

            const updatedLikes = alreadyLiked
              ? likedByUserIds.filter((id) => id !== user.uid)
              : [...likedByUserIds, user.uid];

            return {
              ...idea,
              likedByUserIds: updatedLikes,
              likeCount: Math.max(0, likeCount + (alreadyLiked ? -1 : 1)),
            };
          })
        );

        await toggleLikeIdea(ideaId, user.uid);
      } catch (err) {
        console.error("Failed to toggle like:", err);
        setError("Failed to update like. Please try again.");
        
        // Revert optimistic update on error
        router.refresh();
      } finally {
        setLoadingLikeId(null);
      }
    },
    [user, router]
  );

  // ============================================================================
  // Derived Data
  // ============================================================================

  const currentUserId = user?.uid ?? null;

  const featuredIdea = useMemo(() => {
    if (!featuredId) return null;
    return ideas.find((i) => i.id === featuredId) || null;
  }, [ideas, featuredId]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();

    ideas.forEach((idea) => {
      const all: string[] = [
        ...(idea.tags ?? []),
        ...(idea.sectors ?? []),
        ...(idea.targetAudiences ?? []),
        ...(idea.targetDemographics ?? []),
      ];
      if (idea.category) all.push(idea.category);
      if (idea.sector) all.push(idea.sector);
      if (idea.targetAudience) all.push(idea.targetAudience);

      all.forEach((tag) => {
        if (tag && typeof tag === "string") tags.add(tag);
      });
    });

    return Array.from(tags).sort();
  }, [ideas]);

  const maxLikeCount = useMemo(() => {
    return ideas.reduce((max, idea) => Math.max(max, idea.likeCount ?? 0), 0);
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((idea) =>
        `${idea.title} ${idea.oneLiner} ${idea.description}`
          .toLowerCase()
          .includes(q)
      );
    }

    // Tags
    if (selectedTags.length > 0) {
      result = result.filter((idea) => {
        const ideaTags = new Set([
          ...(idea.tags ?? []),
          ...(idea.sectors ?? []),
          ...(idea.targetAudiences ?? []),
        ]);

        return selectedTags.every((t) => ideaTags.has(t));
      });
    }

    // Min likes
    if (minLikes > 0) {
      result = result.filter((i) => (i.likeCount ?? 0) >= minLikes);
    }

    // Sorting
    result = sortIdeas(result, sortBy);

    return result;
  }, [ideas, searchQuery, selectedTags, minLikes, sortBy]);

  const hasIdeas = ideas.length > 0;

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isRefreshing) {
    return <IdeasLoadingSkeleton />;
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (!hasIdeas && !initialError) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <HeroSearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalResults={0}
          isLoading={false}
        />
        <EmptyState />
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      {showRefreshBanner && <RefreshBanner onRefresh={handleRefresh} />}
      
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <HeroSearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResults={filteredIdeas.length}
        isLoading={isRefreshing}
      />

      <div className="space-y-6 sm:space-y-8">
        {/* Featured */}
        {featuredIdea && !searchQuery && (
          <section>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <span className="px-3 py-1 rounded-lg bg-[var(--brand)]/10 text-brand text-xs font-semibold whitespace-nowrap">
                Featured
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

        {/* Filters */}
        {ideas.length > 0 && (
          <FiltersSection
            sortBy={sortBy}
            onSortChange={setSortBy}
            minLikes={minLikes}
            onMinLikesChange={setMinLikes}
            maxLikeCount={maxLikeCount}
            selectedTags={selectedTags}
            onToggleTag={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag)
                  ? prev.filter((t) => t !== tag)
                  : [...prev, tag]
              )
            }
            onClearTags={() => setSelectedTags([])}
            allTags={allTags}
            hasActiveFilters={
              searchQuery !== "" ||
              selectedTags.length > 0 ||
              minLikes > 0 ||
              sortBy !== "smart"
            }
            onClearAll={() => {
              setSearchQuery("");
              setSelectedTags([]);
              setSortBy("smart");
              setMinLikes(0);
            }}
          />
        )}

        {/* Grid */}
        {ideas.length > 0 && (
          <section>
            {filteredIdeas.length === 0 ? (
              <NoResultsState
                onClearFilters={() => {
                  setSearchQuery("");
                  setSelectedTags([]);
                  setSortBy("smart");
                  setMinLikes(0);
                }}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-200">
                    {searchQuery ? "Search Results" : "Projects"}
                  </h2>
                  <span className="text-xs sm:text-sm text-neutral-500">
                    {filteredIdeas.length}{" "}
                    {filteredIdeas.length === 1 ? "project" : "projects"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-4">
                  {filteredIdeas.map((idea) => (
                    <PublicIdeaCard
                      key={idea.id}
                      idea={idea}
                      currentUserId={currentUserId}
                      onToggleLike={() => { void handleToggleLike(idea.id); }}
                      loadingLike={loadingLikeId === idea.id}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}