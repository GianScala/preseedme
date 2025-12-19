"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface InfoCardProps {
  title: string;
  content: string | string[];
}

export default function InfoCard({ title, content }: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isArray = Array.isArray(content);
  const text = isArray ? "" : (content as string);
  const shouldTruncate = !isArray && text.length > 180;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-neutral-950/40 via-neutral-900/20 to-neutral-900 border-neutral-800/70 shadow-xl px-5 py-5 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
      </div>

      {/* Content */}
      {isArray ? (
        // Tags
        <div className="flex flex-wrap gap-2">
          {content.map((item, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900/70 border border-neutral-700/70 text-neutral-200 hover:bg-neutral-800/70 hover:border-neutral-600 transition-all"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        // Text with smart "Read more"
        <div className="text-sm sm:text-base leading-relaxed text-neutral-300">
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
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
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
  );
}