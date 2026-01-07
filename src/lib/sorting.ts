/**
 * Sorting utilities for ideas/projects
 */
export interface SortableIdea {
  id: string;
  createdAt: string | Date | number;
  updatedAt?: string | Date | number | null;
  likeCount?: number | null; // ✅ allow null (matches Firestore + your Idea type)
  userCount?: number | null;
  monthlyRecurringRevenue?: number | null;
}

/**
 * Normalize various timestamp formats to milliseconds
 */
function normalizeTimestamp(
  timestamp: string | Date | number | null | undefined
): number {
  // ✅ don't treat 0 as "missing"
  if (timestamp == null) return Date.now();

  if (typeof timestamp === "number") return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();

  const ms = new Date(timestamp).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

/**
 * Calculate a small "data presence" score based only on
 * whether we have users/MRR, NOT their actual values.
 */
function calculateTractionScore(
  userCount: number | null | undefined,
  mrr: number | null | undefined
): number {
  const hasUsers = typeof userCount === "number" && userCount > 0;
  const hasMRR = typeof mrr === "number" && mrr > 0;

  if (!hasUsers && !hasMRR) return 0;

  let score = 0;
  if (hasUsers) score += 0.5;
  if (hasMRR) score += 0.5;

  return score; // 0.5 or 1.0
}

function calculateRelevanceScore(
  ageInDays: number,
  likeCount: number,
  userCount: number | null | undefined,
  mrr: number | null | undefined
): number {
  const recencyScore = Math.exp(-0.1 * ageInDays);

  const engagementScore =
    likeCount > 0 ? Math.min(Math.log10(likeCount + 1) / 3, 1) : 0;

  const tractionPresenceScore = calculateTractionScore(userCount, mrr);

  return recencyScore * 0.6 + engagementScore * 0.3 + tractionPresenceScore * 0.1;
}

/**
 * Smart sort: heavily favors recency & updates, then likes,
 * then presence of users/MRR (presence only).
 */
export function smartSort<T extends SortableIdea>(ideas: T[]): T[] {
  const now = Date.now();

  return [...ideas].sort((a, b) => {
    const aTime = normalizeTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = normalizeTimestamp(b.updatedAt ?? b.createdAt);

    const aDays = (now - aTime) / (1000 * 60 * 60 * 24);
    const bDays = (now - bTime) / (1000 * 60 * 60 * 24);

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

    return bScore - aScore;
  });
}

export function sortByMostLiked<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
}

export function sortByNewest<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort(
    (a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt)
  );
}

export function sortByRecentlyUpdated<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    const aTime = normalizeTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = normalizeTimestamp(b.updatedAt ?? b.createdAt);
    return bTime - aTime;
  });
}

export function sortByTraction<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    const aScore = calculateTractionScore(a.userCount, a.monthlyRecurringRevenue);
    const bScore = calculateTractionScore(b.userCount, b.monthlyRecurringRevenue);
    return bScore - aScore;
  });
}

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
