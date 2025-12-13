import type { ReactNode } from "react";
import { Check, AlertCircle, ChevronRight } from "lucide-react";

interface SectionWrapperProps {
  number: number;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: ReactNode;
  children: ReactNode;
  isComplete?: boolean;
  showEmptyWarning?: boolean;
}

export default function SectionWrapper({
  number,
  title,
  description,
  isOpen,
  onToggle,
  icon,
  children,
  isComplete = false,
  showEmptyWarning = false,
}: SectionWrapperProps) {
  const sectionId = `section-${number}`;
  const panelId = `${sectionId}-panel`;

  // Dynamic Styles based on state
  const containerClasses = isOpen
    ? "border-neutral-700 bg-neutral-900/50 shadow-2xl shadow-black/50" // Active State
    : "border-neutral-800/50 hover:border-neutral-700/80 hover:bg-neutral-900/20"; // Idle State

  const iconRingClasses = isOpen
    ? "bg-brand/10 ring-2 ring-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(var(--brand-rgb),0.3)]"
    : isComplete
    ? "bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400" // Complete State (Subtle Green)
    : "bg-neutral-900/50 ring-1 ring-neutral-800 text-neutral-400 group-hover:text-neutral-200";

  return (
    <section
      className={`
        relative group rounded-2xl border transition-all duration-300 ease-out overflow-hidden
        ${containerClasses}
      `}
    >
      {/* Active "Glow" Backdrop */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Header Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={sectionId}
        className="relative z-10 w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left outline-none"
      >
        <div className="flex items-start gap-4 flex-1">
          {/* Icon Container with Status Badges */}
          <div className="relative flex-shrink-0">
            <div
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-300
                ${iconRingClasses}
              `}
            >
              {icon}
            </div>

            {/* Status Indicator (Floating Badge) */}
            <div className="absolute -bottom-1 -right-1 z-20">
              {isComplete && !isOpen && (
                <div className="bg-neutral-950 rounded-full border border-neutral-800 p-0.5 animate-in zoom-in">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-neutral-950 stroke-[3]" />
                  </div>
                </div>
              )}
              {showEmptyWarning && !isComplete && (
                <div className="bg-neutral-950 rounded-full border border-neutral-800 p-0.5 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                    <AlertCircle className="w-2.5 h-2.5 text-neutral-950 stroke-[3]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`
                text-[10px] uppercase tracking-wider font-bold
                ${isOpen ? 'text-brand' : 'text-neutral-500'}
              `}>
                Step {number}
              </span>
              {isComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  Done
                </span>
              )}
            </div>
            
            <h2 className={`
              text-lg sm:text-xl font-bold transition-colors duration-200
              ${isOpen ? 'text-white' : 'text-neutral-300 group-hover:text-white'}
            `}>
              {title}
            </h2>
            <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
              {description}
            </p>
          </div>
        </div>

        {/* Chevron Toggle */}
        <div className={`
          flex-shrink-0 transition-transform duration-300 ease-in-out
          text-neutral-500 group-hover:text-neutral-300
          ${isOpen ? 'rotate-90 text-brand' : ''}
        `}>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </button>

      {/* Expandable Content Panel */}
      <div
        id={panelId}
        aria-labelledby={sectionId}
        className={`
          relative z-10 overflow-hidden transition-all duration-300
          ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="border-t border-neutral-800/50 p-4 sm:p-6 bg-neutral-950/20">
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}