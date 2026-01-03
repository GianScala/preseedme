"use client";

import { useEffect, useState, useMemo, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, TrendingUp, Users } from "lucide-react";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";
import FeaturedIcon from "@/components/icons/FeaturedIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import DollarIcon from "@/components/icons/DollarIcon";

/* ---------------- Date Helpers ---------------- */
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

/* ---------------- Avatar Cache ---------------- */
const avatarCache = new Map<string, string | null>();

/* ---------------- Micro Components ---------------- */

const TagPill = ({ text }: { text: string }) => (
  <span className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded bg-purple-500/10 border border-purple-500/20">
    {text}
  </span>
);

const MetricItem = ({ icon: Icon, val, label, color }: any) => (
  <div className="flex items-center gap-2">
    <div className={`p-1 md:p-1.5 rounded bg-white/5 border border-white/5 ${color}`}>
      <Icon className="w-3 h-3 md:w-4 md:h-4" />
    </div>
    <div className="flex flex-col">
      <span className="text-xs md:text-sm font-black text-neutral-100 tabular-nums leading-none mb-0.5 md:mb-1">
        {val}
      </span>
      <span className="text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-tighter leading-none">
        {label}
      </span>
    </div>
  </div>
);

const GlassBadge = ({ icon: Icon, label, value, variant = "neutral" }: any) => (
  <div
    className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 h-6 md:h-7 rounded-lg backdrop-blur-md border text-[9px] md:text-[10px] font-bold ${
      variant === "success"
        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
        : "bg-black/40 border-white/10 text-neutral-400"
    }`}
  >
    <Icon className="w-2.5 h-2.5 md:w-3 md:h-3" />
    <span className="uppercase opacity-60 tracking-tighter hidden sm:inline">
      {label}
    </span>
    <span className="tabular-nums">{value}</span>
  </div>
);

/* ---------------- Main Component ---------------- */

export default function FeaturedCard({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
}: any) {
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

  const isLiked =
    !!currentUserId && (likedByUserIds || []).includes(currentUserId);
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
      wasUpdated: !!(updatedMs && createdMs && updatedMs > createdMs),
    };
  }, [createdAt, updatedAt]);

  // Reset avatar error when idea changes
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
          const data = snap.data() as {
            photoURL?: string | null;
            avatarUrl?: string | null;
          };
          const url = data.photoURL || data.avatarUrl || null;
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

  const handleLikeClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike();
  };

  return (
    <Link href={`/ideas/${id}`} className="block">
      <div className="group relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-neutral-900/40 backdrop-blur-2xl transition-all duration-500 hover:border-white/30 shadow-2xl cursor-pointer">
        <div className="flex flex-col md:flex-row md:min-h-[320px]">
          {/* LEFT: IMAGE HERO */}
          <div className="relative w-full md:w-2/5 h-48 md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-4xl md:text-6xl font-black text-neutral-700">
                {title?.[0] || "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/90 via-black/20 to-transparent" />

            {/* Editor's Pick Badge */}
            <div className="absolute top-3 left-3 md:top-5 md:left-5 z-20">
              <span className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-purple-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em]">
                <FeaturedIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                <span className="hidden sm:inline">Editor&apos;s Pick</span>
                <span className="sm:hidden">Featured</span>
              </span>
            </div>

            {/* LIKE OVERLAY (Top Right) */}
            <button
              onClick={handleLikeClick}
              disabled={loadingLike}
              className={`absolute top-3 right-3 md:top-5 md:right-5 z-30 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                isLiked
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-black/60 border-white/10 text-white hover:bg-black/80 hover:border-white/30"
              }`}
            >
              {loadingLike ? (
                <div className="w-3 h-3 md:w-4 md:h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <HeartIcon
                  className={`w-3 h-3 md:w-4 md:h-4 ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
              )}
              <span className="text-xs md:text-sm font-black tabular-nums">
                {rawLikeCount || 0}
              </span>
            </button>

            {/* DATE BADGES */}
            <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 flex gap-2 md:gap-3">
              <GlassBadge
                icon={Clock}
                label="Added"
                value={formatShortDate(dateInfo.createdMs) || "N/A"}
              />
              {dateInfo.wasUpdated && (
                <GlassBadge
                  icon={Clock}
                  label="Updated"
                  value={formatShortDate(dateInfo.updatedMs)}
                  variant="success"
                />
              )}
            </div>
          </div>

          {/* RIGHT: CONTENT */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 justify-center">
            <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-6">
              {sector && <TagPill text={sector} />}
              {targetAudience && (
                <span className="text-[9px] md:text-[10px] font-black text-neutral-600 uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 border border-white/5 rounded">
                  {targetAudience}
                </span>
              )}
              {/* Fundraising Badge - GREEN with Dollar icon & amount */}
              {isFundraising && fundraisingGoalLabel && (
                <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-black text-orange-300 uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded bg-orange-500/10 border border-orange-500/20">
                  <DollarIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>Raising {fundraisingGoalLabel}</span>
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 md:mb-4 tracking-tight leading-tight group-hover:text-purple-400 transition-colors">
                {title}
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-neutral-400 leading-relaxed line-clamp-2 md:line-clamp-3 font-medium opacity-90 max-w-2xl">
                {oneLiner}
              </p>
            </div>

            <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between mt-5 md:mt-10 pt-4 md:pt-8 border-t border-white/10">
              {/* Metrics */}
              <div className="flex items-center gap-4 md:gap-10">
                {mrrLabel && (
                  <MetricItem
                    icon={TrendingUp}
                    val={mrrLabel}
                    label="Monthly Revenue"
                    color="text-emerald-500"
                  />
                )}
                {usersLabel && (
                  <MetricItem
                    icon={Users}
                    val={usersLabel}
                    label="Active Users"
                    color="text-blue-500"
                  />
                )}
              </div>

              {/* Founder Identity */}
              <div className="flex items-center gap-2.5 md:gap-4 md:pl-8 md:border-l border-white/10">
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] md:text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-0.5 md:mb-1">
                    Built By
                  </span>
                  <span className="text-xs md:text-sm font-black text-white">
                    @{founderUsername}
                  </span>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-neutral-800 ring-2 ring-white/10 overflow-hidden flex-shrink-0 relative">
                  {avatarUrl && !avatarError ? (
                    <Image
                      src={avatarUrl}
                      alt={`${founderUsername}'s avatar`}
                      fill
                      sizes="48px"
                      className="object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-base md:text-lg font-black text-neutral-600 bg-neutral-800 uppercase">
                      {founderUsername?.[0] || "?"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
