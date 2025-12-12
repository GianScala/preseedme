import Link from "next/link";
import type { Idea } from "@/types";
import RestrictedSection from "./RestrictedSection";

type ProjectsSectionProps = {
  ideas: Idea[];
  isAuthenticated: boolean;
  onAuthTrigger: () => void;
};

export default function ProjectsSection({
  ideas,
  isAuthenticated,
  onAuthTrigger,
}: ProjectsSectionProps) {
  return (
    <section className="pt-4 border-t border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
          Published Projects
          <span className="text-[10px] sm:text-xs font-normal text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded-full">
            {ideas.length}
          </span>
        </h3>
      </div>

      {ideas.length > 0 ? (
        <RestrictedSection
          isAuthenticated={isAuthenticated}
          onAuthTrigger={onAuthTrigger}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <Link
                href={isAuthenticated ? `/ideas/${idea.id}` : "#"}
                key={idea.id}
                onClick={(e) => {
                  if (!isAuthenticated) e.preventDefault();
                }}
                className="group block p-4 rounded-xl bg-neutral-900/30 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/60 transition-all"
              >
                <h4 className="font-semibold text-sm text-white group-hover:text-brand transition-colors line-clamp-1 mb-1.5">
                  {idea.title}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {idea.oneLiner}
                </p>
              </Link>
            ))}
          </div>
        </RestrictedSection>
      ) : (
        <div className="text-center py-8 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
          <p className="text-xs text-neutral-500">No public projects yet.</p>
        </div>
      )}
    </section>
  );
}