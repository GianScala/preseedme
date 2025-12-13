// src/app/mission/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our mission",
  description: "A founder-first manifesto: why PreseedMe exists.",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] sm:text-xs text-neutral-300">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/5" />;
}

function ManifestoItem({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl border border-white/10 bg-neutral-900/40 flex items-center justify-center text-[var(--brand)] font-bold">
          {n}
        </div>
        <div>
          <h3 className="text-white font-bold text-base sm:text-lg leading-snug">
            {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MissionPage() {
  return (
    <div className="space-y-14 sm:space-y-20 pb-6 animate-fade-in">
      {/* HERO */}
      <section className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5 pt-6 sm:pt-10 px-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Pill>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse mr-2" />
            Manifesto
          </Pill>
          <Pill>Founder-first</Pill>
          <Pill>Small checks</Pill>
          <Pill>Progress & trust</Pill>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]">
          We exist to fund{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">
            progress
          </span>
          , not hype.
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 leading-relaxed">
          Early founders don’t need a pitch-deck theater. They need a first push:
          $500–$5K, real feedback, and believers who show up before the world
          claps.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/ideas/new"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--brand)] text-black text-sm sm:text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(33,221,192,0.28)]"
          >
            Post your idea
          </Link>
          <Link
            href="/ideas"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm sm:text-base font-bold hover:bg-white/10 active:scale-95 transition-all"
          >
            Discover founders
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <Divider />
      </section>

      {/* THE WHY (YC style: short, blunt) */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            The problem we’re fixing
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            There’s a dead zone before VC, before traction, before “proof.”
            That’s exactly when founders need help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-white font-bold text-base sm:text-lg">
              Founders
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Need small money to validate + ship. Not a year of fundraising.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-white font-bold text-base sm:text-lg">
              Micro-investors
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Want early access and to support builders directly — with small
              checks.
            </p>
          </div>
        </div>
      </section>

      {/* PRINCIPLES / MANIFESTO */}
      <section className="max-w-5xl mx-auto px-4 space-y-7 sm:space-y-8">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            What we believe
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            A simple set of rules. If we break them, the product breaks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ManifestoItem
            n="1"
            title="Execution beats storytelling."
            desc="Progress updates are the real pitch. The best founders ship, learn, and iterate in public."
          />
          <ManifestoItem
            n="2"
            title="Small checks can change everything."
            desc="A tiny amount at the right time can turn a stalled idea into momentum."
          />
          <ManifestoItem
            n="3"
            title="Access should be fair."
            desc="Discovery shouldn’t depend on existing followers, loudness, or status."
          />
          <ManifestoItem
            n="4"
            title="Trust is built with transparency."
            desc="Backers deserve clarity: what’s the milestone, what changed, what shipped."
          />
          <ManifestoItem
            n="5"
            title="Builders and backers should meet directly."
            desc="No gatekeepers. No theater. Just a clear idea, a clear milestone, and a conversation."
          />
          <ManifestoItem
            n="6"
            title="We optimize for long-term believers."
            desc="The goal isn’t a one-time raise. It’s compounding support as you keep shipping."
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-5 sm:p-6">
          <h3 className="text-white font-bold text-base sm:text-lg">
            What we won’t do
          </h3>
          <ul className="mt-3 space-y-2 text-xs sm:text-sm text-neutral-400">
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand)]">—</span>
              We won’t force pitch decks, buzzwords, or “fundraising performance.”
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand)]">—</span>
              We won’t hide the process behind gatekeepers or pay-to-win visibility.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand)]">—</span>
              We won’t optimize for hype cycles that punish real builders.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-neutral-900 to-[var(--brand-dark)]/20">
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Build in public. Earn believers.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
            Post a milestone. Share progress. Let small backers help you move
            faster.
          </p>
          <div className="pt-5">
            <Link
              href="/ideas/new"
              className="inline-block w-full sm:w-auto px-8 py-3 rounded-full bg-white text-black text-sm sm:text-base font-bold hover:scale-105 transition-transform"
            >
              Start now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
