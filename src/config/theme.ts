// src/config/theme.ts

export const colors = {
  background: "#000000",
  foreground: "#e5e5e5",

  brand: {
    DEFAULT: "#21ddc0",
    light: "#7fffd4",
    dark: "#126356",
  },

  accent: {
    blob: "#4c1d95",
    purple: "#8b5cf6",
  },

  surface: {
    DEFAULT: "rgba(255, 255, 255, 0.03)",
    hover: "rgba(255, 255, 255, 0.06)",
    border: "rgba(255, 255, 255, 0.1)",
    elevated: "rgba(255, 255, 255, 0.08)",
  },

  text: {
    primary: "#e5e5e5",
    secondary: "#a3a3a3",
    muted: "#737373",
  },

  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const spacing = {
  container: "80rem",
  navbar: "4rem",
} as const;

export const animation = {
  fast: "150ms",
  normal: "300ms",
  slow: "600ms",
} as const;

export const theme = {
  colors,
  spacing,
  animation,
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof colors;