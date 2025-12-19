// src/types/idea.ts

import type { Deliverable } from './common';

export type Idea = {
  id: string;
  title: string;
  oneLiner: string;
  description: string;
  founderId: string; // equal to user ID, for the publisher id
  founderHandle: string;
  founderUsername: string;
  createdAt: number;
  updatedAt?: number; // Added for tracking updates
  likeCount?: number;
  likedByUserIds?: string[];
  websiteUrl?: string;
  demoVideoUrl?: string;
  thumbnailUrl?: string; // idea logo or thumbnail image
  category?: string;
  tags?: string[];
  sector?: string;
  sectors?: string[];
  targetAudience?: string;
  targetAudiences?: string[];
  targetDemographics?: string[];
  revenueModels?: string[];
  foundedYear?: number;
  totalRevenueSinceInception?: number;
  monthlyRecurringRevenue?: number;
  userCount?: number;
  targetMarket?: string;
  teamBackground?: string;
  teamWhyYouWillWin?: string;
  industryInsights?: string;
  valuePropositionDetail?: string;
  deliverablesOverview?: string;
  deliverables?: Deliverable[];
  deliverablesUpdatedAt?: number;
  deliverablesMilestones?: string; // Backwards compatibility
  isFundraising?: boolean;
  fundraisingGoal?: number;
  fundraisingRaisedSoFar?: number;
  fundraisingMinCheckSize?: number;
  achievements?: string[]; // e.g., ["idea-of-the-day", "weekly-rank-1", "weekly-rank-2"]
};