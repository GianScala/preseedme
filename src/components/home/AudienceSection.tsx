"use client";

import Link from "next/link";

const AUDIENCES = [
  {
    id: "founder",
    title: "I'm building",
    subtitle: "For founders who ship fast and need fuel",
    color: "brand",
    href: "/ideas/new",
    cta: "Submit your idea",
    benefits: [
      { label: "Raise", value: "$500 – $5K" },
      { label: "Time", value: "Weeks, not months" },
      { label: "Requirement", value: "Just an idea" },
      { label: "Fees", value: "Zero" },
    ],
  },
  {
    id: "investor",
    title: "I'm investing",
    subtitle: "For backers who spot talent early",
    color: "amber-400",
    href: "/ideas",
    cta: "Discover projects",
    benefits: [
      { label: "Check size", value: "$100+" },
      { label: "Access", value: "Pre-hype founders" },
      { label: "Overhead", value: "None" },
      { label: "Relationship", value: "Direct to founder" },
    ],
  },
] as const;

export default function AudienceSection() {
  return (
    <section className="border-t border-white/5 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-brand">
            Who is this for
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Two sides. One platform.
          </h2>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-white/20"
            >
              <h3 className="text-xl font-semibold text-white">
                {audience.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                {audience.subtitle}
              </p>

              <div className="mt-6 space-y-3">
                {audience.benefits.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
                  >
                    <span className="text-sm text-neutral-500">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={audience.href}
                className={`mt-6 inline-flex items-center gap-1 text-sm font-medium ${
                  audience.id === "founder" ? "text-brand" : "text-amber-400"
                }`}
              >
                {audience.cta}
                <span className="transition-transform group-hover:translate-x-1">
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}