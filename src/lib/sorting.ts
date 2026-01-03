/**
 * Sorting utilities for ideas/projects
 */
export interface SortableIdea {
  id: string;
  createdAt: string | Date | number;
  updatedAt?: string | Date | number | null;
  likeCount?: number;
  userCount?: number | null;
  monthlyRecurringRevenue?: number | null;
}

/**
 * Normalize various timestamp formats to milliseconds
 */
function normalizeTimestamp(timestamp: string | Date | number | null | undefined): number {
  if (!timestamp) return Date.now();
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  return new Date(timestamp).getTime();
}

/**
 * Calculate a small "data presence" score based only on
 * whether we have users/MRR, NOT their actual values.
 *
 * This is intentionally a small effect and ignores the magnitude.
 *
 * @param userCount - Number of users (presence only)
 * @param mrr - Monthly Recurring Revenue (presence only)
 * @returns Presence score in [0, 1] (0, 0.5 or 1.0)
 */
function calculateTractionScore(
  userCount: number | null | undefined,
  mrr: number | null | undefined
): number {
  const hasUsers = typeof userCount === 'number' && userCount > 0;
  const hasMRR = typeof mrr === 'number' && mrr > 0;

  if (!hasUsers && !hasMRR) return 0;

  let score = 0;

  // Presence-based only: each signal contributes a small fixed amount
  if (hasUsers) score += 0.5;
  if (hasMRR) score += 0.5;

  // Possible values: 0.5 (only users or only MRR) or 1.0 (both)
  return score;
}

/**
 * Calculate relevance score for an idea
 *
 * Scoring weights (heavily biased toward recency and likes):
 * - 60% Recency (fresh/updated content, based on updatedAt or createdAt)
 * - 30% Engagement (likes - social proof)
 * - 10% Data presence (just "has users/MRR", not the value)
 *
 * @param ageInDays - How old the idea is (in days) based on last update
 * @param likeCount - Number of likes
 * @param userCount - Number of users (presence only)
 * @param mrr - Monthly Recurring Revenue (presence only)
 * @returns Relevance score (higher = more relevant)
 */
function calculateRelevanceScore(
  ageInDays: number,
  likeCount: number,
  userCount: number | null | undefined,
  mrr: number | null | undefined
): number {
  // Recency decay: ideas lose relevance as they age.
  // Kept reasonably strong since recency is the main signal.
  const recencyScore = Math.exp(-0.1 * ageInDays);

  // Engagement score: logarithmic scale to prevent high-like domination
  // 0 likes = 0, 10 likes ≈ 0.33, 100 likes ≈ 0.67, 1000 likes ≈ 1.0
  const engagementScore = likeCount > 0
    ? Math.min(Math.log10(likeCount + 1) / 3, 1)
    : 0;

  // Traction score: presence only (small boost if we have data)
  const tractionPresenceScore = calculateTractionScore(userCount, mrr); // 0–1

  // Final weighted score:
  // - 60% recency (updatedAt/createdAt)
  // - 30% engagement (likes)
  // - 10% data presence (users/MRR exist, but magnitude ignored)
  const totalScore =
    (recencyScore * 0.6) +
    (engagementScore * 0.3) +
    (tractionPresenceScore * 0.1);

  return totalScore;
}

/**
 * Smart sort that heavily favors recency & updates,
 * then likes, and only lightly uses presence of data (users/MRR).
 *
 * Algorithm:
 * - Recently updated or published ideas rank highest
 * - Ideas with more likes get a secondary boost
 * - Ideas with *any* users/MRR get a small, presence-only boost
 * - Magnitude of users/MRR is intentionally ignored
 *
 * @param ideas - Array of ideas to sort
 * @returns Sorted array (most relevant first)
 */
export function smartSort<T extends SortableIdea>(ideas: T[]): T[] {
  const now = Date.now();

  return [...ideas].sort((a, b) => {
    // Get timestamps (prefer updatedAt, fallback to createdAt)
    const aTime = normalizeTimestamp(a.updatedAt || a.createdAt);
    const bTime = normalizeTimestamp(b.updatedAt || b.createdAt);

    // Calculate age in days based on last update/publish
    const aDays = (now - aTime) / (1000 * 60 * 60 * 24);
    const bDays = (now - bTime) / (1000 * 60 * 60 * 24);

    // Calculate scores
    const aScore = calculateRelevanceScore(
      aDays,
      a.likeCount ?? 0,
      a.userCount,
      a.monthlyRecurringRevenue
    );
    const bScore = calculateRelevanceScore(
      bDays,
      b.likeCount ?? 0,
      b.userCount,
      b.monthlyRecurringRevenue
    );

    return bScore - aScore; // Higher score first
  });
}

/**
 * Sort by most liked (engagement only)
 */
export function sortByMostLiked<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
}

/**
 * Sort by newest (creation date only)
 */
export function sortByNewest<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) =>
    normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt)
  );
}

/**
 * Sort by recently updated (or created if no update)
 */
export function sortByRecentlyUpdated<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    const aTime = normalizeTimestamp(a.updatedAt || a.createdAt);
    const bTime = normalizeTimestamp(b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
}

/**
 * Sort by traction presence (users + MRR)
 *
 * NOTE: This now only considers whether there IS data (users/MRR),
 * not how large the values are. It matches the "presence-only"
 * behavior of calculateTractionScore.
 */
export function sortByTraction<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    const aScore = calculateTractionScore(a.userCount, a.monthlyRecurringRevenue);
    const bScore = calculateTractionScore(b.userCount, b.monthlyRecurringRevenue);
    return bScore - aScore;
  });
}

/**
 * Main sorting function with multiple strategies
 */
export function sortIdeas<T extends SortableIdea>(
  ideas: T[],
  sortBy: "smart" | "newest" | "mostLiked" | "recentlyUpdated" | "traction"
): T[] {
  switch (sortBy) {
    case "smart":
      return smartSort(ideas);
    case "mostLiked":
      return sortByMostLiked(ideas);
    case "recentlyUpdated":
      return sortByRecentlyUpdated(ideas);
    case "traction":
      return sortByTraction(ideas);
    case "newest":
    default:
      return sortByNewest(ideas);
  }
}
