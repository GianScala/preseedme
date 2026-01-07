"use client";

import { PlusCircle, Target, Users, BadgeCheck } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: PlusCircle,
    title: "Add your startup",
    desc: "Create your profile in 60 seconds. No pitch deck required. Just your idea and where you're headed.",
  },
  {
    icon: Target,
    title: "Set milestones",
    desc: "Break your roadmap into small, fundable milestones. Ask for $500–$5K to deliver each one. Be specific about what you'll ship.",
  },
  {
    icon: Users,
    title: "Get discovered",
    desc: "Micro-investors browse the platform looking for builders to back. They find you, review your milestones, and reach out directly.",
  },
  {
    icon: BadgeCheck,
    title: "Agree & ship",
    desc: "Accept terms that work for you. Deliver your milestone. Get paid. Repeat for your next milestone.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl">
        {/* Header – perfectly centered */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-brand">
            How it works
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Four steps. No Pitch Deck.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-400 md:text-lg">
            Traditional fundraising takes months. This takes minutes.
          </p>
        </header>

        {/* Steps grid */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] sm:p-8"
              >
                {/* Icon container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand/20">
                  <step.icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="mt-3 text-lg font-semibold text-white md:text-xl">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-neutral-400 md:text-base">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}