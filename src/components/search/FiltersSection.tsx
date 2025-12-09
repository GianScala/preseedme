"use client";

import { memo } from "react";

interface FiltersSectionProps {
  sortBy: "newest" | "mostLiked";
  onSortChange: (sort: "newest" | "mostLiked") => void;
  minLikes: number;
  onMinLikesChange: (likes: number) => void;
  maxLikeCount: number;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  allTags: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

const FiltersSection = memo(function FiltersSection({
  sortBy,
  onSortChange,
  minLikes,
  onMinLikesChange,
  maxLikeCount,
  selectedTags,
  onToggleTag,
  onClearTags,
  allTags,
  hasActiveFilters,
  onClearAll,
}: FiltersSectionProps) {
  
  // Calculate slider background percentage for the fill effect
  const sliderPercentage = maxLikeCount > 0 ? (minLikes / maxLikeCount) * 100 : 0;
  
  const gradientStyle = {
    background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${sliderPercentage}%, rgba(255, 255, 255, 0.1) ${sliderPercentage}%, rgba(255, 255, 255, 0.1) 100%)`,
  };

  return (
    <div className="space-y-5 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-black/20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
            <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Filter Results</h3>
        </div>
        
        {hasActiveFilters && (
          <button 
            type="button" 
            onClick={onClearAll} 
            className="group flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <span>Reset all</span>
            <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sort Dropdown */}
        <div className="space-y-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-neutral-400 ml-1">Sort by</label>
          <div className="relative">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "newest" | "mostLiked")}
              className="w-full appearance-none rounded-xl bg-neutral-900/50 border border-white/10 py-2.5 pl-4 pr-10 text-sm text-neutral-200 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all cursor-pointer hover:bg-neutral-800/50"
            >
              <option value="newest">Newest First</option>
              <option value="mostLiked">Most Popular</option>
            </select>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="min-likes-slider" className="text-xs font-medium text-neutral-400">Minimum Likes</label>
            <span className="text-xs font-bold text-[var(--brand)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-md border border-[var(--brand)]/20 tabular-nums">
              {minLikes}+
            </span>
          </div>
          <div className="relative h-10 flex items-center">
             <input
              id="min-likes-slider"
              type="range"
              min={0}
              max={maxLikeCount || 0}
              value={minLikes}
              onChange={(e) => onMinLikesChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
              style={gradientStyle}
            />
            {/* Custom Thumb Styling is handled via simple CSS or global CSS, 
                but Tailwind `accent-[var(--brand)]` in the props works for modern browsers */}
          </div>
        </div>
      </div>

      {/* Tags Cloud */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-neutral-400">Filter by tags</p>
          {selectedTags.length > 0 && (
            <button type="button" onClick={onClearTags} className="text-[10px] text-neutral-500 hover:text-white transition-colors">
              Clear tags
            </button>
          )}
        </div>
        
        {allTags.length > 0 ? (
          <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto custom-scrollbar p-1 -m-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${selectedTags.includes(tag)
                    ? "bg-[var(--brand)] text-black border-[var(--brand)] shadow-[0_0_10px_rgba(33,221,192,0.3)] scale-105"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:border-white/20 hover:bg-white/10"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-600 italic px-1">No tags found.</p>
        )}
      </div>
    </div>
  );
});

export default FiltersSection;