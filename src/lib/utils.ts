// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (clsx + tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Internal: format a number into k/M with sensible defaults.
 * - Handles negatives
 * - Trims trailing ".0"
 */
function formatCompactNumber(
  value: number,
  {
    decimals = 1,
    thousandSuffix = "k",
    millionSuffix = "M",
  }: {
    decimals?: number;
    thousandSuffix?: string;
    millionSuffix?: string;
  } = {}
): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  const trimZero = (s: string) => s.replace(/\.0$/, "");

  if (abs >= 1_000_000) {
    return `${sign}${trimZero((abs / 1_000_000).toFixed(decimals))}${millionSuffix}`;
  }
  if (abs >= 1_000) {
    return `${sign}${trimZero((abs / 1_000).toFixed(decimals))}${thousandSuffix}`;
  }
  return `${value}`;
}

export const formatCurrency = (
  value?: number,
  opts?: {
    /** Number of decimals used for k/M values */
    decimals?: number;
    /** Currency symbol prefix (default "$") */
    symbol?: string;
    /** If true, always show compact (k/M); if false, show raw number under 1000 */
    compact?: boolean;
  }
): string | null => {
  if (value == null || Number.isNaN(value)) return null;

  const { decimals = 1, symbol = "$", compact = true } = opts ?? {};

  if (!compact) return `${symbol}${value}`;

  // compact formats values >= 1000, otherwise raw
  if (Math.abs(value) < 1_000) return `${symbol}${value}`;

  return `${symbol}${formatCompactNumber(value, { decimals })}`;
};

export const formatNumber = (
  value?: number,
  opts?: {
    decimals?: number;
    compact?: boolean;
  }
): string | null => {
  if (value == null || Number.isNaN(value)) return null;

  const { decimals = 1, compact = true } = opts ?? {};
  if (!compact) return `${value}`;

  if (Math.abs(value) < 1_000) return `${value}`;
  return formatCompactNumber(value, { decimals });
};

/**
 * Ensure a URL has a protocol, but don't touch:
 * - relative URLs (/about)
 * - hash links (#section)
 * - special schemes (mailto:, tel:, etc.)
 */
export const ensureProtocol = (url: string): string => {
  const raw = (url ?? "").trim();
  if (!raw) return raw;

  // relative paths or hash links
  if (raw.startsWith("/") || raw.startsWith("#")) return raw;

  // has any scheme already (http, https, mailto, tel, ftp, etc.)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
};

/**
 * Parse a string into a number, returning undefined if invalid/empty.
 * Optionally supports comma separators.
 */
export const toNumberOrUndefined = (
  value: unknown,
  opts?: { allowCommas?: boolean }
): number | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalized = opts?.allowCommas ? trimmed.replace(/,/g, "") : trimmed;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};
