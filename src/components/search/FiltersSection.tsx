"use client";

import { memo, useState } from "react";

interface FiltersSectionProps {
  sortBy: "smart" | "newest" | "mostLiked" | "recentlyUpdated";
  onSortChange: (sort: "smart" | "newest" | "mostLiked" | "recentlyUpdated") => void;
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
  
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const sliderPercentage = maxLikeCount > 0 ? (minLikes / maxLikeCount) * 100 : 0;

  const sortOptions = {
    smart: { label: "✨ Smart Sort", desc: "Balance of recency & popularity" },
    newest: { label: "🆕 Newest First", desc: "Most recently created" },
    recentlyUpdated: { label: "🔄 Recently Updated", desc: "Latest updates first" },
    mostLiked: { label: "🔥 Most Popular", desc: "Highest engagement" },
  } as const;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-black/20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </h3>
        
        {hasActiveFilters && (
          <button 
            type="button" 
            onClick={onClearAll} 
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sort */}
        <div className="space-y-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-neutral-400 block">
            Sort by
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
            className="w-full appearance-none rounded-xl bg-neutral-900/40 border border-white/10 py-2.5 px-4 pr-10 text-sm text-white focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all cursor-pointer hover:bg-neutral-900/60"
          >
            {Object.entries(sortOptions).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
                {key === "smart" ? " (Recommended)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500">
            {sortOptions[sortBy].desc}
          </p>
        </div>

        {/* Likes Filter */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label htmlFor="min-likes-slider" className="text-xs font-medium text-neutral-400">
              Minimum Likes
            </label>
            <span className="text-xs font-semibold text-[var(--brand)] tabular-nums">
              {minLikes}+
            </span>
          </div>
          <input
            id="min-likes-slider"
            type="range"
            min={0}
            max={maxLikeCount || 0}
            value={minLikes}
            onChange={(e) => onMinLikesChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:ring-offset-2 focus:ring-offset-black/20"
            style={{
              background: `linear-gradient(to right, var(--brand) ${sliderPercentage}%, rgba(255,255,255,0.1) ${sliderPercentage}%)`,
            }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <button 
          type="button" 
          onClick={() => setIsTagsOpen(!isTagsOpen)}
          className="w-full flex items-center justify-between group mb-3"
        >
          <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors flex items-center gap-2">
            Tags
            {selectedTags.length > 0 && (
              <span className="text-[10px] bg-[var(--brand)]/10 text-[var(--brand)] px-2 py-0.5 rounded-full border border-[var(--brand)]/20">
                {selectedTags.length}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {selectedTags.length > 0 && (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTags();
                }} 
                className="text-[10px] text-neutral-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
            <svg 
              className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isTagsOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {isTagsOpen && (
          <div className="space-y-2" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {allTags.length > 0 ? (
              <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedTags.includes(tag)
                        ? "bg-[var(--brand)] text-black border-[var(--brand)] shadow-lg shadow-[var(--brand)]/20"
                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-600 italic">No tags available</p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default FiltersSection;