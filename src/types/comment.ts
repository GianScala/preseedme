// src/types/comment.ts
export type Comment = {
    id: string;
    ideaId: string;
    userId: string;
    username: string;
    userHandle: string;
    userPhotoURL?: string | null;
    text: string;
    createdAt: number;
    parentId: string | null;
    threadOwnerId: string; // NEW: ID of user who owns the root comment in this thread
    isEdited?: boolean;
    updatedAt?: number;
  };