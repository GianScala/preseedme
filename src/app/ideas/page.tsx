// app/ideas/page.tsx
import React from "react";
import IdeasPageClient from "@/components/IdeasPageClient";
import { getLatestIdeas, getFeaturedProjectId } from "@/lib/ideas";

export default async function IdeasPage() {
  // Fetch data on the SERVER
  const [ideasData, featuredIdData] = await Promise.all([
    getLatestIdeas(50),
    getFeaturedProjectId(),
  ]);

  return (
    <IdeasPageClient 
      initialIdeas={ideasData} 
      initialFeaturedId={featuredIdData} 
    />
  );
}