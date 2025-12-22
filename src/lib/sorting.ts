/**
 * Sorting utilities for ideas/projects
 */

export interface SortableIdea {
    id: string;
    createdAt: string | Date | number;
    updatedAt?: string | Date | number | null;
    likeCount?: number;
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
   * Calculate relevance score for an idea
   * 
   * @param ageInDays - How old the idea is (in days)
   * @param likeCount - Number of likes
   * @returns Relevance score (higher = more relevant)
   */
  function calculateRelevanceScore(
    ageInDays: number,
    likeCount: number
  ): number {
    // Recency decay: ideas lose 10% relevance per day
    // After 7 days, recency score ≈ 0.48
    // After 30 days, recency score ≈ 0.04
    const recencyScore = Math.exp(-0.1 * ageInDays);
    
    // Engagement score: logarithmic scale to prevent high-like domination
    // 0 likes = 0, 10 likes ≈ 1, 100 likes ≈ 2, 1000 likes ≈ 3
    const engagementScore = likeCount > 0 ? Math.log10(likeCount + 1) : 0;
    
    // Weights:
    // - 70% recency (prioritize fresh/updated content)
    // - 30% engagement (quality signal)
    const totalScore = (recencyScore * 0.7) + (engagementScore * 0.3);
    
    return totalScore;
  }
  
  /**
   * Smart sort that balances recency (updates) with engagement (likes)
   * 
   * Algorithm:
   * - Recently updated ideas get a boost
   * - Ideas with more likes get a boost
   * - Decay factor reduces score as ideas age
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
      
      // Calculate age in days
      const aDays = (now - aTime) / (1000 * 60 * 60 * 24);
      const bDays = (now - bTime) / (1000 * 60 * 60 * 24);
      
      // Calculate scores
      const aScore = calculateRelevanceScore(aDays, a.likeCount ?? 0);
      const bScore = calculateRelevanceScore(bDays, b.likeCount ?? 0);
      
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
   * Sort by recently updated
   */
  export function sortByRecentlyUpdated<T extends SortableIdea>(ideas: T[]): T[] {
    return [...ideas].sort((a, b) => {
      const aTime = normalizeTimestamp(a.updatedAt || a.createdAt);
      const bTime = normalizeTimestamp(b.updatedAt || b.createdAt);
      return bTime - aTime;
    });
  }
  
  /**
   * Main sorting function with multiple strategies
   */
  export function sortIdeas<T extends SortableIdea>(
    ideas: T[],
    sortBy: "smart" | "newest" | "mostLiked" | "recentlyUpdated"
  ): T[] {
    switch (sortBy) {
      case "smart":
        return smartSort(ideas);
      case "mostLiked":
        return sortByMostLiked(ideas);
      case "recentlyUpdated":
        return sortByRecentlyUpdated(ideas);
      case "newest":
      default:
        return sortByNewest(ideas);
    }
  }