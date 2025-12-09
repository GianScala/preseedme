// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { SpeedIcon } from "@/components/icons/SpeedIcon";
import { ValidationIcon } from "@/components/icons/ValidationIcon";
import { FocusIcon } from "@/components/icons/FocusIcon";
import { BelieversIcon } from "@/components/icons/BelieversIcon";
import { DiscoveryIcon } from "@/components/icons/DiscoveryIcon";
import { AccessIcon } from "@/components/icons/AccessIcon";
import { ImpactIcon } from "@/components/icons/ImpactIcon";
import { DirectIcon } from "@/components/icons/DirectIcon";
import { FounderIcon } from "@/components/icons/FounderIcon";
import { InvestorIcon } from "@/components/icons/InvestorIcon";
import { DailyWinnerIcon } from "@/components/icons/DailyWinnerIcon";
import { TrophyIcon } from "@/components/icons/TrophyIcon";

export const metadata: Metadata = {
  title: "About",
  description:
    "PreseedMe connects founders with small investors for early-stage funding",
};

// --- Types -------------------------------------------------------------------

type BenefitItem = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
};

// --- Data --------------------------------------------------------------------

const FOUNDER_PROBLEMS = [
  "Building solo or with a small team",
  "Need $1K-$5K to validate the idea",
  "Not ready for VC yet",
  "Want believers, not just banks",
];

const INVESTOR_PROBLEMS = [
  "Want to invest small checks ($500+)",
  "Access to founders pre-hype",
  "No traditional legal overhead",
  "Support builders directly",
];

const FOUNDER_BENEFITS: BenefitItem[] = [
  { Icon: SpeedIcon, title: "Speed", desc: "Start small and be known in days, not months" },
  {
    Icon: ValidationIcon,
    title: "Validation",
    desc: "Money & likes = social proof to keep you moving",
  },
  {
    Icon: FocusIcon,
    title: "Focus",
    desc: "Small checks for specific goals",
  },
  {
    Icon: BelieversIcon,
    title: "Believers",
    desc: "Find long-term supporters from day one",
  },
];

const INVESTOR_BENEFITS: BenefitItem[] = [
  { Icon: DiscoveryIcon, title: "Discovery", desc: "Spot great founders and young businesses" },
  {
    Icon: AccessIcon,
    title: "Access",
    desc: "Invest small checks into founders you believe in",
  },
  {
    Icon: ImpactIcon,
    title: "Impact",
    desc: "Fund tangible milestones and see progress",
  },
  {
    Icon: DirectIcon,
    title: "Direct",
    desc: "Build a direct relationship with founders",
  },
];

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Share",
    desc: "Post your projects & needs",
  },
  {
    step: "2",
    title: "Connect",
    desc: "Investors message you directly",
  },
  {
    step: "3",
    title: "Terms",
    desc: "Agree on seed & milestones",
  },
  {
    step: "4",
    title: "Ship",
    desc: "Get funds, ship, update your progress",
  },
];

const FAQS = [
  {
    q: "How much to ask for?",
    a: "Start with $500-$2K for your first milestone. Prove execution, then raise more.",
  },
  {
    q: "Should I give equity?",
    a: "This is up to you. Many prefer revenue shares vs equity. It's ultimately up to the founder and investor to agree.",
  },
  {
    q: "What if I fail?",
    a: "Transparency is key. Investors back the founder's journey, not just one idea.",
  },
  {
    q: "Platform fees?",
    a: "Preseedme if free for everyone to use. We charge no fees.",
  },
];

// --- Components --------------------------------------------------------------

function SectionLabel({ text }: { text: string }) {
  return (
    <span className="inline-block py-0.5 px-2.5 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20 text-[var(--brand)] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
      {text}
    </span>
  );
}

type ProblemCardProps = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  problems: string[];
  delay: string;
};

