export default function GridDesign() {
    return (
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{
          // We use a mask to fade the pattern out at the edges (Vignette effect)
          // so it doesn't look too busy/messy
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)'
        }}
      >
        <svg className="w-full h-full opacity-[0.15]">
          <defs>
            {/* This pattern tiles 150x150 pixels seamlessly. 
              We define the "doodles" here once, and the browser repeats them.
            */}
            <pattern
              id="doodle-pattern"
              x="0"
              y="0"
              width="150"
              height="150"
              patternUnits="userSpaceOnUse"
            >
              {/* Set the color of the doodles */}
              <g stroke="#94a3b8" strokeWidth="1" fill="none">
                
                {/* 1. Little 3D Cube (Geometry) */}
                <path d="M20 20 L40 20 L50 10 L30 10 Z" />
                <path d="M20 20 L20 40 L40 40 L40 20" />
                <path d="M40 40 L50 30 L50 10" />
                
                {/* 2. Math Function Graph (Analytics) */}
                <path d="M80 20 L80 50 L120 50" />
                <path d="M80 50 Q100 20 120 40" strokeOpacity="0.8" />
  
                {/* 3. Small Circle/Planet */}
                <circle cx="30" cy="80" r="10" strokeDasharray="2 2" />
  
                {/* 4. Sigma / Summation Symbol */}
                <path d="M70 80 L100 80 L80 95 L100 110 L70 110" />
  
                {/* 5. Integral Symbol */}
                <path d="M130 80 C140 80, 140 90, 130 95 C120 100, 120 110, 130 110" />
  
                {/* 6. Binary/Code decoration */}
                <path d="M10 120 L30 120 M10 125 L25 125 M10 130 L35 130" strokeOpacity="0.5" />
                
                {/* 7. Random decorative pluses and dots */}
                <path d="M120 10 L120 20 M115 15 L125 15" /> {/* Plus */}
                <circle cx="60" cy="60" r="1" fill="#94a3b8" />
                <circle cx="140" cy="130" r="1.5" fill="#94a3b8" />
              </g>
            </pattern>
          </defs>
  
          {/* This Rect actually fills the screen with the pattern defined above */}
          <rect width="100%" height="100%" fill="url(#doodle-pattern)" />
        </svg>
      </div>
    );
  }