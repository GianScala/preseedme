// app/ideas/page.tsx
import IdeasPageClient from "@/components/IdeasPageClient";
import { getLatestIdeas, getFeaturedIdea } from "@/lib/ideas";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IdeasPage() {
  const [ideasData, featuredIdeaData] = await Promise.all([
    getLatestIdeas(50),
    getFeaturedIdea(), // ✅ Changed from getFeaturedProjectId()
  ]);

  // ✅ Merge featured idea into ideas array if it's not already there
  let allIdeas = ideasData;
  if (featuredIdeaData) {
    const featuredExists = ideasData.some(idea => idea.id === featuredIdeaData.id);
    if (!featuredExists) {
      allIdeas = [featuredIdeaData, ...ideasData];
    }
  }

  return (
    <IdeasPageClient 
      initialIdeas={allIdeas} 
      initialFeaturedId={featuredIdeaData?.id ?? null} 
    />
  );
}