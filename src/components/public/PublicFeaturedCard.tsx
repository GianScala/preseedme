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
  // Optional: if you ever set this directly on the idea
  founderAvatarUrl?: string | null;
};

type PublicFeaturedCardProps = {
  idea: IdeaWithMeta;
  currentUserId: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
};

// Reused Micro Components
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

export default function PublicFeaturedCard({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
}: PublicFeaturedCardProps) {
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
    founderId, // from Idea
    founderAvatarUrl, // optional, if ever present on idea
  } = idea;

  // Start from whatever might be on the idea, then override from user profile
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    founderAvatarUrl ?? null
  );
  const [avatarError, setAvatarError] = useState(false);

  const likeCount = rawLikeCount ?? 0;
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);

  const mrrLabel = formatCurrencyShort(monthlyRecurringRevenue);
  const usersLabel = formatNumberShort(userCount);
  const foundedLabel = foundedYear ? String(foundedYear) : null;
  const hasMetrics = !!(mrrLabel || usersLabel || foundedLabel);

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  const founderInitial =
    founderUsername?.[0]?.toUpperCase() ??
    founderUsername?.charAt(0)?.toUpperCase() ??
    "?";

  const shouldShowInitials = !avatarUrl || avatarError;

  // --- DEBUG: base render info ---
  useEffect(() => {
    console.log("[PublicFeaturedCard] Render", {
      ideaId: id,
      founderId,
      founderUsername,
      founderAvatarUrlProp: founderAvatarUrl,
      resolvedAvatarUrl: avatarUrl,
      avatarError,
    });
  }, [id, founderId, founderUsername, founderAvatarUrl, avatarUrl, avatarError]);

  // --- Load avatar from users/{founderId}.photoURL ---
  useEffect(() => {
    if (!founderId) {
      console.warn(
        "[PublicFeaturedCard] No founderId on idea, cannot load avatar",
        { ideaId: id }
      );
      return;
    }

    let cancelled = false;

    const loadAvatar = async () => {
      try {
        console.log(
          "[PublicFeaturedCard] Fetching founder profile for avatar",
          {
            ideaId: id,
            founderId,
          }
        );

        const db = getFirebaseDb();
        const ref = doc(db, "users", founderId); // adjust collection name if needed
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn(
            "[PublicFeaturedCard] Founder profile not found, keeping initials",
            { ideaId: id, founderId }
          );
          return;
        }

        const data = snap.data() as any;
        const url: string | null =
          data.photoURL ?? data.avatarUrl ?? data.avatar ?? null;

        console.log("[PublicFeaturedCard] Loaded founder profile", {
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
          "[PublicFeaturedCard] Error loading founder avatar from profile",
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
    console.warn("[PublicFeaturedCard] Avatar image failed to load", {
      ideaId: id,
      founderId,
      avatarUrl,
    });
    setAvatarError(true);
  };

  const handleAvatarLoad = () => {
    console.log("[PublicFeaturedCard] Avatar image loaded successfully", {
      ideaId: id,
      founderId,
      avatarUrl,
    });
  };

  return (
    <div
      className="
        group relative w-full overflow-hidden rounded-2xl 
        border border-white/10 bg-gradient-to-br from-[var(--brand)]/5 to-white/[0.02]
        backdrop-blur-xl shadow-2xl transition-all duration-500
        hover:border-[var(--brand)]/30 hover:shadow-[var(--brand)]/5
      "
    >
      <Link href={`/ideas/${id}`} className="flex flex-col md:flex-row h-full">
        {/* Left: Hero Image (Desktop) / Top Image (Mobile) */}
        {thumbnailUrl && (
          <div className="relative h-56 md:h-auto md:w-2/5 overflow-hidden border-b md:border-b-0 md:border-r border-white/5 bg-neutral-900">
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20" />

            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-blue-400/80 text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                Today&apos;s Pick
              </span>
            </div>
          </div>
        )}

        {/* Right: Content */}
        <div className="flex-1 flex flex-col p-6 sm:p-8">
          {/* Header Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {sector && <TagPill text={sector} className="text-neutral-300" />}
            {targetAudience && (
              <TagPill text={targetAudience} className="text-neutral-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-[var(--brand-light)] transition-colors">
              {title}
            </h3>
            <p className="text-base sm:text-lg text-neutral-400 mb-6 line-clamp-3 leading-relaxed">
              {oneLiner}
            </p>
          </div>

          {/* Metrics & Footer */}
          <div className="mt-auto">
            {hasMetrics && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
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
                {foundedLabel && (
                  <span className="text-xs text-neutral-600 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    est. {foundedLabel}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-5 border-t border-white/10">
              {/* Founder */}
              {founderUsername && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-[var(--brand)]/20">
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
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                      Founder
                    </span>
                    <span className="text-sm font-medium text-neutral-200">
                      {founderUsername}
                    </span>
                  </div>
                </div>
              )}

              {/* Action */}
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
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HeartIcon
                    className={`w-4 h-4`}
                  />
                )}
                <span>{likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
