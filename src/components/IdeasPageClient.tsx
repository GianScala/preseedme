"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Search, Plus, X } from "lucide-react";

// Components
import FeaturedCard from "@/components/FeaturedCard";
import SignInModal from "@/components/common/modal/SignInModal";
import AdvertiseModal from "@/components/common/modal/AdvertiseModal";
import UnifiedLeaderboard from "@/components/UnifiedLeaderboard";

// Context & Lib
import { useAuth } from "@/context/AuthContext";
import { IdeaWithLikes, toggleLikeIdea } from "@/lib/ideas";
import type { WeeklyWinner } from "@/lib/weeklyWinners";

// ============================================================================
// Helpers (optimized “smart” search without extra UI)
// ============================================================================

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

function normalize(str: string) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreIdea(idea: IdeaWithLikes, rawQuery: string) {
  const q = normalize(rawQuery);
  if (!q) return 0;

  const title = normalize(idea.title);
  const oneLiner = normalize(idea.oneLiner);
  const sector = normalize(idea.sector || "");
  const audience = normalize(idea.targetAudience || "");

  const hay = `${title} ${oneLiner} ${sector} ${audience}`.trim();

  const tokens = q.split(" ").filter(Boolean);
  const tokenHits = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);

  // Must match something
  if (!hay.includes(q) && tokenHits === 0) return 0;

  let score = 0;

  // Strong title weighting
  if (title === q) score += 240;
  if (title.startsWith(q)) score += 170;
  if (title.includes(q)) score += 120;

  // Other fields
  if (oneLiner.includes(q)) score += 70;
  if (sector.includes(q)) score += 45;
  if (audience.includes(q)) score += 35;

  // Token boosts
  const titleTokenHits = tokens.reduce(
    (acc, t) => acc + (title.includes(t) ? 1 : 0),
    0
  );
  score += titleTokenHits * 28 + tokenHits * 10;

  // Tie-breaker: prefer tighter title length
  score += Math.max(0, 24 - Math.min(24, Math.abs(title.length - q.length)));

  return score;
}

// ============================================================================
// Helper Components
// ============================================================================

function EmptyState() {
  return (
    <div className="space-y-4 py-16 text-center">
      <div className="text-6xl">💡</div>
      <div>
        <p className="text-lg font-medium text-neutral-400">
          No ideas published yet
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Be the first to share your billion dollar idea!
        </p>
      </div>
    </div>
  );
}

function RefreshBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-slide-down">
      <div className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <p className="text-sm text-neutral-300">New ideas available</p>
        <button
          onClick={onRefresh}
          className="rounded bg-[var(--brand)] px-3 py-1 text-sm font-medium text-white"
          type="button"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function AdvertiseLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-[var(--brand)]"
      type="button"
    >
      <Megaphone className="h-3.5 w-3.5" />
      <span className="underline decoration-neutral-600 underline-offset-2 group-hover:decoration-[var(--brand)]/50">
        Advertise your startup here
      </span>
    </button>
  );
}

// ============================================================================
// Hero Section (Search icon on the left + clear button on the right)
// Fix: prevent iOS Safari “input focus zoom” by ensuring font-size >= 16px on mobile
// ============================================================================

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResults: number;
  isSearching: boolean;
  onAddStartup: () => void;
}

