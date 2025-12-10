"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import { IdeaWithLikes } from "@/lib/ideas";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// --- Types ---

type IdeaWithMeta = IdeaWithLikes & {
  sector?: string | null;
  targetAudience?: string | null;
};

type PublicWeeklyWinnerProps = {
  idea: IdeaWithMeta;
  currentUserId: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
  rank: number;
};

// --- Configuration ---

const getRankConfig = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        label: "1st Place",
        badgeClass:
          "bg-yellow-500/10 border-yellow-500/50 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
      };
    case 2:
      return {
        label: "2nd Place",
        badgeClass:
          "bg-neutral-400/10 border-neutral-400/50 text-neutral-200 shadow-[0_0_15px_rgba(163,163,163,0.1)]",
      };
    case 3:
      return {
        label: "3rd Place",
        badgeClass:
          "bg-amber-700/10 border-amber-700/50 text-amber-200 shadow-[0_0_15px_rgba(180,83,9,0.2)]",
      };
    default:
      return {
        label: `#${rank} Top Rated`,
        badgeClass: "bg-white/5 border-white/10 text-neutral-300 shadow-none",
      };
  }
};

// --- Sub-Components ---

const TagPill = ({ text }: { text: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/5 bg-white/5 text-neutral-400">
    {text}
  </span>
);

const MetricBadge = ({
  value,
  label,
  dotColor,
}: {
  value: string;
  label: string;
  dotColor: string;
}) => (
  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 shadow-sm">
    <span
      className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${dotColor}`}
    />
    <span className="text-xs font-semibold text-neutral-200">{value}</span>
    <span className="text-[10px] text-neutral-500 uppercase tracking-wider hidden sm:inline opacity-70">
      {label}
    </span>
  </div>
);

// --- Main Component ---

export default function PublicWeeklyWinner({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
  rank,
}: PublicWeeklyWinnerProps) {
  const {
    id,
    title,
    oneLiner,
    thumbnailUrl,
    monthlyRecurringRevenue,
    userCount,
    likeCount: rawLikeCount,
    likedByUserIds = [],
    founderUsername,
    sector,
    founderId,
  } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const likeCount = rawLikeCount ?? 0;
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);
  const rankConfig = getRankConfig(rank);

  const mrrLabel = formatCurrencyShort(monthlyRecurringRevenue);
  const usersLabel = formatNumberShort(userCount);
  const hasMetrics = !!(mrrLabel || usersLabel);

  const founderInitial =
    founderUsername?.charAt(0).toUpperCase() || founderUsername || "U";
  const shouldShowInitials = !avatarUrl || avatarError;

  // --- Load avatar from users/{founderId}.photoURL ---
  useEffect(() => {
    if (!founderId) {
      console.warn("[WeeklyWinner] No founderId on idea, cannot load avatar", {
        ideaId: id,
      });
      return;
    }

    let cancelled = false;

    const loadAvatar = async () => {
      try {
        const db = getFirebaseDb();
        const ref = doc(db, "users", founderId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn(
            "[WeeklyWinner] Founder profile not found, keeping initials",
            { ideaId: id, founderId }
          );
          return;
        }

        const data = snap.data() as any;
        const url: string | null =
          data.photoURL ?? data.avatarUrl ?? data.avatar ?? null;

        if (!cancelled) {
          setAvatarUrl(url);
          setAvatarError(false);
        }
      } catch (error) {
        console.error(
          "[WeeklyWinner] Error loading founder avatar from profile",
          {
            ideaId: id,
            founderId,
            error,
          }
        );
      }
    };

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [id, founderId]);

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const handleAvatarLoad = () => {
    // Avatar loaded successfully; nothing else to do for now.
  };

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  return (
    <div className="group relative flex flex-col w-[300px] sm:w-[340px] h-full rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 ease-out hover:border-white/10 hover:shadow-2xl hover:-translate-y-1">
      {/* 1. GLOBAL LINK OVERLAY (Makes entire card clickable) */}
      <Link
        href={`/ideas/${id}`}
        className="absolute inset-0 z-10 focus:outline-none"
        aria-label={`View ${title}`}
      >
        <span className="sr-only">View Idea</span>
      </Link>

      {/* 2. HOVER BACKGROUND IMAGE */}
      {thumbnailUrl && (
        <div className="absolute inset-0 -z-10 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover blur-xl opacity-40 will-change-transform transition-transform duration-1000 ease-out"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        </div>
      )}

      {/* 3. RANK BADGE */}
      <div
        className={`absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border ${rankConfig.badgeClass}`}
      >
        <span className="text-[11px] font-bold tracking-wide uppercase">
          {rankConfig.label}
        </span>
      </div>

      {/* 4. MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-5 sm:p-6 pt-14 pointer-events-none">
        {/* Thumbnail & Sector */}
        <div className="flex justify-between items-start gap-4 mb-3">
          {/* Sector Tag */}
          <div className="flex-1">
            {sector && <TagPill text={sector} />}
          </div>

          {/* Mini Thumbnail */}
          {thumbnailUrl && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-neutral-800 shadow-sm shrink-0">
              <img
                src={thumbnailUrl}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 mt-1">
          <h3 className="text-lg font-bold text-white leading-snug mb-1.5 group-hover:text-[var(--brand-light)] transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed group-hover:text-neutral-300 transition-colors duration-300">
            {oneLiner}
          </p>
        </div>

        {/* Metrics Row */}
        {hasMetrics && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
            {mrrLabel && (
              <MetricBadge
                value={mrrLabel}
                label="MRR"
                dotColor="bg-emerald-500 text-emerald-500"
              />
            )}
            {usersLabel && (
              <MetricBadge
                value={usersLabel}
                label="Users"
                dotColor="bg-[var(--brand)] text-[var(--brand)]"
              />
            )}
          </div>
        )}
      </div>

      {/* 5. FOOTER */}
      <div className="relative z-20 px-5 sm:px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between pointer-events-none group-hover:bg-white/[0.04] transition-colors">
        {/* Founder Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-[9px] font-bold text-black shadow-[0_0_10px_rgba(33,221,192,0.2)]">
            {shouldShowInitials ? (
              founderInitial
            ) : (
              <img
                src={avatarUrl as string}
                alt={`${founderUsername}'s avatar`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={handleAvatarError}
                onLoad={handleAvatarLoad}
              />
            )}
          </div>
          <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors">
            By {founderUsername}
          </span>
        </div>

        {/* Like Button (Interactive Exception) */}
        <button
          onClick={handleLikeClick}
          disabled={loadingLike}
          className={`
            pointer-events-auto
            relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
            ${
              isLiked
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
            }
          `}
        >
          {loadingLike ? (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <HeartIcon
              className={`w-3.5 h-3.5 ${
                isLiked ? "fill-current animate-pulse-fast" : ""
              }`}
            />
          )}
          <span>{likeCount}</span>
        </button>
      </div>
    </div>
  );
}
