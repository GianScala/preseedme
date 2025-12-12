import Link from "next/link";

type EmptyStateProps = {
  type: "created" | "liked";
};

export default function EmptyState({ type }: EmptyStateProps) {
  if (type === "created") {
    return (
      <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
        <p className="text-neutral-400 mb-4">No ideas published yet.</p>
        <Link
          href="/ideas/new"
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white transition-colors"
        >
          Draft your first idea
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
      <p className="text-neutral-400 mb-2">
        You haven&apos;t liked any projects yet.
      </p>
      <p className="text-xs text-neutral-500">
        Browse the explore page and tap the heart on projects you love.
      </p>
    </div>
  );
}