"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureProtocol } from "@/lib/utils";
import HeartIcon from "@/components/icons/HeartIcon";
import { IdeaMetaChips } from "@/components/ideas/IdeaMetaChips";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";

interface IdeaHeaderProps {
  idea: IdeaWithLikes;
  user: any;
  isOwner: boolean;
  onToggleLike: () => void;
  likeLoading: boolean;
}

export default function IdeaHeader({
  idea,
  user,
  isOwner,
  onToggleLike,
  likeLoading,
}: IdeaHeaderProps) {
  const router = useRouter();

  const isLiked = user ? (idea.likedByUserIds ?? []).includes(user.uid) : false;
  const likeCount = idea.likeCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & External Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/")}
          className="
            self-start flex items-center gap-2
            text-xs sm:text-sm text-neutral-400
            hover:text-neutral-200 transition-colors
            group
          "
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back Home
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {idea.websiteUrl && (
            <a
              href={ensureProtocol(idea.websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2
                rounded-lg border border-neutral-800 bg-neutral-900/50
                hover:bg-neutral-800 transition-all hover:border-neutral-700
                text-neutral-300
              "
            >
              Visit website
            </a>
          )}
          {idea.demoVideoUrl && (
            <a
              href={ensureProtocol(idea.demoVideoUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2
                rounded-lg bg-brand/10 border border-brand/20 text-brand
                hover:bg-brand/20 hover:border-brand/40 transition-all
                shadow-[0_0_15px_-3px_rgba(var(--brand-rgb),0.15)]
              "
            >
              Watch demo
            </a>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        {/* Left Column: Text Info */}
        <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {idea.title}
            </h1>
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              {idea.oneLiner}
            </p>

            <IdeaMetaChips idea={idea} />
          </div>

          {/* Founder Profile */}
          <div className="flex items-center gap-3 pt-2">
            <div className="
              w-10 h-10 sm:w-12 sm:h-12 rounded-xl 
              bg-gradient-to-br from-brand to-brand-dark 
              flex items-center justify-center 
              text-lg sm:text-xl font-bold text-black shadow-lg shadow-brand/20
            ">
              {idea.founderUsername?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Created By
              </span>
              <Link
                href={`/profile/${idea.founderId}`}
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-white hover:text-brand transition-colors"
              >
                <span>{idea.founderUsername}</span>
                {idea.founderHandle && (
                  <span className="text-neutral-500 font-normal">@{idea.founderHandle}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Thumbnail & Like Action */}
        {idea.thumbnailUrl && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-brand/20 to-purple-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <img
              src={idea.thumbnailUrl}
              alt={idea.title}
              className="relative w-full rounded-2xl border border-neutral-800 bg-neutral-900 object-cover aspect-video shadow-2xl"
            />

            {/* Like Button Overlay */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              <button
                onClick={onToggleLike}
                disabled={likeLoading || isOwner}
                className={`
                  flex items-center gap-2
                  px-3 sm:px-4 py-1.5 sm:py-2
                  rounded-xl border backdrop-blur-md shadow-lg
                  text-xs sm:text-sm font-medium
                  transition-all duration-200
                  ${
                    isLiked
                      ? "bg-rose-500/90 border-rose-500 text-white hover:bg-rose-600"
                      : "bg-neutral-900/80 border-neutral-700/50 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600"
                  }
                  ${isOwner ? "cursor-default opacity-100" : "active:scale-95"}
                `}
              >
                <HeartIcon 
                  filled={isLiked} 
                  className={isLiked ? "text-white" : "text-neutral-400 group-hover:text-rose-400"} 
                />
                <span>{likeCount}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}