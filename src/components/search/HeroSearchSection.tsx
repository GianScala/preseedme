"use client";

type HeroSearchSectionProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResults: number;
  isLoading: boolean;
};

export default function HeroSearchSection({
  searchQuery,
  onSearchChange,
  totalResults,
  isLoading,
}: HeroSearchSectionProps) {
  return (
    <section className="relative flex flex-col items-center justify-center py-8 sm:py-12 animate-fade-in">
      
      {/* Headlines - Clean & Centered */}
      <div className="text-center space-y-4 mb-8 sm:mb-10 max-w-3xl px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
          Discover Tomorrow's <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">
            Unicorns Today
          </span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
          The launchpad for bootstrapped founders building in public. 
          Find your next investment or inspiration.
        </p>
      </div>

      {/* Search Bar - Premium Glass Effect */}
      <div className="w-full max-w-2xl px-4 relative group">
                
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search ideas, markets, or founders..."
            className="
              w-full h-14 pl-12 pr-12 rounded-xl 
              bg-neutral-900/20 backdrop-blur-xl border border-white/10 
              text-white placeholder-neutral-500 text-base 
              transition-all duration-300
              
              /* UX FIX: Replaced blurred div with smooth shadow glow */
              shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] 
              focus:shadow-[0_0_30px_-5px_var(--brand)]
              
              focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/50 focus:border-[var(--brand)]
            "
          />
          
          {/* Search Icon */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results Indicator */}
      <div className="h-8 mt-4 flex items-center justify-center">
        {searchQuery && (
          <p className="text-sm text-neutral-400 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 animate-fade-in">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                Searching...
              </span>
            ) : totalResults === 0 ? (
               <span>No results found for "<span className="text-white">{searchQuery}</span>"</span>
            ) : (
              <span>
                Found <span className="text-[var(--brand)] font-bold">{totalResults}</span> {totalResults === 1 ? "project" : "projects"}
              </span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}