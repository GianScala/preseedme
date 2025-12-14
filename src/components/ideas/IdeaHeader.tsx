"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Calendar, Clock, ArrowLeft, ExternalLink, PlayCircle } from "lucide-react";

import { ensureProtocol } from "@/lib/utils";
import { getFirebaseDb } from "@/lib/firebase";
import HeartIcon from "@/components/icons/HeartIcon";
import { IdeaMetaChips } from "@/components/ideas/IdeaMetaChips";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";

// --- Types ---
interface AuthUser {
  uid: string;
  [key: string]: any;
}

interface IdeaHeaderProps {
  idea: IdeaWithLikes;
  user: AuthUser | null;
  isOwner: boolean;
  onToggleLike: () => void;
  likeLoading: boolean;
}

// --- Helpers ---
const getMillis = (timestamp: any): number | null => {
  if (!timestamp) return null;
  if (typeof timestamp === "number") return timestamp;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  return null;
};

const formatDate = (ms: number | null) => {
  if (!ms) return "Unknown";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- Custom Hook for Avatar ---
function useFounderAvatar(founderId?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!founderId) return;
    let mounted = true;

    const fetchAvatar = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "users", founderId));
        
        if (mounted && snap.exists()) {
          const data = snap.data();
          const url = data?.photoURL ?? data?.avatarUrl ?? data?.avatar ?? null;
          setAvatarUrl(url);
        }
      } catch (err) {
        console.error("Failed loading founder avatar:", err);
      }
    };

    fetchAvatar();
    return () => { mounted = false; };
  }, [founderId]);

  return { avatarUrl, error, setError };
}

// --- Sub-Components ---

// 1. Reusable Glass Badge for perfect alignment
const GlassBadge = ({ 
  icon: Icon, 
  label, 
  value, 
  variant = "neutral",
  className = "" 
}: { 
  icon: any, 
  label?: string, 
  value: string | number, 
  variant?: "neutral" | "success" | "brand",
  className?: string
}) => {
  const styles = {
    neutral: "bg-black/60 border-white/10 text-neutral-300",
    success: "bg-black/60 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]",
    brand: "bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/20",
  };

  return (
    <div className={`
      flex items-center gap-2 px-3 h-8 rounded-full 
      backdrop-blur-md border text-xs font-medium shadow-sm 
      transition-all select-none
      ${styles[variant]} 
      ${className}
    `}>
      <Icon className={`w-3.5 h-3.5 ${variant === 'success' ? 'text-emerald-400' : ''}`} />
      {label && <span className="hidden xs:inline opacity-70 uppercase tracking-wider text-[10px]">{label}</span>}
      <span className="tabular-nums">{value}</span>
    </div>
  );
};

// 2. Back Button
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800"
  >
    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
    <span>Back</span>
  </button>
);

// --- Main Component ---

export default function IdeaHeader({
  idea,
  user,
  onToggleLike,
  likeLoading,
}: IdeaHeaderProps) {
  const router = useRouter();
  
  // Data processing
  const { founderId, founderUsername } = idea;
  const isLiked = user ? (idea.likedByUserIds ?? []).includes(user.uid) : false;
  const likeCount = idea.likeCount ?? 0;
  
  // Avatar Logic
  const { avatarUrl, error: avatarError, setError: setAvatarError } = useFounderAvatar(founderId);
  const founderInitial = founderUsername?.[0]?.toUpperCase() ?? "?";
  const shouldShowInitials = !avatarUrl || avatarError;

  // Date Logic
  const dateInfo = useMemo(() => {
    const createdMs = getMillis(idea.createdAt);
    const updatedMs = getMillis(idea.updatedAt);
    const wasUpdated = updatedMs && createdMs && updatedMs > createdMs;
    // Check if updated in last 48 hours
    const isRecentUpdate = wasUpdated && updatedMs && (Date.now() - updatedMs) < 48 * 60 * 60 * 1000;

    return { createdMs, updatedMs, wasUpdated, isRecentUpdate };
  }, [idea.createdAt, idea.updatedAt]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (likeLoading) return;
    if (!user) return router.push("/auth");
    onToggleLike();
  };

  return (
    <div className="space-y-6">
      {/* Top Nav (Desktop) */}
      <div className="hidden sm:flex justify-between items-center">
        <div className="flex gap-2">
           {/* Optional: Breadcrumbs could go here */}
        </div>
        <BackButton onClick={() => router.back()} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        {/* Left Column: Text Content */}
        <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            {/* Mobile Header */}
            <div className="flex items-start justify-between gap-2 sm:hidden">
              <h1 className="flex-1 text-3xl font-bold text-white leading-tight">
                {idea.title}
              </h1>
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/70 text-neutral-300 hover:text-white w-8 h-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Title */}
            <h1 className="hidden sm:block text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              {idea.title}
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              {idea.oneLiner}
            </p>

            <IdeaMetaChips idea={idea} />
          </div>

          {/* Founder Profile */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/5 mt-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 ring-1 ring-white/10 flex items-center justify-center text-lg sm:text-xl font-bold text-white overflow-hidden shrink-0 mt-4">
              {shouldShowInitials ? (
                founderInitial
              ) : (
                <img
                  src={avatarUrl as string}
                  alt={founderUsername}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col mt-4">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                Created By
              </span>
              <Link
                href={`/profile/${idea.founderId}`}
                className="group inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-white hover:text-brand transition-colors"
              >
                {idea.founderUsername}
                {idea.founderHandle && (
                  <span className="text-neutral-500 group-hover:text-brand/70 transition-colors">@{idea.founderHandle}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Card */}
        {idea.thumbnailUrl && (
          <div className="lg:col-span-1 space-y-4">
            
            {/* Action Links (Website/Demo) */}
            {(idea.websiteUrl || idea.demoVideoUrl) && (
              <div className="flex flex-wrap justify-end gap-2">
                {idea.websiteUrl && (
                  <a 
                    href={ensureProtocol(idea.websiteUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {idea.demoVideoUrl && (
                  <a 
                    href={ensureProtocol(idea.demoVideoUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Watch Demo
                  </a>
                )}
              </div>
            )}

            {/* Main Thumbnail Card */}
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800 aspect-video">
              
              {/* Image */}
              <img
                src={idea.thumbnailUrl}
                alt={idea.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Overlay Gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* --- TOP RIGHT: Like Button --- */}
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                  className={`
                    flex items-center gap-2 px-3 h-8 rounded-full 
                    backdrop-blur-md border text-xs font-medium shadow-lg 
                    transition-all active:scale-95
                    disabled:opacity-70 disabled:cursor-not-allowed
                    ${isLiked 
                      ? "bg-rose-500/90 border-rose-400 text-white hover:bg-rose-600" 
                      : "bg-black/60 border-white/10 text-white hover:bg-black/80"
                    }
                  `}
                >
                  <HeartIcon className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                  <span className="tabular-nums">{likeCount}</span>
                </button>
              </div>

              {/* --- BOTTOM ROW: Metadata --- */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end gap-2">
                
                {/* Left Side: Creation Date */}
                <GlassBadge 
                  icon={Calendar} 
                  value={formatDate(dateInfo.createdMs)} 
                  variant="neutral"
                />

                {/* Right Side: Update Badge (Only if updated) */}
                {dateInfo.wasUpdated && (
                  <div className="flex items-center gap-2">
                     {/* Pulse effect if very recent */}
                    {dateInfo.isRecentUpdate && (
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                       </span>
                    )}
                    <GlassBadge 
                      icon={Clock} 
                      label="Updated"
                      value={formatDate(dateInfo.updatedMs)} 
                      variant="success"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}