function ProblemCard({ Icon, title, problems, delay }: ProblemCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-5 sm:p-8 animate-fade-in ${delay}`}
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <span className="p-2 sm:p-3 rounded-xl bg-white/5">
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--brand)]" />
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
      </div>
      <ul className="space-y-3 sm:space-y-4">
        {problems.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-400"
          >
            <span className="text-brand">-</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BenefitGrid({ items }: { items: BenefitItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {items.map(({ Icon, title, desc }) => (
        <div
          key={title}
          className="flex items-start sm:block p-4 sm:p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors"
        >
          <div className="mr-3 sm:mr-0 sm:mb-3">
            <Icon className="w-6 h-6 sm:w-7 h-7 text-[var(--brand)]" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm sm:text-base mb-0.5 sm:mb-1">
              {title}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Page --------------------------------------------------------------------

export default function AboutPage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-4 animate-fade-in">
      {/* 1. Hero Section - Mobile Optimized */}
      <section className="text-center max-w-4xl mx-auto space-y-5 sm:space-y-6 pt-6 sm:pt-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs text-neutral-300 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
          Micro-funding for brave founders
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Get the first{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">
            Seed
          </span>{" "}
          <br />
          <span className="text-4xl sm:text-5xl md:text-7xl">
            to grow your business
          </span>
        </h1>

        <p className="text-sm sm:text-lg md:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed px-4">
          Connect with micro-investors. No pitch decks, no lawyers - just
          builders and backers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 px-4">
          <Link
            href="/ideas"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--brand)] text-black text-sm sm:text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(33,221,192,0.3)]"
          >
            Discover Projects
          </Link>
          <Link
            href="/ideas/new"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm sm:text-base font-bold hover:bg-white/10 active:scale-95 transition-all"
          >
            Start Now
          </Link>
        </div>
      </section>

      {/* 2. The Problem Gap */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            The Funding Gap
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
            Traditional investors want traction and a product. Founders need
            money to get off the ground. We fix this loop.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <ProblemCard
            Icon={FounderIcon}
            title="Founders"
            problems={FOUNDER_PROBLEMS}
            delay="delay-100"
          />
          <ProblemCard
            Icon={InvestorIcon}
            title="Investors"
            problems={INVESTOR_PROBLEMS}
            delay="delay-200"
          />
        </div>
      </section>

      {/* 3. Steps (Compact on Mobile) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="p-6 sm:p-12 rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-neutral-900/80 to-neutral-900/40 backdrop-blur-xl">
          <div className="text-center mb-8 sm:mb-12">
            <SectionLabel text="Process" />
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              From Idea to Preseed
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8">
            {JOURNEY_STEPS.map((item, i) => (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector Line (Desktop Only) */}
                {i !== JOURNEY_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-[var(--brand)]/30 to-transparent" />
                )}

                <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-[var(--brand)] font-bold text-lg sm:text-xl mb-3 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-snug">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Benefits (Split View) */}
      <section className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 sm:gap-12">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
            <span className="text-[var(--brand)]">Founders</span> get speed.
          </h2>
          <BenefitGrid items={FOUNDER_BENEFITS} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
            <span className="text-[var(--brand)]">Investors</span> get access.
          </h2>
          <BenefitGrid items={INVESTOR_BENEFITS} />
        </div>
      </section>

      {/* 5. Visibility (Compact Cards) */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Leveling the Playing Field
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 px-4">
            Algorithms surface ideas based on merit, not follower count. Every
            founder gets a fair daily shot at visibility, and the strongest
            ideas earn a weekly spotlight.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Daily Winner */}
          <div className="rounded-xl p-6 border border-[var(--brand)]/20 bg-[var(--brand)]/5">
            <div className="flex items-center gap-3 mb-3">
              <DailyWinnerIcon className="w-7 h-7 text-[var(--brand)]" />
              <h3 className="text-lg font-bold text-white">Daily Random Winner</h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-3 leading-relaxed">
              Every day, one published project is randomly selected and featured
              on the homepage for 24 hours. No votes, no follower bias - just a
              fair shot at visibility for early-stage founders.
            </p>
            <div className="text-[10px] sm:text-xs text-[var(--brand)] font-bold uppercase tracking-wide">
              Pure visibility
            </div>
          </div>

          {/* Weekly Top 3 */}
          <div className="rounded-xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-3">
              <TrophyIcon className="w-7 h-7 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Weekly Top 3</h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-2 leading-relaxed">
              Each week, we highlight the top 3 ideas based on community likes,
              meaningful feedback, founder progress updates, and our proprietary
              scoring algorithm that evaluates core business fundamentals.
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-300 mb-2 leading-relaxed">
              These projects get a 10x view boost and are prioritized for
              investor attention.
            </p>
            <div className="text-[10px] sm:text-xs text-yellow-500 font-bold uppercase tracking-wide">
              10x View Boost · Investor find you first
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ (Simplified) */}
      <section className="max-w-2xl mx-auto px-4 pt-4 sm:pt-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          Quick FAQ
        </h2>
        <div className="grid gap-3">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-lg border border-white/5 bg-neutral-900/40 p-4"
            >
              <h4 className="font-bold text-white text-sm sm:text-base mb-1.5">
                {q}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-400">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer CTA (Mobile friendly) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-neutral-900 to-[var(--brand-dark)]/20 relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Ready to build?
            </h2>
            <div className="pt-2">
              <Link
                href="/ideas/new"
                className="inline-block w-full sm:w-auto px-8 py-3 rounded-full bg-white text-black text-sm sm:text-base font-bold hover:scale-105 transition-transform"
              >
                Start Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
