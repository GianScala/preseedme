"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";
import DollarIcon from "@/components/icons/DollarIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Clock, TrendingUp, Users } from "lucide-react";

type Idea = {
  id: string;
  title: string;
  oneLiner?: string;
  founderId?: string | null;
  founderUsername?: string;
  founderAvatarUrl?: string | null;
  thumbnailUrl?: string | null;
  sector?: string;
  isFundraising?: boolean;
  fundraisingGoal?: number | null;
  monthlyRecurringRevenue?: number | null;
  userCount?: number | null;
  likeCount?: number | null;
  likedByUserIds?: string[];
  createdAt?: any;
};

interface IdeaCardProps {
  idea: Idea;
  currentUserId?: string | null;
  onToggleLike: (ideaId: string) => void;
  loadingLikeId: string | null;
}

const avatarCache = new Map<string, string | null>();

// Reusable sub-components
const Avatar = ({ src, fallback, size = 28 }: { src?: string | null; fallback: string; size?: number }) => (
  <div className="rounded-full bg-neutral-800 border border-white/10 overflow-hidden relative shrink-0" style={{ width: size, height: size }}>
    {src ? (
      <Image src={src} alt="" fill className="object-cover" sizes={`${size}px`} />
    ) : (
      <span className="absolute inset-0 flex items-center justify-center text-neutral-600 font-bold" style={{ fontSize: size * 0.4 }}>
        {fallback}
      </span>
    )}
  </div>
);

const Badge = ({ color, children }: { color: "orange" | "emerald"; children: React.ReactNode }) => {
  const styles = color === "orange"
    ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  return <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${styles}`}>{children}</div>;
};

const Metric = ({ icon: Icon, value, label, color }: { icon: typeof Users; value: string; label: string; color: "blue" | "emerald" }) => {
  const styles = color === "blue" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1 rounded border ${styles}`}><Icon className="w-3 h-3" /></div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white leading-none">{value}</span>
        <span className="text-[8px] font-bold text-neutral-600 uppercase">{label}</span>
      </div>
    </div>
  );
};

export default function IdeaCard({ idea, currentUserId, onToggleLike, loadingLikeId }: IdeaCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => avatarCache.get(idea.founderId!) ?? idea.founderAvatarUrl ?? null);

  const isLiked = !!currentUserId && idea.likedByUserIds?.includes(currentUserId);
  const isLoading = loadingLikeId === idea.id;

  const { mrr, users, raise, date } = useMemo(() => ({
    mrr: idea.monthlyRecurringRevenue ? formatCurrencyShort(idea.monthlyRecurringRevenue) : null,
    users: idea.userCount ? formatNumberShort(idea.userCount) : null,
    raise: idea.fundraisingGoal ? formatCurrencyShort(idea.fundraisingGoal) : null,
    date: idea.createdAt
      ? new Date(idea.createdAt.toMillis?.() ?? idea.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null,
  }), [idea.monthlyRecurringRevenue, idea.userCount, idea.fundraisingGoal, idea.createdAt]);

  useEffect(() => {
    if (!idea.founderId || avatarCache.has(idea.founderId)) return;
    let active = true;
    getDoc(doc(getFirebaseDb(), "users", idea.founderId)).then((snap) => {
      if (!active || !snap.exists()) return;
      const url = snap.data().photoURL || snap.data().avatarUrl || null;
      avatarCache.set(idea.founderId!, url);
      setAvatarUrl(url);
    }).catch(console.error);
    return () => { active = false; };
  }, [idea.founderId]);

  return (
    <div className="group flex flex-col h-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-md transition-all hover:border-white/20 hover:bg-neutral-900/80">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={idea.thumbnailUrl} fallback={idea.title?.[0] ?? "?"} size={44} />
          <div className="min-w-0">
            <Link href={`/ideas/${idea.id}`}>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{idea.title}</h3>
            </Link>
            {date && <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase mt-0.5"><Clock className="w-3 h-3" />{date}</div>}
          </div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onToggleLike(idea.id); }}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md transition-all active:scale-95 ${isLiked ? "bg-rose-500 border-rose-500/10 text-rose-500" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`}
        >
          {isLoading ? <div className="w-3.5 h-3.5 animate-spin rounded-full border-t-transparent" /> : 
            <HeartIcon
                  className={`w-3 h-3 md:w-4 md:h-4 ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
            
            }
          <span className="text-xs font-black tabular-nums">{idea.likeCount ?? 0}</span>
        </button>
      </div>

      {/* Badges */}
      {(idea.isFundraising || idea.sector) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.isFundraising && raise && <Badge color="orange"><DollarIcon className="w-2.5 h-2.5" />Raising {raise}</Badge>}
          {idea.sector && <Badge color="emerald">{idea.sector}</Badge>}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed mb-6 flex-1">{idea.oneLiner}</p>

      {/* Metrics */}
      {(users || mrr) && (
        <div className="flex items-center gap-4 mb-6">
          {users && <Metric icon={Users} value={users} label="Users" color="blue" />}
          {mrr && <Metric icon={TrendingUp} value={mrr} label="MRR" color="emerald" />}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <Avatar src={avatarUrl} fallback={idea.founderUsername?.[0] || "?"} />
        <div className="min-w-0">
          <span className="block text-[9px] font-black text-neutral-600 uppercase mb-0.5">Founder</span>
          <span className="block text-xs font-bold text-neutral-200 truncate">@{idea.founderUsername || "unknown"}</span>
        </div>
      </div>
    </div>
  );
}