// src/components/common/affiliate/affiliate_two/data.ts
import { AffiliateAd } from "../types";
import WrapprLogo from "./logo.png";

// --- CONFIGURATION ---
// Softer, smoother transparency (12%)
const ALPHA = 0.12;

// Azure Marine Palette (soft ocean glass vibes)
const DEEP_MARINE = "#0a3d62";  // deep blue-green
const MID_AZURE   = "#3c8dbc";  // azure
const LIGHT_AQUA  = "#82ccdd";  // soft aqua highlight

// Hex → RGBA converter
const toRGBA = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AFFILIATE_TWO_ADS: AffiliateAd[] = [
  {
    id: "wrappr",
    title: "wrappr",
    description: "Turn any ideas into an engaging podcast using AI",
    ctaText: "Start Free",
    url: "https://www.wrappr.ai",

    // 🌊 Azure Marine Glass Gradient (smooth + transparent)
    background: `
      radial-gradient(circle at 12% 18%, rgba(2, 154, 142, 0.58) 0%, transparent 55%),
      radial-gradient(circle at 85% 85%, rgba(23, 196, 187, 0.3) 0%, transparent 65%),
      linear-gradient(135deg,
        ${toRGBA(DEEP_MARINE, ALPHA)} 0%,
        ${toRGBA(MID_AZURE,   ALPHA)} 50%,
        ${toRGBA(LIGHT_AQUA,  ALPHA)} 100%
      )
    `,
    
    textColor: "#FFFFFF",
    logoImage: WrapprLogo,
    logoEmoji: "🤖",
  },
];
