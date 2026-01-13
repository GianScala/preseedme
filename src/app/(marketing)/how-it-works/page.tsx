// src/app/how-it-works/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- Shared Components ---

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] sm:text-xs text-neutral-300 ${className}`}>
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/5" />;
}

// --- DATA ---

const STEPS = [
  { 
    id: 1, 
    title: "Set Milestone", 
    desc: "Don't pitch a unicorn. Pitch the next deliverable.", 
    action: "The Ask", 
    x: 50, y: 0 
  },
  { 
    id: 2, 
    title: "Social Proof", 
    desc: "The community reacts. You get early validation.", 
    action: "The Reach", 
    x: 93, y: 50 
  },
  { 
    id: 3, 
    title: "Ship It", 
    desc: "Execute the work. Upload proof. Show you are a builder.", 
    action: "The Proof", 
    x: 50, y: 100 
  },
  { 
    id: 4, 
    title: "Get Funded", 
    desc: "Investors see work and write a check for the next step.", 
    action: "The Check", 
    x: 7, y: 50 
  },
];

const PRICING = [
    {
        price: "$150 - $500",
        title: "Validation Check",
        desc: "Perfect for getting an idea off the ground.",
        items: ["Landing Page Deployment", "Working Prototype", "Database Setup", "Initial Market Outreach"]
    },
    {
        price: "$500 - $1.5k",
        title: "MVP Check",
        desc: "Funding the first working version.",
        items: ["Core Feature Implementation", "Beta App Launch", "First 100 Users", "Marketing Experiments" ]
    },
    {
        price: "$2k - $5k",
        title: "Growth Check",
        desc: "Scaling what already works.",
        items: ["Mobile App Launch", "Complex Backend", "Get First Customers", "Revenue Generation" ]
    }
];

// --- REFINED FAQs ---
const FAQS = [
  {
    q: "Can I start with just an idea?",
    a: "Absolutely. Don’t wait for a perfect product. Posting your idea now forces you to clarify your vision. As you ship updates, you prove to investors that you aren't just dreaming - you're executing. That momentum is what gets funded."
  },
  {
    q: "How much should I ask for?",
    a: "Keep it small and specific: $500 to $5,000. Don't ask for a vague 'runway'; ask for a resource (e.g., 'Hosting costs', 'Developer fee', 'Marketing budget'). Investors write checks for concrete deliverables they can understand."
  },
  {
    q: "When should I ask for funding?",
    a: "You can attach an 'Ask' to any milestone immediately. If you don't get funded right away, keep building. A profile full of 'progress' badges creates a track record. Investors love speed - show them you move fast even before the money hits."
  },
  {
    q: "How does the money transfer happen?",
    a: "PreseedMe connects you; we don't touch the money. When an investor commits, you'll use our in-app chat to agree on the transfer method (Wise, PayPal, Crypto, etc.). Zero platform fees on your funding."
  },
  {
    q: "What do investors get in return (ROI)?",
    a: "Founders and investors set the terms. For these micro-checks, it’s usually a lightweight agreement. You might offer a future discount (SAFE), a small % of equity, or a revenue share once you're profitable. Be clear about the offer in your milestone description."
  }
];

// --- VISUAL COMPONENTS: THE LOOP ---

function Flywheel() {
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[450px] items-center justify-center lg:flex">
      {/* Glow */}
      <div className="absolute inset-0 m-auto h-[60%] w-[60%] rounded-full bg-[var(--brand)]/5 blur-3xl"></div>
      
      {/* Spinning Ring */}
      <div className="absolute inset-0 m-auto h-[80%] w-[80%] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-white/10 opacity-50"></div>

      {/* Center Core */}
      <div className="absolute inset-0 m-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl shadow-2xl z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">preseed</span>
        <span className="text-xl font-bold text-white">cycle</span>
      </div>

      {/* Floating Nodes */}
      {STEPS.map((step) => (
        <div
          key={step.id}
          className="absolute flex w-32 flex-col items-center justify-center text-center group z-20"
          style={{ left: `${step.x}%`, top: `${step.y}%`, transform: `translate(-50%, -50%)` }}
        >
          <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-neutral-900 shadow-xl group-hover:border-[var(--brand)]/50 transition-colors">
            <span className="font-mono text-sm font-bold text-[var(--brand)]">{step.id}</span>
          </div>
          <h3 className="text-xs font-bold text-white bg-neutral-950/50 backdrop-blur px-2 py-1 rounded">{step.title}</h3>
        </div>
      ))}
    </div>
  );
}

// --- MOBILE COMPONENTS: MOCK UI ---

function MobileProcess() {
  return (
    <div className="flex flex-col gap-10 md:hidden px-2 mt-8">
      
      {/* Step 1: The Ask */}
      <div className="relative border-l border-white/10 pl-6 pb-2">
        <div className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-black font-bold text-xs">1</div>
        <h3 className="text-lg font-bold text-white">Post Milestone</h3>
        <p className="text-neutral-400 text-sm mt-1 mb-4">Define exactly what you need to ship.</p>

        {/* MOCK UI */}
        <div className="w-full max-w-xs rounded-xl border border-white/10 bg-neutral-900/50 p-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-xs text-neutral-400">Milestone</span>
                <span className="text-xs text-white font-medium">Build MVP Dashboard</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Ask Amount</span>
                <span className="bg-[var(--brand)]/10 text-[var(--brand)] px-2 py-1 rounded text-xs font-bold border border-[var(--brand)]/20">
                  $250
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Feedback & Reach */}
      <div className="relative border-l border-white/10 pl-6 pb-2">
        <div className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 border border-white/10 text-white font-bold text-xs">2</div>
        <h3 className="text-lg font-bold text-white">Get Reach & Feedback</h3>
        <p className="text-neutral-400 text-sm mt-1 mb-4">Investors watch your engagement.</p>

        {/* MOCK UI */}
        <div className="w-full max-w-xs rounded-xl border border-white/10 bg-neutral-900/50 p-3 shadow-lg flex gap-3 items-center">
           <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-6 w-6 rounded-full bg-blue-500 ring-2 ring-neutral-900"></div>
                <div className="inline-block h-6 w-6 rounded-full bg-purple-800 ring-2 ring-neutral-900"></div>
                <div className="inline-block h-6 w-6 rounded-full bg-green-800 ring-2 ring-neutral-900"></div>
           </div>
           <div className="text-xs text-neutral-400">
             <span className="text-white font-bold">12 Investors</span> liked this.
           </div>
        </div>
      </div>

      {/* Step 3: The Check */}
      <div className="relative border-l border-transparent pl-6 pb-2">
        <div className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 border border-white/10 text-white font-bold text-xs">3</div>
        <h3 className="text-lg font-bold text-white">Receive Check</h3>
        <p className="text-neutral-400 text-sm mt-1 mb-4">You shipped. You get funded.</p>

        {/* MOCK UI */}
        <div className="w-full max-w-xs rounded-xl border border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand)]/10 to-transparent p-4 shadow-lg">
           <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-black font-bold">$</div>
               <div>
                   <div className="text-xl font-bold text-white">
                     $250 <span className="text-sm font-normal text-neutral-500">received</span>
                   </div>
               </div>
           </div>
        </div>
      </div>

    </div>
  );
}

// --- MAIN PAGE ---

export default function HowItWorksPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-14 sm:space-y-20 pb-6 animate-fade-in">
      
      {/* HERO */}
      <section className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5 pt-6 sm:pt-10 px-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Pill>
            early founders
          </Pill>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
          <Pill>
            early investors
          </Pill>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]">
          A simple loop.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">
            Infinite leverage.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Stop chasing investors. Start building a track record. 
          Turn your progress into proof, and proof into checks.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/ideas/new"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--brand)] text-black text-sm sm:text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(33,221,192,0.28)]"
          >
            Start Sharing
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <Divider />
      </section>

      {/* SECTION 1: THE INTERACTIVE LOOP */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visuals: Flywheel (Desktop) / Cards (Mobile) */}
            <div className="relative order-2 lg:order-1">
                <Flywheel />
                <MobileProcess />
            </div>

            {/* Explainer Text */}
            <div className="order-1 lg:order-2 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">The "Show, Don't Tell" Loop</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        Investors are tired of slides. They want to see execution. Turn your development roadmap into a funding pipeline.
                    </p>
                </div>

                <div className="space-y-4">
                    {STEPS.map((step) => (
                         <div key={step.id} className="group flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 font-mono text-sm font-bold text-[var(--brand)]">
                                0{step.id}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">{step.title}</h3>
                                <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <Divider />
      </section>

      {/* SECTION 2: PRICING EXAMPLES */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How much should you ask?
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            We help raise <span className="text-white font-bold">$500–$5K</span>. Your ask must be realistic and tied to a concrete deliverable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {PRICING.map((item, i) => (
                <div key={i} className="group relative flex flex-col p-5 sm:p-6 rounded-2xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-900/50 hover:border-[var(--brand)]/30 transition-all duration-300">
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{item.price}</span>
                        <span className="text-xs text-neutral-500">/ milestone</span>
                    </div>
                    <h3 className="text-[var(--brand)] font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-xs text-neutral-400 mb-6">{item.desc}</p>
                    
                    <ul className="space-y-2 mt-auto pt-4 border-t border-white/5">
                        {item.items.map((sub, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                                <svg className="w-3 h-3 text-[var(--brand)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                {sub}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <Divider />
      </section>

      {/* SECTION 3: FAQ */}
      <section className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
           <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Common Questions
          </h2>
        </div>

        <div className="space-y-3">
            {FAQS.map((faq, idx) => (
                 <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <button 
                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                    >
                        <span className="text-white font-bold text-sm sm:text-base pr-4">{faq.q}</span>
                        <span className={`text-neutral-500 transform transition-transform duration-300 shrink-0 ${openIndex === idx ? 'rotate-180' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                    </button>
                    <AnimatePresence initial={false}>
                        {openIndex === idx && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: "auto", opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                                    {faq.a}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-neutral-900/50 to-[var(--brand-dark)]/20">
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Ready to prove it?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
            You don't need a deck. You need a milestone.
          </p>
          <div className="pt-5">
            <Link
              href="/ideas/new"
              className="inline-block w-full sm:w-auto px-8 py-3 rounded-full bg-white text-black text-sm sm:text-base font-bold hover:scale-105 transition-transform"
            >
              Create Milestone
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}