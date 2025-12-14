// src/components/ideas/IdeaTimestamps.tsx
"use client";

import { Calendar, Clock } from "lucide-react";

interface IdeaTimestampsProps {
  createdAt: number | any;
  updatedAt?: number | any;
  compact?: boolean;
}

export default function IdeaTimestamps({ createdAt, updatedAt, compact = false }: IdeaTimestampsProps) {
  const formatDate = (timestamp: number | any) => {
    const ms = timestamp?.toMillis ? timestamp.toMillis() : timestamp;
    if (!ms) return "Unknown";
    
    const date = new Date(ms);
    if (compact) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: number | any) => {
    const ms = timestamp?.toMillis ? timestamp.toMillis() : timestamp;
    if (!ms) return "recently";
    
    const now = Date.now();
    const diff = now - ms;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  };

  const createdMs = createdAt?.toMillis ? createdAt.toMillis() : createdAt;
  const updatedMs = updatedAt?.toMillis ? updatedAt.toMillis() : updatedAt;
  const wasUpdated = updatedMs && createdMs && updatedMs > createdMs;

  return (
    <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-1.5 text-[10px] sm:text-xs text-white/90 shadow-lg">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3 h-3 text-brand" />
        <span className="font-medium">{formatDate(createdAt)}</span>
      </div>
      
      {wasUpdated && (
        <>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300 font-medium">{formatRelativeTime(updatedAt)}</span>
          </div>
        </>
      )}
    </div>
  );
}