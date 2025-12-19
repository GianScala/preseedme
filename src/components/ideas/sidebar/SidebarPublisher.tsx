"use client";

import Link from "next/link";

interface SidebarPublisherProps {
  idea: {
    founderId: string;
    founderUsername?: string;
  };
  avatarUrl: string | null;
}

export default function SidebarPublisher({ idea, avatarUrl }: SidebarPublisherProps) {
  const initial = idea.founderUsername?.[0] || "A";

  return (
    <Link 
      href={`/profile/${idea.founderId}`} 
      className="relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-neutral-950/20 via-neutral-900/20 to-neutral-900 border-neutral-800/70 shadow-xl px-2 py-2 hover:border-brand/50 transition-all duration-300 group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-brand/30 transition-all">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={idea.founderUsername || "Founder"} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="font-bold text-white uppercase text-base">
              {initial}
            </span>
          )}
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Founder
          </p>
          <p className="text-base font-bold text-white group-hover:text-brand truncate transition-colors">
            {idea.founderUsername || "Anonymous Founder"}
          </p>
        </div>

        {/* Arrow Icon */}
        <div className="text-neutral-700 group-hover:text-brand transition-colors">
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}