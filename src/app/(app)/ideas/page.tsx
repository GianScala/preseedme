// app/ideas/page.tsx
import { headers } from 'next/headers';
import IdeasPageClient from "@/components/IdeasPageClient";
import { getLatestIdeas, getFeaturedIdea } from "@/lib/ideas";
import { fetchWeeklyWinnersFromFirebase } from "@/lib/weeklyWinners"; // <-- Same import as main page

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function IdeasPage() {
  const headersList = headers();
  const generatedAt = new Date().toISOString();
  
  console.log('🚀 [Server] Fetching ideas at:', generatedAt);

  try {
    // Fetch ideas, featured idea, AND weekly winners (same as main page)
    const [ideasData, featuredIdeaData, weeklyWinnersData] = await Promise.all([
      getLatestIdeas(50),
      getFeaturedIdea(),
      fetchWeeklyWinnersFromFirebase(), // <-- Use the same function!
    ]);

    console.log('✅ [Server] Fetched', ideasData.length, 'ideas');
    console.log('✅ [Server] Fetched', weeklyWinnersData.length, 'weekly winners');

    // Merge featured idea if it exists and isn't in the list
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
        serverGeneratedAt={generatedAt}
        initialWeeklyWinners={weeklyWinnersData} // <-- Pass the fetched data
      />
    );
  } catch (error) {
    console.error('❌ [Server] Error fetching ideas:', error);
    
    return (
      <IdeasPageClient 
        initialIdeas={[]}
        initialFeaturedId={null}
        serverGeneratedAt={generatedAt}
        initialError="Failed to load ideas. Please refresh the page."
        initialWeeklyWinners={[]}
      />
    );
  }
}