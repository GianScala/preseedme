// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import HomePageClient from "@/components/home/HomePageClient";
import { getLatestIdeas } from "@/lib/ideas";

export default async function Page() {
  const ideas = await getLatestIdeas(30);

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <HomePageClient initialIdeas={ideas} />
    </div>
  );
}