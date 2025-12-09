// src/components/IdeaCard.tsx
import type { MouseEvent } from "react";
import Link from "next/link";
import { Idea } from "@/types";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";

type IdeaWithLikes = Idea & {
  likeCount?: number;
  likedByUserIds?: string[];
};

type IdeaCardProps = {
  idea: IdeaWithLikes;
  featured?: boolean;
  /** Only true in contexts where the owner can edit (e.g. profile page) */
  showEdit?: boolean;
  /** Authenticated user id (used to know if they liked this idea) */
  currentUserId?: string | null;
  /** Called when the user clicks the like button */
  onToggleLike?: () => void;
  /** Show loading state for the like action */
  loadingLike?: boolean;
};

const pillBase =
  "inline-flex items-center rounded-full border border-neutral-800/40 " +
  "bg-neutral-900/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] sm:text-xs";

const MetricBadge = ({
  value,
  label,
  colorClassName,
}: {
  value: string;
  label: string;
  colorClassName: string;
}) => (
  <span className={`${pillBase} gap-1.5 py-1`}>
    <span className={`w-1.5 h-1.5 rounded-full ${colorClassName}`} />
    <span className="font-medium">{value}</span>
    <span className="text-neutral-500 hidden xs:inline">{label}</span>
  </span>
);

export default function IdeaCard({
  idea,
  featured,
  showEdit,
  currentUserId,
  onToggleLike,
  loadingLike,
}: IdeaCardProps) {
  const mrrLabel = formatCurrencyShort(idea.monthlyRecurringRevenue as any);
  const usersLabel = formatNumberShort(idea.userCount as any);
  const foundedLabel = idea.foundedYear ? `${idea.foundedYear}` : null;

  const hasMetrics = !!(mrrLabel || usersLabel || foundedLabel);

  const likeCount = idea.likeCount ?? 0;
  const likedByUserIds = idea.likedByUserIds ?? [];
  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onToggleLike) return;
    event.preventDefault();
    event.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  const sector = (idea as any).sector;
  const targetAudience = (idea as any).targetAudience;

  return (
    <div
      className={`group relative rounded-lg sm:rounded-xl border transition-all duration-200 ${
        featured
          ? "border-brand/30 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 sm:p-6 hover:border-brand/50"
          : "border-neutral-800 bg-neutral-950/50 p-4 sm:p-5 hover:border-neutral-600 hover:bg-neutral-900/50"
      }`}
      style={
        featured
          ? {
              boxShadow: "0 20px 25px -5px rgb(var(--brand) / 10%)",
            }
          : undefined
      }
    >
      {/* Featured badge */}
      {featured && (
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand">
            Featured
          </span>
        </div>
      )}

      {/* Edit icon */}
      {showEdit && (
        <Link
          href={`/ideas/${idea.id}/edit`}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center rounded-full bg-neutral-900/90 border border-neutral-700/80 p-1.5 text-neutral-400 hover:text-brand hover:border-brand/60 hover:bg-neutral-900 transition-all z-10"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M4 13.5V16h2.5l7.086-7.086-2.5-2.5L4 13.5z"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 4.5l2.5 2.5"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}

      {/* Main clickable content */}
      <Link href={`/ideas/${idea.id}`} className="block">
        {/* Thumbnail + content layout */}
        <div className="flex gap-3 sm:gap-4">
          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Sector / tag row */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 overflow-x-auto scrollbar-hide">
              {sector && (
                <span
                  className={`${pillBase} font-medium text-neutral-300 whitespace-nowrap`}
                >
                  {sector}
                </span>
              )}
              {targetAudience && (
                <span
                  className={`${pillBase} text-neutral-400 whitespace-nowrap hidden xs:inline-flex sm:inline-flex`}
                >
                  {targetAudience}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-bold mb-1 sm:mb-1.5 group-hover:text-brand transition-colors line-clamp-2 ${
                featured ? "text-lg sm:text-xl" : "text-base sm:text-lg"
              }`}
            >
              {idea.title}
            </h3>

            {/* One-liner */}
            <p className="text-xs sm:text-sm text-neutral-400 mb-2 sm:mb-3 line-clamp-2">
              {idea.oneLiner}
            </p>

            {/* Metrics row */}
            {hasMetrics && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {mrrLabel && (
                  <MetricBadge
                    value={mrrLabel}
                    label="MRR"
                    colorClassName="bg-emerald-500/80"
                  />
                )}
                {usersLabel && (
                  <MetricBadge
                    value={usersLabel}
                    label="users"
                    colorClassName="bg-brand/70"
                  />
                )}
                {foundedLabel && (
                  <span className={`${pillBase} gap-1.5 py-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500/80" />
                    <span className="text-neutral-400">{foundedLabel}</span>
                  </span>
                )}
              </div>
            )}

            {/* Founder info + Like button */}
            {idea.founderUsername && (
              <div className="mt-auto flex items-center gap-2 pt-2 sm:pt-3 border-t border-neutral-800">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-black flex-shrink-0">
                  {idea.founderUsername.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-neutral-500 truncate">
                    by{" "}
                    <span className="text-neutral-300 font-medium">
                      {idea.founderUsername}
                    </span>
                  </p>
                </div>

                {/* Like button */}
                {onToggleLike && (
                  <button
                    type="button"
                    disabled={loadingLike}
                    onClick={handleLikeClick}
                    aria-pressed={isLiked}
                    aria-label={
                      isLiked
                        ? `Unlike idea (${likeCount} likes)`
                        : `Like idea (${likeCount} likes)`
                    }
                    className={`
                      inline-flex items-center gap-1.5 rounded-full
                      px-2.5 py-0.5 text-[11px] sm:text-xs font-medium
                      border transition-all
                      ${
                        isLiked
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          : "bg-neutral-900/70 text-neutral-300 border-neutral-800/40 hover:border-neutral-700"
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                  >
                    {loadingLike ? (
                      <span className="w-3">…</span>
                    ) : (
                      <HeartIcon className="w-3.5 h-3.5" />
                    )}

                    <span className="leading-none">{likeCount}</span>
                  </button>
                )}

                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          {idea.thumbnailUrl && (
            <div className="w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 flex-shrink-0">
              <div className="relative h-full min-h-[90px] sm:min-h-[100px] md:min-h-[120px] overflow-hidden rounded-md sm:rounded-lg border border-neutral-800/50 bg-neutral-900/40">
                <img
                  src={idea.thumbnailUrl}
                  alt={idea.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
