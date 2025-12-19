// src/types/messaging.ts

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