import type { Idea } from "@/types";
import ProfileIdeaCard from "@/components/profile/ProfileIdeaCard";
import EmptyState from "./EmptyState";

type LikedProjectsProps = {
  likedIdeas: Idea[];
};

export default function LikedProjects({ likedIdeas }: LikedProjectsProps) {
  if (likedIdeas.length === 0) {
    return <EmptyState type="liked" />;
  }

  return (
    <div className="grid gap-6">
      {likedIdeas.map((idea) => (
        <div key={idea.id} className="relative group">
          <ProfileIdeaCard idea={idea} showEdit={false} />
        </div>
      ))}
    </div>
  );
}