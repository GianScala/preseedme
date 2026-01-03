"use client";

import { useEffect, useState, useMemo, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, TrendingUp, Users } from "lucide-react";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import { IdeaWithLikes } from "@/lib/ideas";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import DollarIcon from "@/components/icons/DollarIcon";

/* ---------------- Avatar Cache ---------------- */
const avatarCache = new Map<string, string | null>();

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

// --- Helpers ---
const getMillis = (timestamp: any): number | null => {
  if (!timestamp) return null;
  if (typeof timestamp === "number") return timestamp;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  return null;
};

const formatShortDate = (ms: number | null) => {
  if (!ms) return null;
  const date = new Date(ms);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/* ---------------- Micro Components ---------------- */

const TagPill = ({ text }: { text: string }) => (
  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-2 py-0.5 border border-white/5 rounded bg-white/[0.02]">
    {text}
  </span>
);

const MetricItem = ({ icon: Icon, val, label, color }: any) => (
  <div className="flex items-center gap-1.5">
    <Icon className={`w-3 h-3 ${color}`} />
    <span className="text-[11px] font-black text-neutral-200 tabular-nums">
      {val}
    </span>
    <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

const GlassBadge = ({ icon: Icon, value, variant = "neutral" }: any) => (
  <div
    className={`flex items-center gap-1.5 px-2 h-6 rounded-md backdrop-blur-md border text-[10px] font-bold ${
      variant === "success"
        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
        : "bg-black/40 border-white/10 text-neutral-400"
    }`}
  >
    <Icon className="w-3 h-3" />
    <span className="tabular-nums">{value}</span>
  </div>
);

/* ---------------- Main Component ---------------- */

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
    likeCount: rawLikeCount,
    likedByUserIds = [],
    founderUsername,
    sector,
    targetAudience,
    founderId,
    createdAt,
    updatedAt,
    // Fundraising fields
    isFundraising,
    fundraisingGoal,
  } = idea;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return founderId ? avatarCache.get(founderId) ?? null : null;
  });
  const [avatarError, setAvatarError] = useState(false);

  const isLiked = !!currentUserId && likedByUserIds.includes(currentUserId);
  const mrrLabel = monthlyRecurringRevenue
    ? formatCurrencyShort(monthlyRecurringRevenue)
    : null;
  const usersLabel = userCount ? formatNumberShort(userCount) : null;

  // Fundraising
  const fundraisingGoalLabel = fundraisingGoal
    ? formatCurrencyShort(fundraisingGoal)
    : null;

  const dateInfo = useMemo(() => {
    const createdMs = getMillis(createdAt);
    const updatedMs = getMillis(updatedAt);
    return {
      createdMs,
      updatedMs,
      wasUpdated: !!updatedMs && !!createdMs && updatedMs > createdMs,
    };
  }, [createdAt, updatedAt]);

  // Reset on idea change
  useEffect(() => {
    setAvatarError(false);
    if (founderId && avatarCache.has(founderId)) {
      setAvatarUrl(avatarCache.get(founderId) ?? null);
    } else {
      setAvatarUrl(null);
    }
  }, [id, founderId]);

  // Fetch avatar with caching
  useEffect(() => {
    if (!founderId) return;

    if (avatarCache.has(founderId)) {
      setAvatarUrl(avatarCache.get(founderId) ?? null);
      return;
    }

    let isMounted = true;

    const loadAvatar = async () => {
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "users", founderId));
        if (!isMounted) return;

        if (snap.exists()) {
          const url = snap.data().photoURL || snap.data().avatarUrl || null;
          avatarCache.set(founderId, url);
          setAvatarUrl(url);
        } else {
          avatarCache.set(founderId, null);
        }
      } catch (e) {
        console.error("Error loading avatar:", e);
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [founderId]);

  const handleLikeClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loadingLike) onToggleLike();
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/20 hover:bg-neutral-900/40 hover:border-white/20 transition-all duration-300 w-full h-[400px]">
      <Link href={`/ideas/${id}`} className="flex flex-col h-full">
        {/* IMAGE HEADER WITH OVERLAYS */}
        <div className="relative h-44 w-full overflow-hidden border-b border-white/5">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center text-3xl font-black text-neutral-700">
              {title?.[0] || "?"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Top Right: LIKE BUTTON */}
          <button
            onClick={handleLikeClick}
            disabled={loadingLike}
            className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              isLiked
                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40"
                : "bg-black/40 border-white/10 text-white hover:bg-black/60 hover:border-white/30"
            }`}
          >
            {loadingLike ? (
              <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <HeartIcon
                className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`}
              />
            )}
            <span className="text-xs font-black tabular-nums">
              {rawLikeCount || 0}
            </span>
          </button>

          {/* Bottom Left: DATE BADGES */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <GlassBadge
              icon={Clock}
              value={formatShortDate(dateInfo.createdMs) || "N/A"}
            />
            {dateInfo.wasUpdated && (
              <GlassBadge
                icon={Clock}
                value={formatShortDate(dateInfo.updatedMs)}
                variant="success"
              />
            )}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="flex-1 flex flex-col p-5 gap-3 bg-black/10 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {sector && <TagPill text={sector} />}
            {targetAudience && <TagPill text={targetAudience} />}

            {/* Fundraising Badge - GREEN with DollarIcon + amount */}
            {isFundraising && fundraisingGoalLabel && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <DollarIcon className="w-3 h-3" />
                <span>Raising {fundraisingGoalLabel}</span>
              </span>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-2 group-hover:text-[var(--brand)] transition-colors tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3 font-medium opacity-80">
              {oneLiner}
            </p>
          </div>

          {/* FOOTER: Metrics Left, Founder Right */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            {/* Metrics */}
            <div className="flex flex-col gap-1.5">
              {mrrLabel && (
                <MetricItem
                  icon={TrendingUp}
                  val={mrrLabel}
                  label="MRR"
                  color="text-emerald-500"
                />
              )}
              {usersLabel && (
                <MetricItem
                  icon={Users}
                  val={usersLabel}
                  label="Users"
                  color="text-blue-500"
                />
              )}
            </div>

            {/* Founder Identity (Right Side) */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-white/5">
              <div className="flex flex-col items-end min-w-0">
                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">
                  Founder
                </span>
                <span className="text-xs font-bold text-neutral-200 truncate max-w-[80px]">
                  @{founderUsername}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-neutral-800 ring-2 ring-white/5 overflow-hidden flex-shrink-0 relative">
                {avatarUrl && !avatarError ? (
                  <Image
                    src={avatarUrl}
                    alt={`${founderUsername}'s avatar`}
                    fill
                    sizes="32px"
                    className="object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-neutral-500 uppercase bg-neutral-800">
                    {founderUsername?.[0] || "?"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
