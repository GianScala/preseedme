"use client";

import { useEffect, useRef } from "react";
import type { Message, ParticipantProfile } from "@/types";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: Message[];
  participants: Record<string, ParticipantProfile>;
  currentUserId: string;
  loading: boolean;
  error: string | null;
};

function formatMessageTime(timestampMs: number) {
  const date = new Date(timestampMs);
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList({
  messages,
  participants,
  currentUserId,
  loading,
  error,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;

    // Check if user is near bottom (within 150px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150;

    if (isNewMessage && (isNearBottom || prevMessagesLengthRef.current === 0)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
          <span className="text-sm">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-neutral-300 font-medium mb-1">No messages yet</p>
          <p className="text-sm text-neutral-500">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{
        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
      }}
    >
      <div className="px-3 sm:px-4 py-4 space-y-3 sm:space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId;
          const participant = participants[msg.senderId];

          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showSenderLabel =
            !isOwn &&
            (!prevMessage || prevMessage.senderId !== msg.senderId);

          const senderLabel = !isOwn
            ? participant?.username || "Unknown"
            : "You";

          const timeLabel = formatMessageTime(msg.createdAt);

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showSenderLabel={showSenderLabel}
              senderLabel={senderLabel}
              timeLabel={timeLabel}
            />
          );
        })}

        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}
