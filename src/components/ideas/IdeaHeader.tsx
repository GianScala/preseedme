"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { IdeaWithLikes } from "@/app/(app)/ideas/[id]/page";

interface AuthUser {
  uid: string;
  [key: string]: any;
}

interface IdeaHeaderProps {
  idea: IdeaWithLikes;
  user: AuthUser | null;
  isOwner: boolean;
  onToggleLike: () => void;
  likeLoading: boolean;
}

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800"
  >
    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
    <span>Back</span>
  </button>
);

export default function IdeaHeader({
  idea,
  user,
  isOwner,
  onToggleLike,
  likeLoading,
}: IdeaHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Top Nav - Desktop Only */}
      <div className="hidden sm:flex justify-between items-center">
        <div className="flex gap-2">
          {/* Optional: Breadcrumbs could go here */}
        </div>
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Header Content */}
      <div className="space-y-4 lg:space-y-6">
        {/* Mobile: Title + Back Button */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <h1 className="flex-1 text-2xl font-bold text-white leading-tight">
            {idea.title}
          </h1>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/70 text-neutral-300 hover:text-white w-9 h-9 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop: Title */}
        <h1 className="hidden sm:block text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
          {idea.title}
        </h1>

        {/* One-liner */}
        <p className="text-sm sm:text-lg text-neutral-300 leading-relaxed">
          {idea.oneLiner}
        </p>
      </div>
    </div>
  );
}