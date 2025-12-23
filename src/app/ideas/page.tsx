// app/ideas/page.tsx
import { headers } from 'next/headers';
import IdeasPageClient from "@/components/IdeasPageClient";
import { getLatestIdeas, getFeaturedIdea } from "@/lib/ideas";

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Disable caching at route level
export const fetchCache = 'force-no-store';

export default async function IdeasPage() {
  // Access headers to force dynamic rendering
  const headersList = headers();
  const generatedAt = new Date().toISOString();
  
  console.log('🚀 [Server] Fetching ideas at:', generatedAt);
  
  try {
    const [ideasData, featuredIdeaData] = await Promise.all([
      getLatestIdeas(50),
      getFeaturedIdea(),
    ]);
    
    console.log('✅ [Server] Fetched', ideasData.length, 'ideas');
    
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
      />
    );
  } catch (error) {
    console.error('❌ [Server] Error fetching ideas:', error);
    
    // Return error state to client
    return (
      <IdeasPageClient 
        initialIdeas={[]} 
        initialFeaturedId={null}
        serverGeneratedAt={generatedAt}
        initialError="Failed to load ideas. Please refresh the page."
      />
    );
  }
}