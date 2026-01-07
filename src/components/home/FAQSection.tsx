"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How much should I ask for?",
    a: "Start specific: $500–$1K for your first milestone. Ask for a resource ('$100 for hosting and domain') not runway ('$5K to figure things out'). Concrete asks get funded faster.",
  },
  {
    q: "Do I need a working product?",
    a: "No. An idea is enough to start. But founders who post updates and ship milestones build credibility. That momentum attracts investors more than a polished deck ever will.",
  },
  {
    q: "What do investors get in return?",
    a: "You decide. Common setups: small equity (0.5–2%), revenue share, or a SAFE note. Keep terms simple. This isn't VC - it's backing builders.",
  },
  {
    q: "Does PreseedMe take a cut?",
    a: "Zero fees. No percentage of your raise, no subscription, no hidden costs. We connect you with investors. You handle the rest directly.",
  },
  {
    q: "How does payment work?",
    a: "We don't touch the money. When an investor commits, you coordinate directly. Use whatever works: Bank Transfer, PayPal, Crypto or Venmo.",
  },
] as const;

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl">
        {/* Header – centered and balanced */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-brand">
            FAQ
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Common questions
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-400 md:text-lg">
            Quick answers to get you started
          </p>
        </header>

        {/* Accordion */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;

              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:px-8 sm:py-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span
                      className={`font-medium transition-colors ${
                        isOpen ? "text-brand" : "text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Smooth height transition */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        id={`faq-answer-${i}`}
                        className="px-6 pb-6 pt-2 text-sm leading-relaxed text-neutral-400 sm:px-8 sm:text-base"
                      >
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}