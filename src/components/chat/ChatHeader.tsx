"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParticipantProfile } from "@/types/index";

type ChatHeaderProps = {
  otherUser: ParticipantProfile | null;
  ideaId: string | null;
  onBack: () => void;
};

export function ChatHeader({ otherUser, ideaId, onBack }: ChatHeaderProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const avatarInitial =
    otherUser?.username?.[0]?.toUpperCase() ||
    otherUser?.handle?.[0]?.toUpperCase() ||
    "?";

  const goToProfile = () => {
    if (!otherUser) return;
    router.push(`/profile/${otherUser.id}`);
  };

  const handleImageError = () => {
    console.log("Failed to load profile image for:", otherUser?.username);
    setImageError(true);
  };

  // Show avatar initials if: no photoURL, OR photoURL failed to load
  const shouldShowInitials = !otherUser?.photoURL || imageError;

  return (
    <div className="flex items-center gap-3 sm:gap-4 pb-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="p-2 rounded-lg hover:bg-neutral-800 transition-colors flex-shrink-0"
        aria-label="Go back"
        type="button"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Avatar */}
      {shouldShowInitials ? (
        <div
          onClick={goToProfile}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-sm sm:text-base font-bold text-black flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              goToProfile();
            }
          }}
        >
          {avatarInitial}
        </div>
      ) : (
        <img
          src={otherUser.photoURL!}
          alt={`${otherUser.username}'s profile picture`}
          onClick={goToProfile}
          onError={handleImageError}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-neutral-700 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          loading="lazy"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              goToProfile();
            }
          }}
        />
      )}

      {/* User Info */}
      <div
        onClick={goToProfile}
        className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            goToProfile();
          }
        }}
      >
        <h1 className="text-lg sm:text-2xl font-bold truncate">
          {otherUser?.username ?? "Conversation"}
        </h1>
        {otherUser?.handle && (
          <p className="text-xs sm:text-sm text-neutral-500 truncate">
            @{otherUser.handle}
          </p>
        )}
        {ideaId && (
          <p className="text-xs text-neutral-600 mt-1 truncate">
            Regarding idea: <span className="font-mono">{ideaId}</span>
          </p>
        )}
      </div>
    </div>
  );
}