function HeroSection({
  searchQuery,
  onSearchChange,
  totalResults,
  isSearching,
  onAddStartup,
}: HeroSectionProps) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:py-28 xl:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Discover Tomorrow&apos;s{" "}
          <span className="text-brand">Unicorns Today</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-neutral-400 md:text-lg lg:text-xl">
          Find your next investment opportunity among early-stage startups
        </p>

        {/* Search + Add button (centered, responsive) */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:mt-12">
          {/* Search bar */}
          <div className="relative w-full flex-1">
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search startups..."
              // IMPORTANT: iOS Safari zooms inputs with font-size < 16px.
              // So we force 16px on mobile to keep it fixed (no page zoom).
              className="h-12 w-full rounded-xl border border-white/10 bg-neutral-900/80 pl-12 pr-12 text-[16px] text-white placeholder-neutral-500 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:border-white/20 focus:border-brand/50 focus:outline-none focus:ring-brand/40 sm:h-14 sm:text-base"
            />

            {/* Icon AFTER input + z-index to avoid being “invisible” */}
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-neutral-500"
            />

            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-2 text-neutral-500 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add your startup button (matches your CTA style) */}
          <button
            onClick={onAddStartup}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-brand/30 bg-brand/10 px-6 text-sm font-semibold text-brand backdrop-blur-md transition-all duration-300 hover:bg-brand/20 hover:shadow-[0_0_20px_rgba(var(--brand-rgb),0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-14 sm:w-auto sm:text-base lg:px-8"
            type="button"
          >
            <span className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Plus className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span className="relative">Add your startup</span>
          </button>
        </div>

        {/* Results indicator */}
        {searchQuery.trim() && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            {isSearching ? (
              <span className="flex items-center gap-2 text-neutral-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
                Searching…
              </span>
            ) : (
              <span className="text-neutral-400">
                Found{" "}
                <span className="font-semibold text-[var(--brand)]">
                  {totalResults}
                </span>{" "}
                {totalResults === 1 ? "result" : "results"} for{" "}
                <span className="text-neutral-300">“{searchQuery}”</span>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Main Client Component
// ============================================================================

interface IdeasPageClientProps {
  initialIdeas: IdeaWithLikes[];
  initialFeaturedId: string | null;
  initialWeeklyWinners: WeeklyWinner[];
  serverGeneratedAt: string;
  initialError?: string;
  bookedFeatureDates?: string[];
}

export default function IdeasPageClient({
  initialIdeas,
  initialFeaturedId,
  initialWeeklyWinners,
  serverGeneratedAt,
  initialError,
  bookedFeatureDates = [],
}: IdeasPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<IdeaWithLikes[]>(initialIdeas);
  const [weeklyWinners, setWeeklyWinners] =
    useState<WeeklyWinner[]>(initialWeeklyWinners);
  const [featuredId, setFeaturedId] = useState<string | null>(initialFeaturedId);
  const [loadingLikeId, setLoadingLikeId] = useState<string | null>(null);

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(serverGeneratedAt);

  // Advertise modal state
  const [showAdvertiseModal, setShowAdvertiseModal] = useState(false);
  const [advertiseIdeaId, setAdvertiseIdeaId] = useState<string | null>(null);
  const [advertiseIdeaTitle, setAdvertiseIdeaTitle] = useState<string>("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 160);
  const isSearching = searchQuery.trim() !== debouncedQuery.trim();

  const currentUserId = user?.uid ?? null;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setShowRefreshBanner(false);
    try {
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (serverGeneratedAt !== lastGeneratedAt) {
      setIdeas(initialIdeas);
      setWeeklyWinners(initialWeeklyWinners);
      setFeaturedId(initialFeaturedId);
      setLastGeneratedAt(serverGeneratedAt);
      setError(initialError || null);
    }
  }, [
    initialIdeas,
    initialWeeklyWinners,
    initialFeaturedId,
    serverGeneratedAt,
    lastGeneratedAt,
    initialError,
  ]);

  const handleToggleLike = useCallback(
    async (ideaId: string) => {
      if (!user) {
        setShowSignInModal(true);
        return;
      }

      const updateLikes = (idea: IdeaWithLikes) => {
        if (idea.id !== ideaId) return idea;

        const likedByUserIds = idea.likedByUserIds ?? [];
        const alreadyLiked = likedByUserIds.includes(user.uid);

        return {
          ...idea,
          likedByUserIds: alreadyLiked
            ? likedByUserIds.filter((id) => id !== user.uid)
            : [...likedByUserIds, user.uid],
          likeCount: Math.max(
            0,
            (idea.likeCount ?? 0) + (alreadyLiked ? -1 : 1)
          ),
        };
      };

      try {
        setLoadingLikeId(ideaId);
        setIdeas((prev) => prev.map(updateLikes));
        setWeeklyWinners((prev) =>
          prev.map((winner) => ({ ...winner, idea: updateLikes(winner.idea) }))
        );
        await toggleLikeIdea(ideaId, user.uid);
      } catch {
        router.refresh();
      } finally {
        setLoadingLikeId(null);
      }
    },
    [user, router]
  );

  const handleOpenAdvertise = useCallback(() => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    setAdvertiseIdeaId("");
    setAdvertiseIdeaTitle("Select your startup");
    setShowAdvertiseModal(true);
  }, [user]);

  // Add Startup -> /ideas/new
  const handleAddStartup = useCallback(() => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    router.push("/ideas/new");
  }, [user, router]);

  const handleFeatureCheckout = useCallback(
    (selectedDates: string[], totalAmount: number, ideaId: string) => {
      if (!user) return;
      try {
        console.log("Feature checkout:", { ideaId, selectedDates, totalAmount });
        alert(
          `Checkout: $${totalAmount.toFixed(2)} for ${selectedDates.length} days`
        );
        setShowAdvertiseModal(false);
      } catch (err) {
        console.error("Checkout error:", err);
      }
    },
    [user]
  );

  const featuredIdea = useMemo(
    () => (featuredId ? ideas.find((i) => i.id === featuredId) || null : null),
    [ideas, featuredId]
  );

  // Smarter search: debounced + weighted ranking (no extra UI)
  const filteredIdeas = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return ideas;

    return ideas
      .map((idea) => ({ idea, score: scoreIdea(idea, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.idea);
  }, [ideas, debouncedQuery]);

  const filteredWeeklyWinners = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return weeklyWinners;

    return weeklyWinners
      .map((w) => ({ w, score: scoreIdea(w.idea as any, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.w);
  }, [weeklyWinners, debouncedQuery]);

  const totalResults = filteredWeeklyWinners.length + filteredIdeas.length;

  if (ideas.length === 0 && weeklyWinners.length === 0 && !initialError) {
    return (
      <div className="space-y-8 pb-20">
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalResults={0}
          isSearching={false}
          onAddStartup={handleAddStartup}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20 sm:space-y-8">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <AdvertiseModal
        isOpen={showAdvertiseModal}
        onClose={() => setShowAdvertiseModal(false)}
        ideaId={advertiseIdeaId || ""}
        ideaTitle={advertiseIdeaTitle}
        bookedDates={bookedFeatureDates}
        onCheckout={handleFeatureCheckout}
      />

      {showRefreshBanner && <RefreshBanner onRefresh={handleRefresh} />}

      {/* Hero: ONLY search + add button */}
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResults={totalResults}
        isSearching={isSearching || isRefreshing}
        onAddStartup={handleAddStartup}
      />

      {/* Featured */}
      {featuredIdea && !debouncedQuery.trim() && (
        <section className="space-y-3 px-4 sm:px-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Featured Selection
            </span>
          </div>

          <FeaturedCard
            idea={featuredIdea}
            currentUserId={currentUserId}
            onToggleLike={() => handleToggleLike(featuredIdea.id)}
            loadingLike={loadingLikeId === featuredIdea.id}
          />

          <AdvertiseLink onClick={handleOpenAdvertise} />
        </section>
      )}

      {!featuredIdea && !debouncedQuery.trim() && (
        <div className="px-4 text-center sm:px-0">
          <AdvertiseLink onClick={handleOpenAdvertise} />
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-4 sm:px-0">
        <UnifiedLeaderboard
          ideas={filteredIdeas}
          weeklyWinners={filteredWeeklyWinners}
          currentUserId={currentUserId}
          onToggleLike={handleToggleLike}
          loadingLikeId={loadingLikeId}
          isLoading={isRefreshing}
          externalSearchQuery={debouncedQuery}
        />
      </div>

      {error && (
        <div className="px-4 sm:px-0">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
