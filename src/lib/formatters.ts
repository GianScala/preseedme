// src/lib/formatters.ts
export function formatCurrencyShort(value?: number | null): string | null {
    if (value == null) return null;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value}`;
  }
  
  export function formatNumberShort(value?: number | null): string | null {
    if (value == null) return null;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return `${value}`;
  }