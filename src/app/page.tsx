// app/page.tsx
import React from "react";
import HomePageClient from "@/components/HomePageClient";
import AdBanner from "@/components/common/AdBanner";
import { getProjectDaily, getLatestIdeas } from "@/lib/ideas";
import { fetchWeeklyWinnersFromFirebase } from "@/lib/weeklyWinners";

export default async function Page() {
  // Fetch ALL data on the server in parallel
  const [dailyProjectData, latest, weeklyWinners] = await Promise.all([
    getProjectDaily(),
    getLatestIdeas(30),
    fetchWeeklyWinnersFromFirebase(),
  ]);

  const filteredLatest =
    dailyProjectData && latest.length
      ? latest.filter((idea) => idea.id !== dailyProjectData.id)
      : latest;

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <AdBanner />
      
      <HomePageClient
        initialFeaturedIdea={dailyProjectData}
        initialIdeas={filteredLatest}
        initialWeeklyWinners={weeklyWinners}
      />
    </div>
  );
}