import Link from "next/link";
import type { Idea } from "@/types";
import ProfileIdeaCard from "@/components/profile/ProfileIdeaCard";
import AddNewIcon from "@/components/icons/AddNewIcon";
import EmptyState from "./EmptyState";

type CreatedProjectsProps = {
  ideas: Idea[];
  currentUserId?: string;
  onDelete: (ideaId: string) => Promise<void>;
};

export default function CreatedProjects({
  ideas,
  currentUserId,
  onDelete,
}: CreatedProjectsProps) {
  if (ideas.length === 0) {
    return <EmptyState type="created" />;
  }

  return (
    <>
      <Link
        href="/ideas/new"
        className="mb-4 w-full py-3 rounded-xl border border-dashed border-neutral-800 hover:border-brand/50 text-neutral-400 hover:text-brand transition-all flex items-center justify-center gap-2 group"
      >
        <div className="p-1 rounded-full transition-colors">
          <AddNewIcon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">Create New Project</span>
      </Link>

      <div className="grid gap-6">
        {ideas.map((idea) => (
          <div key={idea.id} className="relative group">
            <ProfileIdeaCard
              idea={idea}
              showEdit={idea.founderId === currentUserId}
              onDelete={() => onDelete(idea.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
}