"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import FeaturedCard from "@/components/FeaturedCard";
import PublicIdeaCard from "@/components/public/PublicIdeaCard";
import SignInModal from "@/components/common/modal/SignInModal";
import HeroSearchSection from "@/components/search/HeroSearchSection";
import FiltersSection from "@/components/search/FiltersSection";
import AdBanner from "@/components/common/AdBanner"; // Added for consistency with Home

// Context & Lib
import { useAuth } from "@/context/AuthContext";
import { 
  IdeaWithLikes, 
  getLatestIdeas, 
  toggleLikeIdea, 
  getFeaturedProjectId 
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
  const [clickedButtonRef, setClickedButtonRef] = useState<HTMLElement | null>(null);

  // Filter state
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

        // Fetch ideas list AND featured ID in parallel
        const [ideasData, featuredIdData] = await Promise.all([
          getLatestIdeas(50),
          getFeaturedProjectId()
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
        if (event) {
          setClickedButtonRef(event.currentTarget as HTMLElement);
        }
        setShowSignInModal(true);
        return;
      }

      try {
        setLoadingLikeId(ideaId);
        
        // Optimistic update logic
        setIdeas((prev) =>
          prev.map((idea) => {
            if (idea.id !== ideaId) return idea;

            const likedByUserIds = idea.likedByUserIds ?? [];
            const likeCount = idea.likeCount ?? 0;
            const alreadyLiked = likedByUserIds.includes(user.uid);

            const updatedLikedBy = alreadyLiked
              ? likedByUserIds.filter((id) => id !== user.uid) // Remove like
              : [...likedByUserIds, user.uid]; // Add like

            const updatedCount = likeCount + (alreadyLiked ? -1 : 1);

            return {
              ...idea,
              likedByUserIds: updatedLikedBy,
              likeCount: Math.max(0, updatedCount),
            };
          })
        );

        // Actual API call
        await toggleLikeIdea(ideaId, user.uid);

      } catch (err) {
        console.error("Failed to toggle like on idea:", err);
        // Optionally revert optimistic update here if needed
      } finally {
        setLoadingLikeId(null);
      }
    },
    [user]
  );

  // ============================================================================
  // Derived Data & Computations
  // ============================================================================

  const hasIdeas = ideas.length > 0;
  const currentUserId = user?.uid ?? null;

  // 1. Find the featured idea object based on the ID we fetched
  const featuredIdea = useMemo(() => {
    if (!featuredId) return null;
    return ideas.find((i) => i.id === featuredId) || null;
  }, [ideas, featuredId]);

  // 2. Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    ideas.forEach((idea) => {
      const allTagFields: string[] = [
        ...(idea.tags ?? []),
        ...(idea.sectors ?? []),
        ...(idea.targetAudiences ?? []),
        ...(idea.targetDemographics ?? []),
        ...(idea.revenueModels ?? []),
      ];
      
      if (idea.category) allTagFields.push(idea.category);
      if (idea.sector) allTagFields.push(idea.sector);
      if (idea.targetAudience) allTagFields.push(idea.targetAudience);
      if (idea.targetMarket) allTagFields.push(idea.targetMarket);
      
      allTagFields.forEach((tag) => {
        if (tag && typeof tag === "string" && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    });
    
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [ideas]);

  // 3. Calculate max like count
  const maxLikeCount = useMemo(() => {
    if (!ideas.length) return 0;
    return ideas.reduce(
      (max, idea) => Math.max(max, idea.likeCount ?? 0),
      0
    );
  }, [ideas]);

  // 4. Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((idea) => {
        const searchableFields = [
          idea.title,
          idea.oneLiner,
          idea.description,
          idea.category,
          idea.sector,
          idea.targetAudience,
          idea.targetMarket,
          idea.founderUsername,
          idea.founderHandle,
        ].filter(Boolean);
        
        const arrayFields = [
          ...(idea.tags ?? []),
          ...(idea.sectors ?? []),
          ...(idea.targetAudiences ?? []),
          ...(idea.targetDemographics ?? []),
        ];
        
        const searchableText = [...searchableFields, ...arrayFields]
          .join(" ")
          .toLowerCase();
        
        return searchableText.includes(q);
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((idea) => {
        const allIdeaTags: string[] = [
          ...(idea.tags ?? []),
          ...(idea.sectors ?? []),
          ...(idea.targetAudiences ?? []),
          ...(idea.targetDemographics ?? []),
          ...(idea.revenueModels ?? []),
        ];
        
        if (idea.category) allIdeaTags.push(idea.category);
        if (idea.sector) allIdeaTags.push(idea.sector);
        if (idea.targetAudience) allIdeaTags.push(idea.targetAudience);
        if (idea.targetMarket) allIdeaTags.push(idea.targetMarket);
        
        if (allIdeaTags.length === 0) return false;
        
        return selectedTags.every((selectedTag) =>
          allIdeaTags.some((ideaTag) => ideaTag === selectedTag)
        );
      });
    }

    // Min likes filter
    if (minLikes > 0) {
      result = result.filter((idea) => (idea.likeCount ?? 0) >= minLikes);
    }

    // Sort
    if (sortBy === "mostLiked") {
      result.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }

    return result;
  }, [ideas, searchQuery, selectedTags, sortBy, minLikes]);

  // ============================================================================
  // Filter Handlers
  // ============================================================================

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("newest");
    setMinLikes(0);
  }, []);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedTags.length > 0 ||
    minLikes > 0 ||
    sortBy !== "newest";

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
      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      {/* Hero Search Section */}
      <HeroSearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResults={filteredIdeas.length}
        isLoading={false}
      />

      {/* Content Sections */}
      <div className="space-y-6 sm:space-y-8">
        
        {/* Featured Section */}
        {featuredIdea && !searchQuery && (
          <section>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="px-3 py-2 rounded-sm bg-[var(--brand)]/10 text-brand text-xs font-semibold whitespace-nowrap flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
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

        {/* Filters Section */}
        {ideas.length > 0 && (
          <FiltersSection
            sortBy={sortBy}
            onSortChange={setSortBy}
            minLikes={minLikes}
            onMinLikesChange={setMinLikes}
            maxLikeCount={maxLikeCount}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearTags={() => setSelectedTags([])}
            allTags={allTags}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />
        )}

        {/* Results Grid */}
        {ideas.length > 0 && (
          <section>
            {filteredIdeas.length === 0 ? (
              <NoResultsState onClearFilters={clearAllFilters} />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredIdeas.map((idea) => (
                    <PublicIdeaCard
                      key={idea.id}
                      idea={idea}
                      currentUserId={currentUserId}
                      onToggleLike={() => handleToggleLike(idea.id)}
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