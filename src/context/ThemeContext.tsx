// src/context/ThemeContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { theme as defaultTheme, type Theme, type ThemeColors } from "@/config/theme";

type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  cssVar: (path: string) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function themeToCSSVars(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(vars, themeToCSSVars(value as Record<string, unknown>, varName));
    } else {
      const finalName = key === "DEFAULT" ? prefix : varName;
      vars[`--${finalName}`] = String(value); // ✅ FIXED: was missing "["
    }
  }

  return vars;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode = "dark",
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    const root = document.documentElement;
    const cssVars = themeToCSSVars(defaultTheme.colors);

    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [mode]);

  const cssVar = (path: string) => `var(--${path.replace(/\./g, "-")})`;

  const value: ThemeContextValue = {
    theme: defaultTheme,
    mode,
    colors: defaultTheme.colors,
    setMode,
    cssVar,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useColors() {
  const { colors } = useTheme();
  return colors;
}