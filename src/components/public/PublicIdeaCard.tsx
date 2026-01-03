"use client";

import { useEffect, useState, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Clock, TrendingUp, Users, type LucideIcon } from "lucide-react";
import DollarIcon from "@/components/icons/DollarIcon";

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

interface PublicIdeaCardProps {
  idea: Idea;
  currentUserId?: string | null;
  onToggleLike: () => void;
  loadingLike: boolean;
  rank?: number; // Made optional
  showRank?: boolean; // New prop to control rank visibility
}

const avatarCache = new Map<string, string | null>();

// --- Date Helpers ---
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

const getRankStyles = (rank: number): string => {
  if (rank === 1) return "bg-yellow-500 text-yellow-950 ring-yellow-400/50 shadow-yellow-500/20";
  if (rank === 2) return "bg-zinc-300 text-zinc-900 ring-zinc-200/50 shadow-zinc-300/10";
  if (rank === 3) return "bg-amber-700 text-amber-50 ring-amber-600/50 shadow-amber-900/20";
  return "bg-neutral-800 text-neutral-400 ring-white/5";
};

// --- Glass Badge for Dates ---
function GlassBadge({ 
  icon: Icon, 
  value, 
  variant = "neutral" 
}: { 
  icon: LucideIcon; 
  value: string; 
  variant?: "neutral" | "success";
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 h-6 rounded-md backdrop-blur-md border text-[10px] font-bold ${
      variant === "success" 
        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
        : "bg-black/40 border-white/10 text-neutral-400"
    }`}>
      <Icon className="w-3 h-3" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function PublicIdeaCard({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
  rank,
  showRank = false, // Default to hiding rank
}: PublicIdeaCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => 
    idea.founderId ? avatarCache.get(idea.founderId) ?? idea.founderAvatarUrl ?? null : null
  );
  const [avatarError, setAvatarError] = useState(false);

  const isLiked = !!currentUserId && (idea.likedByUserIds ?? []).includes(currentUserId);
  const mrrLabel = idea.monthlyRecurringRevenue ? formatCurrencyShort(idea.monthlyRecurringRevenue) : null;
  const usersLabel = idea.userCount ? formatNumberShort(idea.userCount) : null;
  const fundraisingGoalLabel = idea.fundraisingGoal ? formatCurrencyShort(idea.fundraisingGoal) : null;

  // Calculate date info
  const dateInfo = useMemo(() => {
    const createdMs = getMillis(idea.createdAt);
    const updatedMs = getMillis(idea.updatedAt);
    const wasUpdated = updatedMs && createdMs && updatedMs > createdMs + 60000; // 1 min threshold
    return { createdMs, updatedMs, wasUpdated };
  }, [idea.createdAt, idea.updatedAt]);

  useEffect(() => {
    if (!idea.founderId || avatarCache.has(idea.founderId)) return;
    let isMounted = true;
    const loadAvatar = async () => {
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "users", idea.founderId!));
        if (isMounted && snap.exists()) {
          const url = snap.data().photoURL || snap.data().avatarUrl || null;
          avatarCache.set(idea.founderId!, url);
          setAvatarUrl(url);
        }
      } catch (e) { console.error(e); }
    };
    loadAvatar();
    return () => { isMounted = false; };
  }, [idea.founderId]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-neutral-900/80 shadow-2xl">
      <div className="flex flex-col md:flex-row min-h-[160px]">
        
        {/* LEFT: IMAGE & RANK */}
        <div className="relative w-full md:w-52 h-44 md:h-auto flex-shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {idea.thumbnailUrl ? (
            <Image src={idea.thumbnailUrl} alt={idea.title} fill className="object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700" sizes="208px" />
          ) : (
            <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-3xl font-black text-neutral-700 uppercase">{idea.title?.[0]}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Rank Badge - Top Left (Only if showRank is true) */}
          {showRank && rank !== undefined && (
            <div className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ring-1 ${getRankStyles(rank)}`}>
              {rank}
            </div>
          )}

          {/* Like Button - Top Right */}
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLike(); }} disabled={loadingLike}
            className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all ${isLiked ? "bg-rose-500/80 border-rose-400 text-white" : "bg-black/40 border-white/10 text-white hover:bg-black/60"}`}>
            {loadingLike ? <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <HeartIcon className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />}
            <span className="text-xs font-black tabular-nums">{idea.likeCount ?? 0}</span>
          </button>

          {/* Date Badges - Bottom Left */}
          <div className="absolute bottom-3 left-3 z-20 flex gap-2">
            {dateInfo.createdMs && (
              <GlassBadge icon={Clock} value={formatShortDate(dateInfo.createdMs) || "N/A"} />
            )}
            {dateInfo.wasUpdated && dateInfo.updatedMs && (
              <GlassBadge icon={Clock} value={formatShortDate(dateInfo.updatedMs)!} variant="success" />
            )}
          </div>
        </div>

        {/* CENTER: CONTENT */}
        <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {idea.sector && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{idea.sector}</span>}
            {idea.isFundraising && fundraisingGoalLabel && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-300 uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                <DollarIcon className="w-3 h-3" /> Raising {fundraisingGoalLabel}
              </span>
            )}
          </div>
          <Link href={`/ideas/${idea.id}`} className="block">
            <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors truncate">{idea.title}</h3>
            <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed font-medium opacity-80">{idea.oneLiner}</p>
          </Link>
        </div>

        {/* RIGHT: FOUNDER & METRICS */}
        <div className="w-full md:w-56 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-white/5 p-6 bg-white/[0.01]">
          <div className="flex items-center gap-3 md:w-full md:pb-4 md:mb-2 md:border-b md:border-white/5">
            <div className="h-9 w-9 rounded-full bg-neutral-800 ring-2 ring-white/5 overflow-hidden relative shrink-0">
              {avatarUrl && !avatarError ? <Image src={avatarUrl} alt="Founder" fill className="object-cover" onError={() => setAvatarError(true)} /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-neutral-500">{idea.founderUsername?.[0] || "?"}</div>}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">Founder</span>
              <span className="text-xs font-bold text-neutral-200 truncate">@{idea.founderUsername || "unknown"}</span>
            </div>
          </div>

          {/* Conditional Metrics Container */}
          {(usersLabel || mrrLabel) && (
            <div className="flex items-center md:flex-col gap-4 md:gap-3 md:w-full">
              {usersLabel && <MetricItem icon={Users} value={usersLabel} label="Users" color="text-blue-500" />}
              {mrrLabel && <MetricItem icon={TrendingUp} value={mrrLabel} label="MRR" color="text-emerald-500" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricItem({ icon: Icon, value, label, color }: { icon: LucideIcon, value: string, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2.5 md:w-full">
      <div className={`p-1 rounded bg-white/5 border border-white/5 ${color}`}><Icon className="w-3 h-3" /></div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-neutral-200 tabular-nums leading-none mb-0.5">{value}</span>
        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter leading-none">{label}</span>
      </div>
    </div>
  );
}