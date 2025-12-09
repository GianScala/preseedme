"use client";

import { useState } from "react";
import { Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface InfoCardProps {
  icon: "globe" | "document";
  title: string;
  content: string | string[];
  isSelected?: boolean;
  onSelect?: () => void;
}

const iconMap = {
  globe: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
  document: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
};

export default function InfoCard({
  icon,
  title,
  content,
  isSelected = false,
  onSelect,
}: InfoCardProps) {
  const Icon = iconMap[icon];
  const isArray = Array.isArray(content);
  const [expanded, setExpanded] = useState(false);

  // Check if text is long enough to warrant a toggle (simple heuristic)
  const isLongText = !isArray && (content as string).length > 150;

  // Wrapper: Use button for semantic correctness if interactive
  const Component = onSelect ? "button" : "div";

  return (
    <Component
      onClick={onSelect}
      className={`
        relative w-full text-left group overflow-hidden rounded-2xl border
        transition-all duration-300 ease-out
        p-4 sm:p-5
        ${
          isSelected
            ? "bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/20"
            : "bg-neutral-900/40 border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/60"
        }
        ${onSelect ? "cursor-pointer active:scale-[0.99]" : ""}
      `}
    >
      <div className="flex gap-4">
        {/* Icon Column */}
        <div className="flex-shrink-0">
          <div
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
              border transition-colors duration-300
              ${
                isSelected
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 group-hover:text-neutral-200"
              }
            `}
          >
            {Icon}
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3
            className={`
              text-sm sm:text-base font-bold mb-2 tracking-tight
              ${isSelected ? "text-blue-100" : "text-white"}
            `}
          >
            {title}
          </h3>

          {isArray ? (
            /* Array Mode: Tags */
            <div className="flex flex-wrap gap-2">
              {content.map((item, index) => (
                <span
                  key={index}
                  className={`
                    inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border
                    ${
                      isSelected
                        ? "bg-blue-900/30 border-blue-700/30 text-blue-200"
                        : "bg-neutral-800/40 border-neutral-700/50 text-neutral-300"
                    }
                  `}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            /* String Mode: Text with Read More */
            <div className="relative">
              <p
                className={`
                  text-sm leading-relaxed text-neutral-300
                  ${!expanded && isLongText ? "line-clamp-3" : ""}
                `}
              >
                {content}
              </p>
              
              {isLongText && (
                <div
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent selection
                    setExpanded(!expanded);
                  }}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors w-fit"
                >
                  {expanded ? (
                    <>
                      Show Less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read More <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Component>
  );
}