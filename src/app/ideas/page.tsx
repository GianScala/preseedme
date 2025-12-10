"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import FeaturedCard from "@/components/FeaturedCard";
import PublicIdeaCard from "@/components/public/PublicIdeaCard";
import SignInModal from "@/components/common/modal/SignInModal";
import HeroSearchSection from "@/components/search/HeroSearchSection";
import FiltersSection from "@/components/search/FiltersSection";
import AdBanner from "@/components/common/AdBanner";

// Context & Lib
import { useAuth } from "@/context/AuthContext";
import {
  IdeaWithLikes,
  getLatestIdeas,
  toggleLikeIdea,
  getFeaturedProjectId,
} from "@/lib/ideas";

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function IdeasLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="h-72 sm:h-80 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse" />

      {/* Featured skeleton */}
      <section>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-5 w-28 rounded-full bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse" />
      </section>

      {/* Grid skeleton */}
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
// Error State Component
// ============================================================================

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center space-y-4">
      <div className="text-5xl">⚠️</div>
      <p className="text-red-400 text-sm sm:text-base">{message}</p>
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
// Main Page Component
// ============================================================================

export default function IdeasPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Core state
  const [ideas, setIdeas] = useState<IdeaWithLikes[]>([]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [clickedButtonRef, setClickedButtonRef] =
    useState<HTMLElement | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "mostLiked">("newest");
  const [minLikes, setMinLikes] = useState(0);

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ideasData, featuredIdData] = await Promise.all([
          getLatestIdeas(50),
          getFeaturedProjectId(),
        ]);

        if (cancelled) return;

        setIdeas(ideasData);
        setFeaturedId(featuredIdData);
      } catch (err) {
        console.error("Failed to load ideas:", err);
        if (!cancelled) {
          setError("Failed to load ideas. Please try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

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
      } finally {
        setLoadingLikeId(null);
      }
    },
    [user]
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
    if (sortBy === "mostLiked") {
      result.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }

    return result;
  }, [ideas, searchQuery, selectedTags, minLikes, sortBy]);

  const hasIdeas = ideas.length > 0;

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <IdeasLoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <HeroSearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalResults={0}
          isLoading={false}
        />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!hasIdeas) {
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

      <HeroSearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResults={filteredIdeas.length}
        isLoading={false}
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
              sortBy !== "newest"
            }
            onClearAll={() => {
              setSearchQuery("");
              setSelectedTags([]);
              setSortBy("newest");
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
                  setSortBy("newest");
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

                {/* HERE IS THE UPDATED GRID (LESS HORIZONTAL GAP) */}
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
