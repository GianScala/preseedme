"use client";

import { useEffect, useRef } from "react";
import ChristmasGrid from "./ChristmasGrid"; // Importing the smart grid

export default function InteractiveBackground() {
  const interactiveRef = useRef<HTMLDivElement>(null);
  
  // Use Refs instead of State to avoid re-renders on every frame
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // *** NEW: Ref for smooth scaling ***
  const currentScale = useRef<number>(1.0); 
  // ***

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    if (isBrowser) {
        targetPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        currentPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const onMouseMove = (event: MouseEvent) => {
      targetPos.current.x = event.clientX;
      targetPos.current.y = event.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        targetPos.current.x = event.touches[0].clientX;
        targetPos.current.y = event.touches[0].clientY;
      }
    };

    const animate = () => {
      if (!interactiveRef.current) return;

      const ease = 0.05;
      const scaleEase = 0.1; // Smoothness for the scale change

      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * ease;
      currentPos.current.y += dy * ease;

      const x = currentPos.current.x - 250; 
      const y = currentPos.current.y - 250;
      
      // --- Scale Logic based on Velocity ---
      
      // 1. Calculate velocity (magnitude of movement in the current frame)
      const velocity = Math.hypot(dx * ease, dy * ease); 

      // 2. Determine the target scale based on velocity
      const maxVelocity = 30; // Max movement speed considered for scaling
      const maxReduction = 0.5; // Scale down by up to 50% (to a minimum of 0.5)
      
      // Calculate how much to reduce the scale (0 to maxReduction)
      const reductionFactor = Math.min(1, velocity / maxVelocity);
      const targetScale = 1.0 - (reductionFactor * maxReduction);

      // 3. Ease towards the target scale
      const dScale = targetScale - currentScale.current;
      currentScale.current += dScale * scaleEase;

      // 4. Apply both translate and the smoothed scale
      interactiveRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${currentScale.current})`;

      // --- End Scale Logic ---

      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none select-none">
      {/* 1. Base Dark Layer (User Colors) */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* 2. Static Ambient Blobs (User Colors) */}
      <div className="absolute inset-0 w-full h-full opacity-40">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"
          style={{ backgroundColor: "var(--brand-dark)", animationDelay: "0s" }}
        />
        <div 
          className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"
          style={{ backgroundColor: "#1e1b4b", animationDelay: "2s" }} 
        />
        <div 
          className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"
          style={{ backgroundColor: "var(--brand-dark)", animationDelay: "4s" }}
        />
      </div>

      {/* 3. The Smart Christmas Grid 
          - Placed BEHIND the mouse blob so the mouse illuminates it
          - The icons are gray/dim by default due to opacity in Grid component
      */}
      <ChristmasGrid />

      {/* 4. Interactive Mouse Blob */}
      <div 
        ref={interactiveRef} 
        // Using mix-blend-overlay or screen allows the cyan to "light up" the gray grid lines below
        className="absolute top-0 left-0 mix-blend-screen will-change-transform"
      >
        <div 
            className="w-[500px] h-[500px] rounded-full blur-[80px]" 
            style={{ 
                background: "radial-gradient(circle, rgba(33, 221, 192, 0.25) 0%, rgba(0,0,0,0) 70%)" 
            }}
        />
      </div>
      
      {/* 5. Noise Texture Overlay - REFINED */}
      <div className="absolute inset-0 w-full h-full opacity-[0.02]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
}