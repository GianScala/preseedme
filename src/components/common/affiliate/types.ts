// src/components/common/affiliate/types.ts
import { StaticImageData } from "next/image";

export interface AffiliateAd {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  url: string;
  background: string; // CSS Gradient
  textColor: string;
  
  // Smart Asset Handling:
  logoImage?: StaticImageData | string; // Use this for your designed logos
  logoEmoji?: string; // Fallback if image fails or isn't provided
}