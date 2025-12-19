// src/types/user.ts

export type UserProfile = {
    id: string;
    email: string | null;
    handle: string | null;
    username: string;
    createdAt: number;
    photoURL?: string | null;
    preferredPhoneNumber?: string | null;
    address?: string | null;
    bio?: string | null;
    location?: string | null;
    role?: "founder" | "investor" | "both";
    // --- ideas data ---
    publishedIdeaIds: string[];
    likedIdeaIds?: string[];
    // --- social links ---
    xUrl: string | null | undefined;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
    githubUrl?: string | null;
  };
  
  export type ParticipantProfile = {
    id: string;
    username: string;
    handle: string;
    photoURL?: string | null;
  };