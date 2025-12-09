import { IdeaWithLikes } from "@/lib/ideas";

export interface SearchResult {
  idea: IdeaWithLikes;
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * Smart search function with relevance scoring
 * Returns ideas sorted by relevance
 */
export function searchIdeas(
  ideas: IdeaWithLikes[],
  searchQuery: string
): SearchResult[] {
  if (!searchQuery.trim()) {
    return ideas.map((idea) => ({
      idea,
      relevanceScore: 0,
      matchedFields: [],
    }));
  }

  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/);

  const results: SearchResult[] = [];

  for (const idea of ideas) {
    let relevanceScore = 0;
    const matchedFields: string[] = [];

    // Extract all searchable fields
    const title = idea.title?.toLowerCase() || "";
    const oneLiner = idea.oneLiner?.toLowerCase() || "";
    const description = idea.description?.toLowerCase() || "";
    
    // Primary categorization
    const category = idea.category?.toLowerCase() || "";
    const tags = idea.tags?.map((t) => t.toLowerCase()) || [];
    
    // Secondary categorization (backwards compatible)
    const sector = idea.sector?.toLowerCase() || "";
    const sectors = idea.sectors?.map((s) => s.toLowerCase()) || [];
    const targetAudience = idea.targetAudience?.toLowerCase() || "";
    const targetAudiences = idea.targetAudiences?.map((t) => t.toLowerCase()) || [];
    
    const founderUsername = idea.founderUsername?.toLowerCase() || "";

    // Check each search term
    for (const term of searchTerms) {
      // Title match (highest weight)
      if (title.includes(term)) {
        relevanceScore += 10;
        if (!matchedFields.includes("title")) matchedFields.push("title");
      }

      // One-liner match (high weight)
      if (oneLiner.includes(term)) {
        relevanceScore += 8;
        if (!matchedFields.includes("oneLiner")) matchedFields.push("oneLiner");
      }

      // Category match (very high weight - primary categorization)
      if (category.includes(term)) {
        relevanceScore += 12;
        if (!matchedFields.includes("category")) matchedFields.push("category");
      }

      // Tags match (high weight - specific keywords)
      if (tags.some((tag) => tag.includes(term))) {
        relevanceScore += 10;
        if (!matchedFields.includes("tags")) matchedFields.push("tags");
      }

      // Sector/Sectors match (high weight)
      if (sector.includes(term) || sectors.some((s) => s.includes(term))) {
        relevanceScore += 9;
        if (!matchedFields.includes("sector")) matchedFields.push("sector");
      }

      // Target audience match (medium weight)
      if (targetAudience.includes(term) || targetAudiences.some((t) => t.includes(term))) {
        relevanceScore += 6;
        if (!matchedFields.includes("targetAudience"))
          matchedFields.push("targetAudience");
      }

      // Description match (lower weight)
      if (description.includes(term)) {
        relevanceScore += 4;
        if (!matchedFields.includes("description"))
          matchedFields.push("description");
      }

      // Founder match (medium weight)
      if (founderUsername.includes(term)) {
        relevanceScore += 7;
        if (!matchedFields.includes("founder")) matchedFields.push("founder");
      }
    }

    // Bonus: Exact phrase match
    if (title.includes(query)) {
      relevanceScore += 15;
    }
    if (oneLiner.includes(query)) {
      relevanceScore += 12;
    }
    if (category.includes(query)) {
      relevanceScore += 15;
    }

    // Only include ideas that matched at least one field
    if (relevanceScore > 0) {
      results.push({
        idea,
        relevanceScore,
        matchedFields,
      });
    }
  }

  // Sort by relevance score (highest first)
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Check if a single idea matches the search query
 */
export function ideaMatchesSearch(
  idea: IdeaWithLikes,
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;

  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/);

  const title = idea.title?.toLowerCase() || "";
  const oneLiner = idea.oneLiner?.toLowerCase() || "";
  const description = idea.description?.toLowerCase() || "";
  const category = idea.category?.toLowerCase() || "";
  const tags = idea.tags?.map((t) => t.toLowerCase()) || [];
  const sector = idea.sector?.toLowerCase() || "";
  const sectors = idea.sectors?.map((s) => s.toLowerCase()) || [];
  const targetAudience = idea.targetAudience?.toLowerCase() || "";
  const targetAudiences = idea.targetAudiences?.map((t) => t.toLowerCase()) || [];
  const founderUsername = idea.founderUsername?.toLowerCase() || "";

  return searchTerms.some((term) => {
    return (
      title.includes(term) ||
      oneLiner.includes(term) ||
      description.includes(term) ||
      category.includes(term) ||
      tags.some((tag) => tag.includes(term)) ||
      sector.includes(term) ||
      sectors.some((s) => s.includes(term)) ||
      targetAudience.includes(term) ||
      targetAudiences.some((t) => t.includes(term)) ||
      founderUsername.includes(term)
    );
  });
}