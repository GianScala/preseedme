// src/components/AdBanner.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { MASTER_AD_LIST } from "@/components/common/affiliate";
import { X, ArrowRight } from "lucide-react";

export default function AdBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const ads = MASTER_AD_LIST ?? [];
  const hasMultiple = ads.length > 1;

  const currentAd = useMemo(() => ads[currentIndex], [ads, currentIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (!isVisible || isPaused || !hasMultiple) return;

    const id = setInterval(nextSlide, 6000);
    return () => clearInterval(id);
  }, [isVisible, isPaused, hasMultiple, nextSlide]);

  if (!isVisible || ads.length === 0) return null;

  return (
    <div className="w-full sm:px-0 mb-2">
      <article
        className="relative w-full rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 group"
        style={{ background: currentAd.background }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="complementary"
        aria-label="Advertisement"
      >
        {/* Close */}
        <button
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss"
          className="absolute -top-1.5 -right-1.5 z-20 p-1.5 bg-black/30 hover:bg-black/50 text-white/90 rounded-full shadow-md backdrop-blur-sm group/close transition-all"
        >
          <X size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover/close:rotate-90" />
        </button>

        {/* Main */}
        <a
          href={currentAd.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-between w-full px-4 py-3 sm:px-6 sm:py-5 gap-3 min-h-[80px] sm:min-h-[110px]"
        >
          {/* Left */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-xl shadow border border-white/20 overflow-hidden">
              {currentAd.logoImage ? (
                <Image
                  src={currentAd.logoImage}
                  alt={`${currentAd.title} logo`}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xl">{currentAd.logoEmoji ?? "🎯"}</span>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-[13px] sm:text-lg text-white leading-tight">
                <span className="truncate flex items-center gap-2">
                  {currentAd.title}
                </span>
              </h3>
              <p className="text-[10px] sm:text-sm text-white/95 font-medium leading-tight line-clamp-2 sm:line-clamp-1">
                {currentAd.description}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 pl-3 sm:pl-5 border-l border-white/15 flex items-center">
            <span className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-full shadow-lg hover:bg-gray-50 transition">
              {currentAd.ctaText}
              <ArrowRight size={16} />
            </span>

            <span className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 text-white shadow-sm">
              <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          </div>
        </a>
      </article>

      {/* Pagination */}
      {hasMultiple && (
        <div className="flex justify-center mt-3">
          <div className="flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 bg-gray-800 shadow-sm"
                    : "w-1.5 bg-gray-400 hover:bg-gray-600 hover:w-3"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
