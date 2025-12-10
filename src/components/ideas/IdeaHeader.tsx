"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureProtocol } from "@/lib/utils";
import HeartIcon from "@/components/icons/HeartIcon";
import { IdeaMetaChips } from "@/components/ideas/IdeaMetaChips";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";

import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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

  const { founderId, founderUsername } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const founderInitial =
    founderUsername?.[0]?.toUpperCase() ??
    founderUsername?.charAt(0)?.toUpperCase() ??
    "?";

  const shouldShowInitials = !avatarUrl || avatarError;

  // -----------------------------
  // LOAD FOUNDER AVATAR
  // -----------------------------
  useEffect(() => {
    if (!founderId) return;

    let cancelled = false;

    (async () => {
      try {
        const db = getFirebaseDb();
        const ref = doc(db, "users", founderId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const data = snap.data() as any;

        const url: string | null =
          data.photoURL ??
          data.avatarUrl ??
          data.avatar ??
          null;

        if (!cancelled) {
          setAvatarUrl(url);
          setAvatarError(false);
        }
      } catch (err) {
        console.error("Failed loading founder avatar:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [founderId]);

  const handleAvatarError = () => setAvatarError(true);

  // NEW: safe like handler that allows owner to like/unlike too
  const handleLikeClick = () => {
    if (likeLoading) return;
    if (!user) {
      // optionally redirect to auth; or just return
      router.push("/auth");
      return;
    }
    onToggleLike();
  };

  return (
    <div className="space-y-10">
      {/* DESKTOP GO BACK (sm+) */}
      <div className="hidden sm:flex justify-end">
        <button
          onClick={() => router.back()}
          className="
            flex items-center gap-2
            text-sm text-neutral-400 hover:text-white
            transition-colors px-3 py-1.5 rounded-lg 
            bg-neutral-900/70 border border-neutral-800
          "
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              d="M15 6L9 12L15 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Go back
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            {/* MOBILE GO BACK (<sm) */}
            <div className="flex items-start justify-between gap-2 sm:hidden">
              <h1 className="flex-1 text-3xl font-bold text-white leading-tight">
                {idea.title}
              </h1>

              <button
                onClick={() => router.back()}
                className="
                  flex items-center justify-center
                  rounded-full border border-neutral-800 bg-neutral-900/70
                  text-neutral-300 hover:text-white hover:bg-neutral-800
                  transition-colors w-8 h-8 text-xs
                "
                aria-label="Back"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path
                    d="M15 6L9 12L15 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* DESKTOP TITLE */}
            <h1 className="hidden sm:block text-4xl md:text-5xl font-bold text-white leading-tight">
              {idea.title}
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              {idea.oneLiner}
            </p>

            <IdeaMetaChips idea={idea} />
          </div>

          {/* Founder Block */}
          <div className="flex items-center gap-3 pt-2">
            <div
              className="
                w-10 h-10 sm:w-12 sm:h-12 rounded-xl 
                bg-gradient-to-br from-brand to-brand-dark 
                flex items-center justify-center text-lg sm:text-xl 
                font-bold text-black shadow-lg shadow-brand/20
                overflow-hidden
              "
            >
              {shouldShowInitials ? (
                founderInitial
              ) : (
                <img
                  src={avatarUrl as string}
                  alt="Founder avatar"
                  onError={handleAvatarError}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Created By
              </span>
              <Link
                href={`/profile/${idea.founderId}`}
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-white hover:text-brand transition-colors"
              >
                {idea.founderUsername}
                {idea.founderHandle && (
                  <span className="text-neutral-500">
                    @{idea.founderHandle}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        {idea.thumbnailUrl && (
          <div className="lg:col-span-1 space-y-4">
            {/* CTAs ABOVE IMAGE */}
            {(idea.websiteUrl || idea.demoVideoUrl) && (
              <div className="flex flex-wrap justify-end gap-2">
                {idea.websiteUrl && (
                  <a
                    href={ensureProtocol(idea.websiteUrl)}
                    target="_blank"
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                  >
                    Visit website
                  </a>
                )}
                {idea.demoVideoUrl && (
                  <a
                    href={ensureProtocol(idea.demoVideoUrl)}
                    target="_blank"
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20"
                  >
                    Watch demo
                  </a>
                )}
              </div>
            )}

            {/* Thumbnail */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-brand/20 to-purple-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50" />
              <img
                src={idea.thumbnailUrl}
                alt={idea.title}
                className="relative w-full rounded-2xl border border-neutral-800 object-cover aspect-video shadow-2xl"
              />

              {/* Like Button */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-xl 
                    backdrop-blur-md border shadow-lg text-xs sm:text-sm
                    ${
                      isLiked
                        ? "bg-rose-500/90 border-rose-500 text-white hover:bg-rose-600"
                        : "bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                >
                  <HeartIcon
                    className={isLiked ? "text-white" : "text-neutral-400"}
                  />
                  <span>{likeCount}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
