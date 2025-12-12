export type UserProfile = {
  id: string;
  email: string | null;
  username: string;
  handle: string | null;
  photoURL?: string | null;
  createdAt: number;

  publishedIdeaIds: string[];
  likedIdeaIds?: string[];

  // Contact details
  preferredPhoneNumber?: string | null;
  address?: string | null;

  // Profile details
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

  // Likes
  likeCount?: number;
  likedByUserIds?: string[];

  // Links & media
  websiteUrl?: string;
  demoVideoUrl?: string;
  thumbnailUrl?: string;

  // Primary categorization
  category?: string; // Main category/niche (e.g., "AI", "SaaS", "E-commerce")
  tags?: string[]; // Array of searchable tags (e.g., ["productivity", "automation", "b2b"])

  // Tag-style fields (kept for backwards compatibility)
  sector?: string; // Primary sector (singular)
  sectors?: string[]; // Multiple sectors (array)
  targetAudience?: string; // Primary target audience (singular)
  targetAudiences?: string[]; // Multiple target audiences (array)
  targetDemographics?: string[];
  revenueModels?: string[];

  // Business metrics
  foundedYear?: number;
  totalRevenueSinceInception?: number;
  monthlyRecurringRevenue?: number;
  userCount?: number;
  targetMarket?: string;

  // 🧠 Why this team will win
  teamBackground?: string;
  teamWhyYouWillWin?: string;
  industryInsights?: string;
  valuePropositionDetail?: string;

  // 📦 Deliverables (NEW)
  deliverablesOverview?: string;
  deliverablesMilestones?: string;

  // 💸 Fundraising
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

