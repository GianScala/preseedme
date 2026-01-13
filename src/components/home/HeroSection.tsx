// src/components/home/HeroSection.tsx
"use client";

import Link from "next/link";
import { Rocket, Compass } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function HeroSection() {
  const { colors, cssVar } = useTheme();

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:py-28 xl:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Your next milestone{" "}
          <span style={{ color: colors.brand.DEFAULT }}>deserves funding</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-neutral-400 md:text-lg lg:text-xl">
          Skip the pitch decks. Raise{" "}
          <span className="font-semibold text-white">$500–$5K</span> from
          micro-investors who back builders, not buzzwords.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:mt-12">
          <Link
            href="/ideas/new"
            className="group relative inline-flex w-full max-w-xs items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto lg:px-8 lg:py-4"
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: `${colors.brand.DEFAULT}4D`,
              backgroundColor: `${colors.brand.DEFAULT}1A`,
              color: colors.brand.DEFAULT,
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span className="relative">Start raising</span>
          </Link>

          <Link
            href="/ideas"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-neutral-300 transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto lg:px-8 lg:py-4"
          >
            <Compass className="h-4 w-4" />
            Browse projects
          </Link>
        </div>
      </div>
    </section>
  );
}