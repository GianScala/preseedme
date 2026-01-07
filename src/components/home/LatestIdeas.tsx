"use client";

import Link from "next/link";
import { IdeaWithLikes } from "@/lib/ideas";
import IdeaCard from "@/components/IdeaCard";

interface LatestIdeasProps {
  ideas: IdeaWithLikes[];
  totalCount: number;
  currentUserId: string | null;
  onToggleLike: (ideaId: string) => void;
  loadingLikeId: string | null;
}

export default function LatestIdeas({
  ideas,
  totalCount,
  currentUserId,
  onToggleLike,
  loadingLikeId,
}: LatestIdeasProps) {
  return (
    <section className="py-16 sm:py-20 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Latest Ideas</h2>
            <p className="text-neutral-500 text-sm">Fresh projects looking for their first believers</p>
          </div>
          <Link
            href="/ideas"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-brand hover:text-brand-light transition-colors"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              currentUserId={currentUserId}
              onToggleLike={onToggleLike}
              loadingLikeId={loadingLikeId}
            />
          ))}
        </div>

        {ideas.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            No ideas yet. Be the first to submit one!
          </div>
        )}

        <Link
          href="/ideas"
          className="sm:hidden flex items-center justify-center gap-2 mt-6 text-sm text-brand"
        >
          View all projects
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}