// src/app/how-it-works/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
  description: "Share → Progress → Feedback → Credibility → Small checks → Ship.",
};

// --- Shared Components ---

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-300 backdrop-blur-md ${className}`}>
      {children}
    </span>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--brand)] opacity-[0.03] blur-[120px]"></div>
    </div>
  );
}

// --- The Clean Flywheel (Desktop) ---

const STEPS = [
  { id: 1, title: "Post Idea", sub: "Define the goal", x: 50, y: 0 },       // Top
  { id: 2, title: "Ship", sub: "Show progress", x: 93, y: 25 },             // Top Right
  { id: 3, title: "Users", sub: "Get feedback", x: 93, y: 75 },             // Bottom Right
  { id: 4, title: "Credibility", sub: "Trust compounds", x: 50, y: 100 },   // Bottom
  { id: 5, title: "Funding", sub: "Small checks", x: 7, y: 75 },            // Bottom Left
  { id: 6, title: "Repeat", sub: "Scale up", x: 7, y: 25 },                 // Top Left
];

function Flywheel() {
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[550px] items-center justify-center md:flex">
      
      {/* 1. Orbit Ring (Rotating) */}
      <div className="absolute inset-0 m-auto h-[75%] w-[75%] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-white/10 opacity-50"></div>
      
      {/* 2. Static Inner Ring (Glow) */}
      <div className="absolute inset-0 m-auto h-[55%] w-[55%] rounded-full border border-white/5 bg-[var(--brand)]/5 blur-3xl"></div>
      
      {/* 3. Center Core */}
      <div className="absolute inset-0 m-auto flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/10 bg-neutral-900/50 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Loop</span>
        <div className="h-px w-8 bg-white/10 my-1"></div>
        <span className="text-sm font-bold text-white">Growth</span>
      </div>

      {/* 4. Floating Nodes */}
      {STEPS.map((step) => (
        <div
          key={step.id}
          className="absolute flex w-32 flex-col items-center justify-center text-center transition-all duration-300 hover:scale-110"
          style={{
            left: `${step.x}%`,
            top: `${step.y}%`,
            transform: `translate(-50%, -50%)`,
          }}
        >
          {/* Node Dot */}
          <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-neutral-900 shadow-xl">
            <span className="font-mono text-xs font-bold text-[var(--brand)]">{step.id}</span>
            {/* Ping effect on active nodes (simulated) */}
            {step.id === 1 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-20"></span>
            )}
          </div>
          
          {/* Text */}
          <div className="text-sm font-bold text-white leading-tight">{step.title}</div>
          <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mt-1">{step.sub}</div>
        </div>
      ))}
    </div>
  );
}

// --- The Sleek Timeline (Mobile) ---

function MobileTimeline() {
  return (
    <div className="relative pl-4 md:hidden">
      {/* Continuous Line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--brand)] via-white/10 to-transparent"></div>

      <div className="space-y-8">
        {STEPS.map((step) => (
          <div key={step.id} className="relative flex items-start gap-5">
            {/* Timeline Dot */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-neutral-950 ring-4 ring-neutral-950">
              <span className="text-xs font-mono text-[var(--brand)]">{step.id}</span>
            </div>
            
            {/* Text Content (No bulky cards) */}
            <div className="pt-1">
              <h3 className="text-base font-bold text-white leading-tight">{step.title}</h3>
              <p className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wide">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Detailed Rows (Clean & Minimal) ---

function StepDetail({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="group relative flex items-start gap-5 py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-xl px-2 -mx-2">
      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-mono text-sm font-bold text-[var(--brand)]">
        {n}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white group-hover:text-[var(--brand-light)] transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400 max-w-xl">
          {desc}
        </p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-neutral-200 selection:bg-[var(--brand)] selection:text-black">
      
      <div className="px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* HERO */}
        <section className="text-center space-y-6 pt-10 pb-16">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Pill className="border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)]">
               <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse mr-2" />
               The Engine
            </Pill>
            <Pill>Compounds daily</Pill>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]">
            A simple loop.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
              Infinite leverage.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-neutral-400 leading-relaxed">
            Stop chasing investors. Start building a track record. 
            The system turns your progress into proof, and proof into checks.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/ideas/new"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[var(--brand)] text-black text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(33,221,192,0.3)] hover:shadow-[0_0_30px_rgba(33,221,192,0.5)]"
            >
              Start Sharing
            </Link>
            <Link
              href="/ideas"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 active:scale-95 transition-all backdrop-blur-sm"
            >
              See it in action
            </Link>
          </div>
        </section>

        {/* DIAGRAM (The Core) */}
        <section className="py-10 sm:py-20 relative">
            <Flywheel />
            <MobileTimeline />
        </section>

        {/* BREAKDOWN (Precision List) */}
        <section className="max-w-3xl mx-auto mt-10">
          <div className="text-left mb-8 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">System breakdown</h2>
          </div>
          
          <div className="flex flex-col">
            <StepDetail
              n="01"
              title="Post a milestone"
              desc="Don't pitch a vision. Pitch the next step. Define exactly what you are building, what it costs, and when it ships."
            />
            <StepDetail
              n="02"
              title="Discovery & Feedback"
              desc="The feed is an open market. Investors and users react to your plans. You get signal before you write a line of code."
            />
            <StepDetail
              n="03"
              title="Ship & Update"
              desc="Execution is the only currency. When you mark a milestone as 'Shipped', your credibility score compounds instantly."
            />
            <StepDetail
              n="04"
              title="Unlock Funding"
              desc="Believers don't wait for a board meeting. They write small checks ($500+) to back the builder, not just the business."
            />
            <StepDetail
              n="05"
              title="Repeat"
              desc="Take the capital, fund the next milestone, and do it again. The loop gets faster every time you ship."
            />
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="mt-20 sm:mt-32 pb-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/50 to-neutral-950/20 p-8 sm:p-16 text-center">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                The only requirement is to keep shipping.
              </h2>
              <p className="text-neutral-400">
                You don't need a deck. You need a milestone.
              </p>
              <div className="pt-2">
                 <Link
                  href="/ideas/new"
                  className="inline-block px-8 py-3 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
                >
                  Create Milestone
                </Link>
              </div>
            </div>
            
            {/* Subtle glow effect at bottom of card */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-[var(--brand)] opacity-[0.05] blur-[80px] pointer-events-none"></div>
          </div>
        </section>

      </div>
    </div>
  );
}