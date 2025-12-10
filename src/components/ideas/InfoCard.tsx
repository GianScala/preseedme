"use client";

import { useState } from "react";
import { Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface InfoCardProps {
  icon: "globe" | "document";
  title: string;
  content: string | string[];
}

const iconMap = {
  globe: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
  document: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
};

export default function InfoCard({ icon, title, content }: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isArray = Array.isArray(content);
  const text = isArray ? "" : (content as string);
  const shouldTruncate = !isArray && text.length > 180;

  return (
    <div
      className="
        relative w-full overflow-hidden rounded-2xl border
        bg-gradient-to-br from-neutral-950/40 via-neutral-900/20 to-neutral-900
        border-neutral-800/70
        shadow-[0_18px_45px_rgba(0,0,0,0.55)]
        px-4 py-4 sm:px-6 sm:py-5
      "
    >
      <div className="flex items-start gap-4">
        {/* Icon – hidden on mobile for better readability */}
        <div
          className="
            hidden sm:flex
            flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl
            bg-neutral-900/70 border border-neutral-700/70
            items-center justify-center
            text-neutral-200
          "
        >
          {iconMap[icon]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          {isArray ? (
            // Tags
            <div className="flex flex-wrap gap-2 mt-1">
              {content.map((item, i) => (
                <span
                  key={i}
                  className="
                    px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-neutral-900/70 border border-neutral-700/70
                    text-neutral-200
                  "
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            // Text with smart "Read more"
            <div className="text-sm leading-relaxed text-neutral-200">
              <p className={!expanded && shouldTruncate ? "line-clamp-3" : ""}>
                {text}
              </p>

              {shouldTruncate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="
                    mt-3 inline-flex items-center gap-1.5 text-xs font-medium
                    text-neutral-400 hover:text-neutral-200
                    transition-colors
                  "
                >
                  {expanded ? (
                    <>
                      Show less
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Read more
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
