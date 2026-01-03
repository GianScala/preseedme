"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";
import HeartIcon from "@/components/icons/HeartIcon";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { TrendingUp, Users } from "lucide-react";

/* ---------------- Avatar Cache ---------------- */
const avatarCache = new Map<string, string | null>();

/* ---------------- Professional Rank Styling ---------------- */
const getRankStyles = (rank: number) => {
  const styles: Record<number, string> = {
    1: "bg-yellow-500 text-yellow-950 ring-yellow-400/50 shadow-yellow-500/20",
    2: "bg-zinc-300 text-zinc-900 ring-zinc-200/50 shadow-zinc-300/10",
    3: "bg-amber-700 text-amber-50 ring-amber-600/50 shadow-amber-900/20",
  };
  return styles[rank] || "bg-neutral-800 text-neutral-400 ring-white/5";
};

/* ---------------- X-Style Progress Blocks ---------------- */
const ProgressBlocks = ({ percentage }: { percentage: number }) => {
  const totalBlocks = 10;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-[2px] ${
            i < filledBlocks ? "bg-emerald-500" : "bg-neutral-700"
          }`}
        />
      ))}
    </div>
  );
};

export default function PublicWeeklyWinner({
  idea,
  currentUserId,
  onToggleLike,
  loadingLike,
  rank,
}: any) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (idea.founderId && avatarCache.has(idea.founderId)) {
      return avatarCache.get(idea.founderId) ?? null;
    }
    return idea.founderAvatarUrl ?? null;
  });
  const [avatarError, setAvatarError] = useState(false);

  const isLiked = !!currentUserId && (idea.likedByUserIds || []).includes(currentUserId);
  const mrrLabel = idea.monthlyRecurringRevenue ? formatCurrencyShort(idea.monthlyRecurringRevenue) : null;
  const usersLabel = idea.userCount ? formatNumberShort(idea.userCount) : null;
  
  // Fundraising calculations
  const fundraisingGoal = idea.fundraisingGoal || 0;
  const fundraisingRaised = idea.fundraisingRaisedSoFar || 0;
  const fundraisingGoalLabel = fundraisingGoal ? formatCurrencyShort(fundraisingGoal) : null;
  const fundraisingRaisedLabel = fundraisingRaised ? formatCurrencyShort(fundraisingRaised) : "$0";
  const fundraisingPercentage = fundraisingGoal > 0 
    ? Math.min(Math.round((fundraisingRaised / fundraisingGoal) * 100), 100) 
    : 0;

  useEffect(() => {
    setAvatarError(false);
    if (idea.founderId && avatarCache.has(idea.founderId)) {
      setAvatarUrl(avatarCache.get(idea.founderId) ?? null);
    } else {
      setAvatarUrl(idea.founderAvatarUrl ?? null);
    }
  }, [idea.id, idea.founderId, idea.founderAvatarUrl]);

  useEffect(() => {
    if (!idea.founderId) return;
    
    if (avatarCache.has(idea.founderId)) {
      setAvatarUrl(avatarCache.get(idea.founderId) ?? null);
      return;
    }

    let isMounted = true;

    const loadAvatar = async () => {
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "users", idea.founderId));
        if (!isMounted) return;
        
        if (snap.exists()) {
          const url = snap.data().photoURL || snap.data().avatarUrl || null;
          avatarCache.set(idea.founderId, url);
          setAvatarUrl(url);
        } else {
          avatarCache.set(idea.founderId, null);
        }
      } catch (e) { 
        console.error("Error loading avatar:", e); 
      }
    };
    
    loadAvatar();
    
    return () => { isMounted = false; };
  }, [idea.founderId]);

  const handleLikeClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike();
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-neutral-900/80 shadow-2xl">
      <div className="flex flex-col md:flex-row min-h-[160px]">
        
        {/* LEFT: IMAGE SECTION (Overlayed with Rank & Like) */}
        <div className="relative w-full md:w-52 h-40 md:h-auto flex-shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {idea.thumbnailUrl ? (
            <Image 
              src={idea.thumbnailUrl} 
              alt={idea.title}
              fill
              priority={rank <= 2}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 208px"
              className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-90"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center text-3xl font-black text-neutral-700">
              {idea.title?.[0] || "?"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Rank Badge - Top Left */}
          <div className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ring-1 ${getRankStyles(rank)}`}>
            #{rank}
          </div>

          {/* LIKE BUTTON - Top Right Overlay */}
          <button
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
              <HeartIcon className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
            )}
            <span className="text-xs font-black tabular-nums">{idea.likeCount || 0}</span>
          </button>
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
            {/* Fundraising Badge - GREEN with amount */}
            {idea.isFundraising && fundraisingGoalLabel && (
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                🚀 Raising {fundraisingGoalLabel}
              </span>
            )}
          </div>

          <Link href={`/ideas/${idea.id}`} className="group/link block">
            <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-1 group-hover/link:text-emerald-400 transition-colors">
              {idea.title}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2 font-medium opacity-80">
              {idea.oneLiner}
            </p>
          </Link>
        </div>

        {/* RIGHT: Founder & Metrics */}
        <div className="w-full md:w-56 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-white/5 p-5 md:px-6 bg-white/[0.01]">
          
          {/* Founder Profile */}
          <div className="flex items-center gap-3 md:w-full md:pb-4 md:mb-4 md:border-b md:border-white/5">
            <div className="h-9 w-9 rounded-full bg-neutral-800 ring-2 ring-white/5 overflow-hidden flex-shrink-0 relative">
              {avatarUrl && !avatarError ? (
                <Image 
                  src={avatarUrl} 
                  alt={`${idea.founderUsername}'s avatar`}
                  fill
                  sizes="36px"
                  className="object-cover" 
                  onError={() => setAvatarError(true)} 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-neutral-500 bg-neutral-800 uppercase">
                  {idea.founderUsername?.[0] || "?"}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter">Founder</span>
              <span className="text-xs font-bold text-neutral-200 truncate">@{idea.founderUsername}</span>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="flex items-center md:flex-col gap-4 md:gap-3 md:w-full">
            {usersLabel && <Metric icon={Users} val={usersLabel} label="Users" color="text-blue-500" />}
            {mrrLabel && <Metric icon={TrendingUp} val={mrrLabel} label="MRR" color="text-emerald-500" />}
            
            {/* Fundraising Progress - X Style Blocks */}
            {idea.isFundraising && fundraisingGoalLabel && (
              <div className="md:w-full md:pt-3 md:mt-1 md:border-t md:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-500">Raised:</span>
                  <span className="text-[10px] font-black text-emerald-400 tabular-nums">{fundraisingRaisedLabel}</span>
                  <ProgressBlocks percentage={fundraisingPercentage} />
                  <span className="text-[10px] font-black text-emerald-400 tabular-nums">({fundraisingPercentage}%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, val, label, color }: any) => (
  <div className="flex items-center gap-2.5 md:w-full">
    <div className={`p-1 rounded bg-white/5 border border-white/5 ${color}`}>
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-neutral-200 tabular-nums leading-none mb-0.5">{val}</span>
      <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter leading-none">{label}</span>
    </div>
  </div>
);