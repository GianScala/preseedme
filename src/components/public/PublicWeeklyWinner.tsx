"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import type { IdeaWithLikes } from "@/lib/ideas";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type IdeaWithMeta = IdeaWithLikes & {
  sector?: string | null;
  targetAudience?: string | null;
  founderAvatarUrl?: string | null;
};

type PublicWeeklyWinnerProps = {
  idea: IdeaWithMeta;
  currentUserId: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
  rank: number;
};

/* ---------------- Rank Styles (compact) ---------------- */

const getRankConfig = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        label: "1st Place",
        cardBorder: "border-yellow-400/60",
        hoverBorder: "hover:border-yellow-300",
        badgeClass:
          "border-yellow-300 text-yellow-200 bg-black/70 shadow-[0_0_10px_rgba(250,204,21,0.5)]",
      };
    case 2:
      return {
        label: "2nd Place",
        cardBorder: "border-neutral-300/50",
        hoverBorder: "hover:border-neutral-200",
        badgeClass:
          "border-neutral-300 text-neutral-100 bg-black/70 shadow-[0_0_8px_rgba(212,212,212,0.4)]",
      };
    case 3:
      return {
        label: "3rd Place",
        cardBorder: "border-amber-400/60",
        hoverBorder: "hover:border-amber-300",
        badgeClass:
          "border-amber-300 text-amber-100 bg-black/70 shadow-[0_0_8px_rgba(251,191,36,0.4)]",
      };
    default:
      return {
        label: `Top #${rank}`,
        cardBorder: "border-[var(--brand)]/50",
        hoverBorder: "hover:border-[var(--brand-light)]",
        badgeClass:
          "border-[var(--brand)] text-[var(--brand-light)] bg-black/70 shadow-[0_0_8px_rgba(33,221,192,0.4)]",
      };
  }
};

/* ---------------- Micro Components ---------------- */

const TagPill = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-white/5 bg-white/5/40 backdrop-blur-md ${className}`}
  >
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
  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5/30 border border-white/10 backdrop-blur-sm">
    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
    <span className="text-[11px] font-semibold text-neutral-200">{value}</span>
    <span className="text-[9px] text-neutral-500 uppercase tracking-wide hidden sm:inline opacity-80">
      {label}
    </span>
  </div>
);

/* ---------------- Main Component ---------------- */

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
    targetAudience,
    founderId,
    founderAvatarUrl,
  } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    founderAvatarUrl ?? null
  );
  const [avatarError, setAvatarError] = useState(false);

  const likeCount = rawLikeCount ?? 0;
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);

  const mrrLabel = formatCurrencyShort(monthlyRecurringRevenue);
  const usersLabel = formatNumberShort(userCount);
  const hasMetrics = !!(mrrLabel || usersLabel);

  const founderInitial =
    founderUsername?.[0]?.toUpperCase() ??
    founderUsername?.charAt(0)?.toUpperCase() ??
    "?";
  const shouldShowInitials = !avatarUrl || avatarError;

  const rankConfig = getRankConfig(rank);

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  // Load avatar from users/{founderId}
  useEffect(() => {
    if (!founderId) return;

    let cancelled = false;

    const loadAvatar = async () => {
      try {
        const db = getFirebaseDb();
        const ref = doc(db, "users", founderId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const data = snap.data() as any;
        const url: string | null =
          data.photoURL ?? data.avatarUrl ?? data.avatar ?? null;

        if (!cancelled) {
          setAvatarUrl(url);
          setAvatarError(false);
        }
      } catch (error) {
        console.error("[PublicWeeklyWinner] Error loading founder avatar", {
          ideaId: id,
          founderId,
          error,
        });
      }
    };

    loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [id, founderId]);

  const handleAvatarError = () => setAvatarError(true);
  const handleAvatarLoad = () => {};

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        ${rankConfig.cardBorder} ${rankConfig.hoverBorder}
        transition-colors
        w-[280px] sm:w-[300px]
        h-[380px] sm:h-[400px]
        flex flex-col
        bg-neutral-900/20
      `}
    >
      <Link href={`/ideas/${id}`} className="flex flex-col h-full">
        {/* ---------------- HEADER IMAGE ONLY ---------------- */}
        {thumbnailUrl && (
          <div className="relative h-40 w-full overflow-hidden border-b border-white/10">
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Fade to dark at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Rank badge */}
            <div className="absolute top-3 left-3 z-20">
              <span
                className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px]
                  font-semibold uppercase tracking-wide backdrop-blur-md border
                  ${rankConfig.badgeClass}
                `}
              >
                {rankConfig.label}
              </span>
            </div>
          </div>
        )}

        {/* ---------------- TRANSLUCENT CONTENT SECTION ---------------- */}
        <div className="flex-1 flex flex-col px-4 pt-3 pb-4 gap-3 bg-black/20 backdrop-blur-sm">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {sector && <TagPill text={sector} className="text-neutral-300" />}
            {targetAudience && (
              <TagPill text={targetAudience} className="text-neutral-400" />
            )}
          </div>

          {/* Title + description */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-[12px] text-neutral-300 leading-relaxed line-clamp-3">
              {oneLiner}
            </p>
          </div>

          {/* Metrics */}
          {hasMetrics && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              {mrrLabel && (
                <MetricBadge
                  value={mrrLabel}
                  label="MRR"
                  dotColor="bg-emerald-500"
                />
              )}
              {usersLabel && (
                <MetricBadge
                  value={usersLabel}
                  label="Users"
                  dotColor="bg-[var(--brand)]"
                />
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            {/* Founder */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-[10px] font-bold text-black">
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
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-400 uppercase tracking-wide">
                  Founder
                </span>
                <span className="text-[11px] text-neutral-200 truncate max-w-[110px]">
                  {founderUsername}
                </span>
              </div>
            </div>

            {/* Like button */}
            <button
              type="button"
              disabled={loadingLike}
              onClick={handleLikeClick}
              className={`
                flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                ${
                  isLiked
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                    : "bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 hover:text-white"
                }
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {loadingLike ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <HeartIcon
                className={`w-3.5 h-3.5`}
                />
              )}
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
