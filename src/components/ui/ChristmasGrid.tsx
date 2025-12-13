// components/ChristmasGrid.tsx
"use client";
import { useEffect, useState } from "react";

// --- DIRECT IMPORTS ---
import { ChristmasSnowflakeIcon } from "@/components/icons/background-grid/ChristmasSnowflakeIcon";
import { ChristmasTreeIcon } from "@/components/icons/background-grid/ChristmasTreeIcon";
import { ChristmasSantaIcon } from "@/components/icons/background-grid/ChristmasSantaIcon";
import { ChristmasLeafIcon } from "@/components/icons/background-grid/ChristmasLeafIcon";
import { ChristmasSnowmanIcon } from "@/components/icons/background-grid/ChristmasSnowmanIcon";
import { ChristmasCandyCaneIcon } from "@/components/icons/background-grid/ChristmasCandyCaneIcon";
import { ChristmasReindeerIcon } from "@/components/icons/background-grid/ChristmasReindeerIcon";

// --- CONFIGURATION ---
const ROWS = 12;
const COLS = 12;
const BASE_OPACITY = 0.15;

// Weighted distribution - controls how often each icon appears
const ICON_WEIGHTS = [
  { icon: ChristmasSnowflakeIcon, weight: 3.5, name: "snowflake" }, // Most common
  { icon: ChristmasLeafIcon, weight: 2.5, name: "leaf" },
  { icon: ChristmasCandyCaneIcon, weight: 2, name: "candy" },
  { icon: ChristmasTreeIcon, weight: 2, name: "tree" },
  { icon: ChristmasSnowmanIcon, weight: 1.5, name: "snowman" },
  { icon: ChristmasReindeerIcon, weight: 1, name: "reindeer" }, // Rare
  { icon: ChristmasSantaIcon, weight: 0.8, name: "santa" }, // Rarest
];

interface GridItem {
  id: string;
  component: React.ElementType;
  name: string;
  top: number;
  left: number;
  scale: number;
  rotation: number;
  opacity: number;
  hueShift: number;
}

// --- HELPER FUNCTIONS ---

/**
 * Seeded random number generator for consistent patterns
 */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Get weighted random icon based on probability weights
 */
const getWeightedIcon = (randomValue: number) => {
  const totalWeight = ICON_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let threshold = randomValue * totalWeight;

  for (const item of ICON_WEIGHTS) {
    if (threshold < item.weight) {
      return { icon: item.icon, name: item.name };
    }
    threshold -= item.weight;
  }

  return { icon: ICON_WEIGHTS[0].icon, name: ICON_WEIGHTS[0].name };
};

/**
 * Get icon based on zone/region with intelligent distribution
 */
const getIconForZone = (
  normalizedRow: number,
  normalizedCol: number,
  randomValue: number,
  distanceFromCenter: number
) => {
  // TOP ZONE: More snowflakes (winter sky effect)
  if (normalizedRow < 0.25) {
    if (randomValue < 0.75) {
      return { icon: ChristmasSnowflakeIcon, name: "snowflake" };
    }
  }

  // CENTER FOCAL AREA: Special/featured icons
  if (distanceFromCenter < 0.25) {
    if (randomValue < 0.4) {
      const specialIcons = [
        { icon: ChristmasTreeIcon, name: "tree" },
        { icon: ChristmasSantaIcon, name: "santa" },
        { icon: ChristmasReindeerIcon, name: "reindeer" },
      ];
      const specialIndex = Math.floor(seededRandom(randomValue * 999) * specialIcons.length);
      return specialIcons[specialIndex];
    }
  }

  // DIAGONAL STRIPES: Trees and candy canes
  const diagonalValue = Math.abs((normalizedRow - normalizedCol) % 0.3);
  if (diagonalValue < 0.08) {
    if (randomValue < 0.5) {
      return { icon: ChristmasTreeIcon, name: "tree" };
    } else if (randomValue < 0.8) {
      return { icon: ChristmasCandyCaneIcon, name: "candy" };
    }
  }

  // OUTER EDGES: Lighter decorative elements
  if (distanceFromCenter > 0.6) {
    if (randomValue < 0.6) {
      const edgeIcons = [
        { icon: ChristmasSnowflakeIcon, name: "snowflake" },
        { icon: ChristmasLeafIcon, name: "leaf" },
      ];
      return edgeIcons[Math.floor(seededRandom(randomValue * 777) * edgeIcons.length)];
    }
  }

  // DEFAULT: Use weighted distribution
  return getWeightedIcon(randomValue);
};

