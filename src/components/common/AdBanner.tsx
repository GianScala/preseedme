// src/components/AdBanner.tsx
"use client";

import { useState, useEffect } from "react";

interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  logoEmoji?: string;
}

// Mockup ads - in production these would come from an ad network
const MOCK_ADS: Ad[] = [
  {
    id: "ad-1",
    title: "Scale Your Startup",
    description: "AWS credits up to $100k for early-stage startups",
    ctaText: "Apply Now",
    url: "https://aws.amazon.com/activate/",
    backgroundColor: "linear-gradient(135deg, #FF9900 0%, #FF6600 100%)",
    textColor: "#FFFFFF",
    logoEmoji: "☁️",
  },
  {
    id: "ad-2",
    title: "Ship Faster",
    description: "Vercel Pro - Deploy in seconds, scale to millions",
    ctaText: "Start Free",
    url: "https://vercel.com/",
    backgroundColor: "linear-gradient(135deg, #000000 0%, #333333 100%)",
    textColor: "#FFFFFF",
    logoEmoji: "▲",
  },
  {
    id: "ad-3",
    title: "Build Better APIs",
    description: "Postman - The API platform used by 25M developers",
    ctaText: "Get Started",
    url: "https://www.postman.com/",
    backgroundColor: "linear-gradient(135deg, #FF6C37 0%, #FF9A56 100%)",
    textColor: "#FFFFFF",
    logoEmoji: "🚀",
  },
];

export default function AdBanner() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const currentAd = MOCK_ADS[currentAdIndex];

  // Rotate ads every 8 seconds
  useEffect(() => {
    if (isClosed) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % MOCK_ADS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isClosed]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsClosed(true), 300);
  };

  const handleAdClick = () => {
    // Track click (integrate with analytics)
    console.log(`Ad clicked: ${currentAd.id}`);
    window.open(currentAd.url, "_blank", "noopener,noreferrer");
  };

  if (isClosed) return null;

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{
        background: currentAd.backgroundColor,
        minHeight: "80px",
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
        aria-label="Close ad"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: currentAd.textColor }}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Ad content */}
      <div
        onClick={handleAdClick}
        className="cursor-pointer h-full px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4"
      >
        {/* Logo/Emoji */}
        {currentAd.logoEmoji && (
          <div className="text-3xl sm:text-4xl flex-shrink-0">
            {currentAd.logoEmoji}
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-sm sm:text-base mb-0.5 truncate"
            style={{ color: currentAd.textColor }}
          >
            {currentAd.title}
          </h3>
          <p
            className="text-xs sm:text-sm opacity-90 line-clamp-1"
            style={{ color: currentAd.textColor }}
          >
            {currentAd.description}
          </p>
        </div>

        {/* CTA Button */}
        <button
          className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
          style={{ color: currentAd.textColor }}
        >
          {currentAd.ctaText}
        </button>
      </div>

      {/* Ad indicator dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {MOCK_ADS.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentAdIndex ? "w-6 opacity-100" : "w-1 opacity-50"
            }`}
            style={{ backgroundColor: currentAd.textColor }}
          />
        ))}
      </div>

      {/* Sponsored label */}
      <div className="absolute top-2 left-2">
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm"
          style={{ color: currentAd.textColor }}
        >
          Ad
        </span>
      </div>
    </div>
  );
}