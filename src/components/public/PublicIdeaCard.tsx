"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import { IdeaWithLikes } from "@/lib/ideas";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type IdeaWithMeta = IdeaWithLikes & {
  sector?: string | null;
  targetAudience?: string | null;
};

type PublicIdeaCardProps = {
  idea: IdeaWithMeta;
  currentUserId: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
};

// --- Micro Components (match weekly card style) ---

const TagPill = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border border-white/5 bg-white/5/40 backdrop-blur-md ${className}`}
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

// --- Main Component ---

export default function PublicIdeaCard({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
}: PublicIdeaCardProps) {
  const {
    id,
    title,
    oneLiner,
    thumbnailUrl,
    monthlyRecurringRevenue,
    userCount,
    foundedYear,
    likeCount: rawLikeCount,
    likedByUserIds = [],
    founderUsername,
    sector,
    targetAudience,
    founderId,
  } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const likeCount = rawLikeCount ?? 0;
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);

  const mrrLabel = formatCurrencyShort(monthlyRecurringRevenue);
  const usersLabel = formatNumberShort(userCount);
  const foundedYearLabel = foundedYear ? String(foundedYear) : null;
  const hasMetrics = !!(mrrLabel || usersLabel || foundedYearLabel);

  const founderInitial =
    founderUsername?.charAt(0).toUpperCase() || founderUsername || "U";
  const shouldShowInitials = !avatarUrl || avatarError;

  // --- Load avatar from users/{founderId}.photoURL ---
  useEffect(() => {
    if (!founderId) {
      console.warn(
        "[PublicIdeaCard] No founderId on idea, cannot load avatar",
        { ideaId: id }
      );
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
            "[PublicIdeaCard] Founder profile not found, keeping initials",
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
          "[PublicIdeaCard] Error loading founder avatar from profile",
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

  const handleAvatarLoad = () => {};

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        border border-white/10 hover:border-white/30
        transition-colors
        bg-neutral-900/20
        w-full
        h-[380px] sm:h-[400px]
      `}
    >
      {/* Whole card clickable */}
      <Link href={`/ideas/${id}`} className="flex flex-col h-full">
        {/* -------- HEADER IMAGE (same style as weekly winner) -------- */}
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
          </div>
        )}

        {/* -------- TRANSLUCENT CONTENT SECTION -------- */}
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
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-[12px] sm:text-[13px] text-neutral-300 leading-relaxed line-clamp-3">
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
              {foundedYearLabel && (
                <span className="text-[11px] text-neutral-300 font-mono bg-white/5/40 px-2 py-1 rounded-md border border-white/10">
                  est. {foundedYearLabel}
                </span>
              )}
            </div>
          )}

          {/* Footer: founder + likes */}
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
                <span className="text-[11px] text-neutral-200 truncate max-w-[120px]">
                  {founderUsername || "Anonymous"}
                </span>
              </div>
            </div>

            {/* Like button (compact, same vibe as weekly card) */}
            <button
              onClick={handleLikeClick}
              disabled={loadingLike}
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
