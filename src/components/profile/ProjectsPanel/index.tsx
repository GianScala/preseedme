import { useState } from "react";
import type { Idea } from "@/types";
import { ProjectsView } from "@/app/(app)/profile/utils/types";
import CreatedProjects from "./CreatedProjects";
import LikedProjects from "./LikedProjects";

type ProjectsPanelProps = {
  createdIdeas: Idea[];
  likedIdeas: Idea[];
  currentUserId?: string;
  onDeleteIdea: (ideaId: string) => Promise<void>;
};

export default function ProjectsPanel({
  createdIdeas,
  likedIdeas,
  currentUserId,
  onDeleteIdea,
}: ProjectsPanelProps) {
  const [projectsView, setProjectsView] = useState<ProjectsView>("created");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="hidden md:flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Your Projects</h2>
          <p className="text-xs text-neutral-400 mt-1">
            {projectsView === "created"
              ? "Projects you've published"
              : "Projects you've liked"}
          </p>
        </div>
      </div>

      <div className="flex p-1 bg-neutral-900/20 rounded-full border border-neutral-800 text-xs font-medium w-full">
        <button
          type="button"
          onClick={() => setProjectsView("created")}
          className={`flex-1 py-1.5 rounded-full transition-all ${
            projectsView === "created"
              ? "bg-neutral-800/50 text-white shadow-sm"
              : "text-neutral-400"
          }`}
        >
          Created
        </button>
        <button
          type="button"
          onClick={() => setProjectsView("liked")}
          className={`flex-1 py-1.5 rounded-full transition-all ${
            projectsView === "liked"
              ? "bg-neutral-800/50 text-white shadow-sm"
              : "text-neutral-400"
          }`}
        >
          Liked
        </button>
      </div>

      {projectsView === "created" ? (
        <CreatedProjects
          ideas={createdIdeas}
          currentUserId={currentUserId}
          onDelete={onDeleteIdea}
        />
      ) : (
        <LikedProjects likedIdeas={likedIdeas} />
      )}
    </div>
  );
}