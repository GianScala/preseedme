// src/types/index.ts
export type Deliverable = {
  id: string;
  text: string;
  progress: number; // 0-100
  createdAt: number;
};

export type UserProfile = {
  id: string;
  email: string | null;
  username: string;
  handle: string | null;
  photoURL?: string | null;
  createdAt: number;
  publishedIdeaIds: string[];
  likedIdeaIds?: string[];
  preferredPhoneNumber?: string | null;
  address?: string | null;
  bio?: string | null;
  location?: string | null;
  role?: "founder" | "investor" | "both";
  xUrl: string | null | undefined;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
};

export type Idea = {
  id: string;
  title: string;
  oneLiner: string;
  description: string;
  founderId: string;
  founderHandle: string;
  founderUsername: string;
  createdAt: number;
  updatedAt?: number; // Added for tracking updates
  likeCount?: number;
  likedByUserIds?: string[];
  websiteUrl?: string;
  demoVideoUrl?: string;
  thumbnailUrl?: string;
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
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  participants: string[];
  ideaId?: string | null;
  lastMessageText?: string;
  lastMessageAt?: number;
  lastMessageSenderId?: string;
  lastReadAt?: { [userId: string]: number };
};

export type ParticipantProfile = {
  id: string;
  username: string;
  handle: string;
  photoURL?: string | null;
};