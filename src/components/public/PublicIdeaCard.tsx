"use client";
import {
  useEffect,
  useState,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Clock, TrendingUp, Users, type LucideIcon } from "lucide-react";
import DollarIcon from "../icons/DollarIcon";

/* ---------------- Types ---------------- */
type Idea = {
  id: string;
  title: string;
  oneLiner?: string;
  founderId?: string | null;
  founderUsername?: string;
  founderAvatarUrl?: string | null;
  thumbnailUrl?: string | null;
  sector?: string;
  targetAudience?: string;
  isFundraising?: boolean;
  fundraisingGoal?: number | null;
  monthlyRecurringRevenue?: number | null;
  userCount?: number | null;
  likeCount?: number | null;
  likedByUserIds?: string[];
  createdAt?: string | Date | number | { toMillis: () => number } | null;
  updatedAt?: string | Date | number | { toMillis: () => number } | null;
};

interface PublicWeeklyWinnerProps {
  idea: Idea;
  currentUserId?: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
  rank: number; // kept for compatibility (list ordering / image priority), but NOT displayed
}

interface MetricProps {
  icon: LucideIcon;
  value: string;
  label: string;
  colorClassName: string;
}

/* ---------------- Avatar Cache ---------------- */
const avatarCache = new Map<string, string | null>();

/* ---------------- Date Helpers ---------------- */
const getMillis = (timestamp: any): number | null => {
  if (!timestamp) return null;
  if (typeof timestamp === "number") return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp === "string") return new Date(timestamp).getTime();
  return null;
};

