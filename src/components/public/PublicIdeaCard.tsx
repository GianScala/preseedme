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

// --- Micro Components for cleaner UI ---

const TagPill = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border border-white/5 bg-white/5 backdrop-blur-md ${className}`}
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
  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 backdrop-blur-sm shadow-sm">
    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
    <span className="text-xs font-semibold text-neutral-200">{value}</span>
    <span className="text-[10px] text-neutral-500 uppercase tracking-wide hidden sm:inline opacity-80">
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
    founderId, // <- from Idea type
  } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const likeCount = rawLikeCount ?? 0;
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);

  // Formatting metrics
  const mrrLabel = formatCurrencyShort(monthlyRecurringRevenue);
  const usersLabel = formatNumberShort(userCount);
  const foundedYearLabel = foundedYear ? String(foundedYear) : null;
  const hasMetrics = !!(mrrLabel || usersLabel || foundedYearLabel);

  const founderInitial =
    founderUsername?.charAt(0).toUpperCase() || founderUsername || "U";
  const shouldShowInitials = !avatarUrl || avatarError;

  // --- DEBUG: base render info ---
  useEffect(() => {
    console.log("[PublicIdeaCard] Render", {
      ideaId: id,
      founderId,
      founderUsername,
      currentAvatarUrl: avatarUrl,
      avatarError,
    });
  }, [id, founderId, founderUsername, avatarUrl, avatarError]);

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
        console.log("[PublicIdeaCard] Fetching founder profile for avatar", {
          ideaId: id,
          founderId,
        });

        const db = getFirebaseDb();
        const ref = doc(db, "users", founderId); // adjust collection name if needed
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

        console.log("[PublicIdeaCard] Loaded founder profile", {
          ideaId: id,
          founderId,
          photoURL: data.photoURL,
          resolvedAvatarUrl: url,
        });

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
    console.warn("[PublicIdeaCard] Avatar image failed to load", {
      ideaId: id,
      founderId,
      avatarUrl,
    });
    setAvatarError(true);
  };

  const handleAvatarLoad = () => {
    console.log("[PublicIdeaCard] Avatar image loaded successfully", {
      ideaId: id,
      founderId,
      avatarUrl,
    });
  };

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent Link navigation
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  return (
    <div className="group relative flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/40 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1">
      {/* 1. HOVER BACKGROUND EFFECT */}
      {thumbnailUrl && (
        <div className="absolute inset-0 -z-10 transition-all duration-700 opacity-0 group-hover:opacity-30">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 group-hover:scale-100 transition-transform duration-700"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      {/* 2. MAIN CLICKABLE AREA */}
      <Link
        href={`/ideas/${id}`}
        className="flex-1 flex flex-col p-5 sm:p-6 z-10 relative"
      >
        {/* Header: Tags & Mini Thumbnail */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex flex-wrap gap-2 content-start">
            {sector && (
              <TagPill
                text={sector}
                className="text-neutral-300 group-hover:bg-black/40 transition-colors"
              />
            )}
            {targetAudience && (
              <TagPill
                text={targetAudience}
                className="text-neutral-400 group-hover:bg-black/40 transition-colors"
              />
            )}
          </div>

          {/* Mini Thumbnail */}
          {thumbnailUrl && (
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-neutral-800 shadow-sm group-hover:shadow-md transition-all">
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight group-hover:text-[var(--brand-light)] transition-colors duration-300 drop-shadow-sm">
            {title}
          </h3>
          <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed group-hover:text-neutral-300 transition-colors duration-300">
            {oneLiner}
          </p>
        </div>

        {/* Metrics Row */}
        {hasMetrics && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
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
              <span className="text-xs text-neutral-600 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5 group-hover:text-neutral-500">
                est. {foundedYearLabel}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* 3. FOOTER: Founder & Actions */}
      <div className="relative z-20 px-5 sm:px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between mt-auto group-hover:bg-black/20 transition-colors">
        {/* Founder Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-[10px] font-bold text-black shadow-lg shadow-[var(--brand)]/10">
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
          <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
            by{" "}
            <span className="text-neutral-200 font-medium">
              {founderUsername || "Anonymous"}
            </span>
          </span>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLikeClick}
          disabled={loadingLike}
          className={`
            flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
            ${
              isLiked
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/15 hover:text-white hover:border-white/30"
            }
            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loadingLike ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <HeartIcon
              className={`w-3.5 h-3.5 ${isLiked ? "animate-pulse-fast" : ""}`}
            />
          )}
          <span>{likeCount}</span>
        </button>
      </div>
    </div>
  );
}
