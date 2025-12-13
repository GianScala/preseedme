'use client'; // If using Next.js App Router, this needs to be a client component
import React, { useState, useRef, useEffect } from 'react';

export default function SmartGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setOpacity(1); // Show spotlight when mouse enters
  };

  const handleMouseLeave = () => {
    setOpacity(0); // Fade out spotlight when mouse leaves
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full bg-transparent overflow-hidden"
      style={{
        // 1. The Global Vignette (Fades the edges to transparent)
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)'
      }}
    >
      
      {/* LAYER 1: The "Ghost" Grid 
          This is always visible but extremely faint (5% opacity).
          It gives the user context that a grid exists.
      */}
      <div className="absolute inset-0 z-0">
        <GridPattern opacity={0.05} />
      </div>

      {/* LAYER 2: The "Spotlight" Grid
          This layer is brighter (30% opacity) but is masked by the mouse position.
      */}
      <div 
        className="absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: opacity,
          // The spotlight mask: reveals the grid in a 350px circle around the mouse
          maskImage: `radial-gradient(350px circle at ${position.x}px ${position.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(350px circle at ${position.x}px ${position.y}px, black, transparent)`
        }}
      >
        <GridPattern opacity={0.3} />
      </div>
    </div>
  );
}

// Reusable SVG Component to ensure both layers line up perfectly
function GridPattern({ opacity }: { opacity: number }) {
  return (
    <svg className="w-full h-full pointer-events-none">
      <defs>
        <pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Infinite Flow Animation */}
          <animateTransform 
              attributeName="patternTransform" 
              type="translate" 
              from="0 0" 
              to="0 40" 
              dur="3s" 
              repeatCount="indefinite" 
          />
          {/* The Line */}
          <path 
            d="M 40 0 L 0 0 0 40" 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="1" 
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" opacity={opacity} />
    </svg>
  );
}