const formatShortDate = (ms: number | null): string | null => {
  if (!ms) return null;
  const date = new Date(ms);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/* ---------------- Glass Badge for Dates ---------------- */
function GlassBadge({
  icon: Icon,
  value,
  variant = "neutral",
}: {
  icon: LucideIcon;
  value: string;
  variant?: "neutral" | "success";
}) {
  return (
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
}

/* ---------------- Component ---------------- */
export default function PublicWeeklyWinner({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
  rank: _rank, // rank removed from UI
}: PublicWeeklyWinnerProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (idea.founderId && avatarCache.has(idea.founderId)) {
      return avatarCache.get(idea.founderId) ?? null;
    }
    return idea.founderAvatarUrl ?? null;
  });

  const [avatarError, setAvatarError] = useState(false);

  const isLiked =
    !!currentUserId && (idea.likedByUserIds ?? []).includes(currentUserId);

  const mrrLabel = idea.monthlyRecurringRevenue
    ? formatCurrencyShort(idea.monthlyRecurringRevenue)
    : null;
  const usersLabel = idea.userCount ? formatNumberShort(idea.userCount) : null;
  const fundraisingGoalLabel = idea.fundraisingGoal
    ? formatCurrencyShort(idea.fundraisingGoal)
    : null;

  const dateInfo = useMemo(() => {
    const createdMs = getMillis(idea.createdAt);
    const updatedMs = getMillis(idea.updatedAt);
    const wasUpdated = updatedMs && createdMs && updatedMs > createdMs + 60000;
    return { createdMs, updatedMs, wasUpdated };
  }, [idea.createdAt, idea.updatedAt]);

  /* ---- Sync avatar state on idea changes ---- */
  useEffect(() => {
    setAvatarError(false);
    if (idea.founderId && avatarCache.has(idea.founderId)) {
      setAvatarUrl(avatarCache.get(idea.founderId) ?? null);
      return;
    }
    setAvatarUrl(idea.founderAvatarUrl ?? null);
  }, [idea.id, idea.founderId, idea.founderAvatarUrl]);

  /* ---- Load avatar from Firestore if needed ---- */
  useEffect(() => {
    if (!idea.founderId) return;
    if (avatarCache.has(idea.founderId)) {
      setAvatarUrl(avatarCache.get(idea.founderId) ?? null);
      return;
    }

    let isMounted = true;
    const loadAvatar = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "users", idea.founderId!));
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as {
            photoURL?: string | null;
            avatarUrl?: string | null;
          };
          const url = data.photoURL || data.avatarUrl || null;
          avatarCache.set(idea.founderId!, url);
          setAvatarUrl(url);
        } else {
          avatarCache.set(idea.founderId!, null);
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    };
    loadAvatar();
    return () => {
      isMounted = false;
    };
  }, [idea.founderId]);

  const handleLikeClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike();
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/10 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-neutral-900/40 shadow-2xl">
      <div className="flex flex-col md:flex-row min-h-[160px]">
        {/* LEFT: IMAGE SECTION */}
        <div className="relative w-full md:w-52 h-40 md:h-auto flex-shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {idea.thumbnailUrl ? (
            <Image
              src={idea.thumbnailUrl}
              alt={idea.title}
              fill
              priority={_rank <= 2}
              sizes="(max-width: 768px) 100vw, 208px"
              className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-90"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center text-3xl font-black text-neutral-700 uppercase">
              {idea.title?.[0] ?? "?"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* ✅ Rank badge removed */}

          {/* Like Button - Top Right */}
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={loadingLike}
            className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              isLiked
                ? "bg-rose-500/80 border-rose-400 text-white shadow-lg shadow-rose-500/40"
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
              {idea.likeCount ?? 0}
            </span>
          </button>

          {/* Bottom Left: Date + Metrics (only on mobile) */}
          <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 md:hidden">
            {dateInfo.createdMs && (
              <GlassBadge
                icon={Clock}
                value={formatShortDate(dateInfo.createdMs) || "N/A"}
              />
            )}
            {dateInfo.wasUpdated && dateInfo.updatedMs && (
              <GlassBadge
                icon={Clock}
                value={formatShortDate(dateInfo.updatedMs)!}
                variant="success"
              />
            )}
            {usersLabel && (
              <Metric
                icon={Users}
                value={usersLabel}
                label="USERS"
                colorClassName="text-blue-500"
              />
            )}
            {mrrLabel && (
              <Metric
                icon={TrendingUp}
                value={mrrLabel}
                label="MRR"
                colorClassName="text-emerald-500"
              />
            )}
          </div>

          {/* Desktop-only Date Badges */}
          <div className="absolute bottom-3 left-3 z-20 hidden md:flex gap-2">
            {dateInfo.createdMs && (
              <GlassBadge
                icon={Clock}
                value={formatShortDate(dateInfo.createdMs) || "N/A"}
              />
            )}
            {dateInfo.wasUpdated && dateInfo.updatedMs && (
              <GlassBadge
                icon={Clock}
                value={formatShortDate(dateInfo.updatedMs)!}
                variant="success"
              />
            )}
          </div>
        </div>

        {/* CENTER: Pitch & Tags */}
        <div className="flex-1 flex flex-col justify-center p-5 md:p-6 min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {idea.sector && (
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {idea.sector}
              </span>
            )}
            {idea.targetAudience && (
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-2 py-0.5 border border-white/5 rounded">
                {idea.targetAudience}
              </span>
            )}
            {idea.isFundraising && fundraisingGoalLabel && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-300 uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                <DollarIcon className="w-3 h-3" />
                <span>Raising {fundraisingGoalLabel}</span>
              </span>
            )}
          </div>
          <Link href={`/ideas/${idea.id}`} className="group/link block">
            <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-1 group-hover/link:text-emerald-400 transition-colors">
              {idea.title}
            </h3>
            {idea.oneLiner && (
              <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2 font-medium opacity-80">
                {idea.oneLiner}
              </p>
            )}
          </Link>
        </div>

        {/* RIGHT: Founder + Metrics (desktop only) */}
        <div className="hidden md:flex w-full md:w-56 flex-col justify-center gap-6 border-t md:border-t-0 md:border-l border-white/5 p-5 md:px-6 bg-white/[0.01]">
          {/* Founder */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-neutral-800 ring-2 ring-white/5 overflow-hidden flex-shrink-0 relative">
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={`${idea.founderUsername ?? "Founder"}'s avatar`}
                  fill
                  sizes="36px"
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-neutral-500 bg-neutral-800 uppercase">
                  {idea.founderUsername?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter">
                Founder
              </span>
              <span className="text-xs font-bold text-neutral-200 truncate">
                @{idea.founderUsername ?? "unknown"}
              </span>
            </div>
          </div>

          {/* Desktop Metrics */}
          {(usersLabel || mrrLabel) && (
            <div className="flex flex-col gap-3">
              {usersLabel && (
                <Metric
                  icon={Users}
                  value={usersLabel}
                  label="USERS"
                  colorClassName="text-blue-500"
                />
              )}
              {mrrLabel && (
                <Metric
                  icon={TrendingUp}
                  value={mrrLabel}
                  label="MRR"
                  colorClassName="text-emerald-500"
                />
              )}
            </div>
          )}
        </div>

        {/* Mobile-only Founder (below content) */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-neutral-800 ring-2 ring-white/5 overflow-hidden flex-shrink-0 relative">
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={`${idea.founderUsername ?? "Founder"}'s avatar`}
                  fill
                  sizes="36px"
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-neutral-500 bg-neutral-800 uppercase">
                  {idea.founderUsername?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter">
                Founder
              </span>
              <span className="text-xs font-bold text-neutral-200">
                @{idea.founderUsername ?? "unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Metric Component ---------------- */
const Metric = ({ icon: Icon, value, label, colorClassName }: MetricProps) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`p-1 rounded bg-white/5 border border-white/5 ${colorClassName}`}
    >
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-neutral-200 tabular-nums leading-none mb-0.5">
        {value}
      </span>
      <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter leading-none">
        {label}
      </span>
    </div>
  </div>
);
