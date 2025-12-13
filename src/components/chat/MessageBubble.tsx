"use client";

import type { Message } from "@/types";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  showSenderLabel: boolean;
  senderLabel?: string;
  timeLabel: string;
  isRead?: boolean; // Add this
};

export function MessageBubble({
  message,
  isOwn,
  showSenderLabel,
  senderLabel,
  timeLabel,
  isRead = false, // Default false
}: MessageBubbleProps) {
  return (
    <div className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[70%] ${
      isOwn ? "ml-auto items-end" : "mr-auto items-start"
    }`}>
      {showSenderLabel && !isOwn && senderLabel && (
        <span className="text-[11px] sm:text-xs text-neutral-500 px-1">
          {senderLabel}
        </span>
      )}
      <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
        isOwn
          ? "bg-[var(--brand)] text-black font-medium rounded-br-md"
          : "bg-neutral-900 text-neutral-100 rounded-bl-md border border-neutral-800"
      }`}>
        {message.text}
      </div>
      
      <div className={`flex items-center gap-1 px-1 ${isOwn ? "justify-end" : ""}`}>
        <span className="text-[11px] sm:text-xs text-neutral-500">
          {timeLabel}
        </span>
        
        {/* Read receipts - only for own messages */}
        {isOwn && (
          <span className="text-[11px]">
            {isRead ? (
              // Double check - read
              <span className="text-neutral-400">✓✓</span>
            ) : (
              // Single check - delivered
              <span className="text-neutral-600">✓</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}