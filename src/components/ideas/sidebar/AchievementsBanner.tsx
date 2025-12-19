// src/components/ideas/AchievementsBanner.tsx
import { Award, TrendingUp, Sparkles, Trophy, Star } from "lucide-react";
import { JSX } from "react";

type AchievementsBannerProps = {
  achievements: string[];
  weekLabel?: string;
  contextLabel?: string;
};

type AchievementConfig = {
  label: string;
  icon: JSX.Element;
  gradient: string;
  shadow: string;
  ring: string;
};

const achievementConfig: Record<string, AchievementConfig> = {
  "idea-of-the-day": {
    label: "Idea of the Day",
    icon: <Award className="w-4 h-4" />,
    gradient: "bg-gradient-to-br from-amber-400 to-amber-600",
    shadow: "shadow-lg shadow-amber-500/30",
    ring: "ring-amber-300/50",
  },
  "weekly-rank-1": {
    label: "Weekly #1",
    icon: <Trophy className="w-4 h-4" />,
    gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "shadow-lg shadow-purple-500/30",
    ring: "ring-purple-300/50",
  },
  "weekly-rank-2": {
    label: "Weekly #2",
    icon: <Star className="w-4 h-4" />,
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
    shadow: "shadow-lg shadow-blue-500/30",
    ring: "ring-blue-300/50",
  },
  "weekly-rank-3": {
    label: "Weekly #3",
    icon: <Sparkles className="w-4 h-4" />,
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
    shadow: "shadow-lg shadow-emerald-500/30",
    ring: "ring-emerald-300/50",
  },
  "weekly-rank-4": {
    label: "Weekly #4",
    icon: <TrendingUp className="w-4 h-4" />,
    gradient: "bg-gradient-to-br from-orange-500 to-rose-500",
    shadow: "shadow-lg shadow-orange-500/30",
    ring: "ring-orange-300/50",
  },
};

function Laurel({ side }: { side: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`hidden sm:block absolute top-1/2 -translate-y-1/2 w-12 h-12 lg:w-16 lg:h-16 text-slate-200/60 ${
        side === "left" ? "left-2 lg:left-4" : "right-2 lg:right-4"
      }`}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={side === "right" ? "translate(64,0) scale(-1,1)" : undefined}
      >
        <path d="M22 50c-6-9-7-18-3-28 2-5 6-9 10-12" />
        {[
          [23, 44, 14, 40],
          [22, 38, 12, 33],
          [22, 32, 12, 26],
          [24, 26, 14, 20],
          [27, 20, 18, 14],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={i} d={`M${x1} ${y1} Q${x2} ${y2} ${x1 + 6} ${y1 - 2}`} />
        ))}
      </g>
    </svg>
  );
}

export default function AchievementsBanner({
  achievements,
  weekLabel,
  contextLabel,
}: AchievementsBannerProps) {
  const items = achievements
    .map((key) => ({ key, config: achievementConfig[key] }))
    .filter((item) => item.config);

  if (!items.length) return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-xl shadow-slate-200/50 backdrop-blur-sm px-6 py-5 sm:px-8 sm:py-6"
      role="region"
      aria-label="Achievement banner"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] via-transparent to-amber-500/[0.02] pointer-events-none" />

      <Laurel side="left" />
      <Laurel side="right" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          {weekLabel && (
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
              {weekLabel}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent leading-none">
              Peerlist
            </h2>
            {contextLabel && (
              <>
                <span className="text-slate-300 font-light text-xl">•</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-600 leading-none">
                  {contextLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Achievement badges */}
        <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {items.map(({ key, config }) => (
            <div
              key={key}
              className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-white font-semibold text-sm ring-2 ring-inset transition-all duration-300 hover:scale-105 active:scale-95 cursor-default ${config.gradient} ${config.shadow} ${config.ring}`}
              title={config.label}
            >
              {/* Icon */}
              <span className="flex-shrink-0 transform group-hover:rotate-12 transition-transform duration-300">
                {config.icon}
              </span>
              {/* Label */}
              <span className="whitespace-nowrap tracking-wide">
                {config.label}
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}