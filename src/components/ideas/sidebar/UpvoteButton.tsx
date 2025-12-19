"use client";

import { ArrowBigUpDash } from "lucide-react";

export default function UpvoteButton({ idea, user, onToggleLike, likeLoading }: any) {
  const isLiked = user && (idea.likedByUserIds ?? []).includes(user.uid);
  
  return (
    <button 
      onClick={onToggleLike}
      disabled={likeLoading}
      className={`w-full overflow-hidden rounded-2xl border shadow-xl transition-all active:scale-[0.98] ${
        isLiked 
          ? "bg-rose-500 border-rose-400" 
          : "bg-gradient-to-br from-neutral-950/40 via-neutral-900/20 to-neutral-900 border-neutral-800/70 hover:border-brand/50"
      }`}
    >
      <div className="flex items-center justify-center gap-3 px-5 py-4">
        <ArrowBigUpDash 
          className={`w-6 h-6 ${isLiked ? "fill-white text-white" : "text-white"}`} 
        />
        <div className="text-left">
          <div className="text-sm font-bold text-white tracking-tight">
            {isLiked ? "Upvoted" : "Upvote"}
          </div>
          <div className="text-xs text-neutral-400 font-medium">
            {idea.likeCount || 0} {idea.likeCount === 1 ? 'Supporter' : 'Supporters'}
          </div>
        </div>
      </div>
    </button>
  );
}