/**
 * Calculate dynamic scale based on position
 */
const calculateScale = (distanceFromCenter: number, randomValue: number): number => {
  // Center icons are larger, edge icons are smaller
  const baseScale = distanceFromCenter < 0.3 ? 0.8 : 0.5;
  const variance = distanceFromCenter < 0.3 ? 0.6 : 0.4;
  return baseScale + randomValue * variance;
};

/**
 * Calculate rotation with subtle flow pattern
 */
const calculateRotation = (
  row: number,
  col: number,
  normalizedRow: number,
  normalizedCol: number,
  randomValue: number
): number => {
  // Base flow direction (diagonal)
  const flowAngle = 15;

  // Sinusoidal wave pattern
  const waveEffect = Math.sin(row * 0.8 + col * 0.5) * 15;

  // Random jitter
  const jitter = (randomValue - 0.5) * 40;

  return flowAngle + waveEffect + jitter;
};

/**
 * Calculate opacity based on distance from center (fade at edges)
 */
const calculateOpacity = (distanceFromCenter: number): number => {
  // Fade out icons as they get further from center
  const fadeFactor = Math.max(0, 1 - distanceFromCenter * 1.2);
  return BASE_OPACITY * fadeFactor;
};

/**
 * Calculate subtle color variation
 */
const calculateHueShift = (normalizedRow: number, normalizedCol: number): number => {
  // Subtle color gradient from top to bottom
  const verticalGradient = (normalizedRow - 0.5) * 15;
  const horizontalGradient = (normalizedCol - 0.5) * 10;
  return verticalGradient + horizontalGradient;
};

// --- MAIN COMPONENT ---

export default function ChristmasGrid() {
  const [items, setItems] = useState<GridItem[]>([]);

  useEffect(() => {
    const newItems: GridItem[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cellHeight = 100 / ROWS;
        const cellWidth = 100 / COLS;

        // Normalized positions (0 to 1)
        const normalizedRow = r / ROWS;
        const normalizedCol = c / COLS;

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(
          Math.pow(normalizedRow - 0.5, 2) + Math.pow(normalizedCol - 0.5, 2)
        );

        // Seeded random values for consistency
        const seed = r * COLS + c;
        const random1 = seededRandom(seed * 1.1);
        const random2 = seededRandom(seed * 2.2);
        const random3 = seededRandom(seed * 3.3);
        const random4 = seededRandom(seed * 4.4);

        // Get icon based on zone/pattern
        const { icon: IconComponent, name } = getIconForZone(
          normalizedRow,
          normalizedCol,
          random1,
          distanceFromCenter
        );

        // Position with jitter within cell
        const jitterAmount = 0.7; // How much icons can move within their cell
        const top = r * cellHeight + random2 * (cellHeight * jitterAmount);
        const left = c * cellWidth + random3 * (cellWidth * jitterAmount);

        // Dynamic properties based on position
        const scale = calculateScale(distanceFromCenter, random4);
        const rotation = calculateRotation(r, c, normalizedRow, normalizedCol, random1);
        const opacity = calculateOpacity(distanceFromCenter);
        const hueShift = calculateHueShift(normalizedRow, normalizedCol);

        newItems.push({
          id: `icon-${r}-${c}`,
          component: IconComponent,
          name,
          top,
          left,
          scale,
          rotation,
          opacity,
          hueShift,
        });
      }
    }

    setItems(newItems);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{
        maskImage:
          "radial-gradient(ellipse 75% 75% at 50% 50%, #000 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 75% 75% at 50% 50%, #000 40%, transparent 100%)",
      }}
    >
      {items.map((item) => {
        const IconComponent = item.component;
        return (
          <div
            key={item.id}
            className="absolute text-slate-400"
            style={{
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
              opacity: item.opacity,
              filter: `hue-rotate(${item.hueShift}deg)`,
              transition: "opacity 0.5s ease-in",
            }}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <IconComponent className="w-full h-full stroke-current" />
            </div>
          </div>
        );
      })}
    </div>
  );
}