// components/ChristmasGrid.tsx
"use client";

import React, { useEffect, useState } from "react";

// --- ICONS ---
import { ChristmasSnowflakeIcon } from "@/components/icons/background-grid/ChristmasSnowflakeIcon";
import { ChristmasTreeIcon } from "@/components/icons/background-grid/ChristmasTreeIcon";
import { ChristmasSantaIcon } from "@/components/icons/background-grid/ChristmasSantaIcon";
import { ChristmasLeafIcon } from "@/components/icons/background-grid/ChristmasLeafIcon";
import { ChristmasSnowmanIcon } from "@/components/icons/background-grid/ChristmasSnowmanIcon";
import { ChristmasCandyCaneIcon } from "@/components/icons/background-grid/ChristmasCandyCaneIcon";
import { ChristmasReindeerIcon } from "@/components/icons/background-grid/ChristmasReindeerIcon";

// --- CONFIGURATION ---
const CELL_SIZE = 120; // Larger cells = cleaner, more professional look
const STROKE_COLOR = "text-slate-300"; // Neutral, non-intrusive color

const ICONS = [
  ChristmasSnowflakeIcon,
  ChristmasLeafIcon,
  ChristmasCandyCaneIcon,
  ChristmasTreeIcon,
  ChristmasSnowmanIcon,
  ChristmasReindeerIcon,
  ChristmasSantaIcon,
];

export default function ChristmasGrid() {
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateGrid = () => {
      // Calculate how many full cells fit in the viewport
      const cols = Math.ceil(window.innerWidth / CELL_SIZE);
      const rows = Math.ceil(window.innerHeight / CELL_SIZE);
      setGridDimensions({ rows, cols });
    };

    calculateGrid();

    const handleResize = () => {
      // Simple debounce using RequestAnimationFrame for performance
      requestAnimationFrame(calculateGrid);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) return null;

  // Create a predictable pattern based on coordinates (x,y)
  // This ensures the grid looks stable and not "randomly messy"
  const renderGridCells = () => {
    const cells = [];
    for (let row = 0; row < gridDimensions.rows; row++) {
      for (let col = 0; col < gridDimensions.cols; col++) {
        // Use a deterministic index to pick an icon
        // This creates a repeating diagonal pattern (very professional looking)
        const iconIndex = (row + col) % ICONS.length;
        const Icon = ICONS[iconIndex];
        
        // Skip some cells to create "negative space" (airiness)
        // (col * row) % 3 === 0 creates a nice regular gap pattern
        if ((col * row) % 5 === 0) continue;

        cells.push(
          <div
            key={`${row}-${col}`}
            className="flex items-center justify-center opacity-20"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          >
            <Icon 
              className={`w-8 h-8 ${STROKE_COLOR} stroke-1`} 
              style={{
                // Subtle rotation based on position for organic feel
                transform: `rotate(${(row * col * 10) % 360}deg)`,
              }}
            />
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none -z-50 bg-transparent"
      style={{
        // THIS IS THE KEY "EXTREMITIES FADE" LOGIC
        // It creates a mask that is:
        // 1. Transparent at the very edges (0%)
        // 2. Visible in the mid-section (100%)
        // 3. Fades out again in the deep center if you want (optional)
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
      }}
    >
      {/* We use Flex + Wrap to create a perfect grid without heavy math.
        This handles alignment automatically.
      */}
      <div 
        className="flex flex-wrap content-start"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
        {renderGridCells()}
      </div>
    </div>
  );
}