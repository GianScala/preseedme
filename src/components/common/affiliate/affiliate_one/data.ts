// src/components/common/affiliate/affiliate_one/data.ts
import { AffiliateAd } from "../types";
import PreseedLogo from "./logo.png"; 

// --- CONFIGURATION ---
// Softer transparency: 12% opacity
const ALPHA = 0.12;

// Colors (more luminous & smoother blending)
const DEEP_INDIGO = '#1e3a8a';
const MEDIUM_BLUE = '#3b82f6';
const LIGHT_BLUE = '#93c5fd';

// Helper
const toRGBA = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AFFILIATE_ONE_ADS = [
  {
    id: "preseedme",
    title: "PreseedMe",
    description: "The launchpad for bootstrapped founders building in public",
    ctaText: "Join Now",
    url: "https://www.preseedme.com",

    // ✨ MUCH SMOOTHER, MORE TRANSPARENT GLASS GRADIENT
    background: `
      radial-gradient(circle at 15% 15%, rgba(70, 243, 214, 0.4) 0%, transparent 55%),
      radial-gradient(circle at 80% 80%, rgba(28, 237, 195, 0.2) 0%, transparent 65%),
      linear-gradient(135deg,
        ${toRGBA(DEEP_INDIGO, ALPHA)} 0%,
        ${toRGBA(MEDIUM_BLUE, ALPHA)} 45%,
        ${toRGBA(LIGHT_BLUE, ALPHA)} 100%
      )
    `,
    
    textColor: "#FFFFFF",
    logoImage: PreseedLogo,
    logoEmoji: "🚀",
  },
];
