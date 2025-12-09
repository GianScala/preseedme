// src/lib/featured.ts
import { IdeaWithLikes } from "@/lib/ideas";

export type IdeaWithMeta = IdeaWithLikes & {
  sector?: string | null;
  targetAudience?: string | null;
};

// Simple deterministic hash so the "random" pick is stable for the day
function hashString(str: string): number {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

/**
 * Picks a "featured" idea for the current day.
 * Same idea for all users for that day, changes the next day.
 */
export function pickFeaturedIdeaForToday(
  ideas: IdeaWithMeta[]
): IdeaWithMeta | null {
  if (!ideas.length) return null;

  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hash = hashString(todayKey);
  const index = hash % ideas.length;

  return ideas[index];
}
