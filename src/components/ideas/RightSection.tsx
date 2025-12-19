"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { MessageSquare, Share2, ChevronDown } from "lucide-react";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import { getFirebaseDb } from "@/lib/firebase";

// Modular Sub-components
import IdeaThumbnail from "./sidebar/IdeaThumbnail";
import SidebarPublisher from "./sidebar/SidebarPublisher";
import UpvoteButton from "./sidebar/UpvoteButton";
import SidebarFundraising from "./sidebar/SidebarFundraising";
import { IdeaMetaChips } from "./sidebar/IdeaMetaChips";
import CommentsSection from "./sidebar/CommentsSection";

interface RightSectionProps {
  idea: IdeaWithLikes;
  user?: any;
  onToggleLike?: () => void;
  likeLoading?: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
}

export default function RightSection({
  idea,
  user,
  onToggleLike,
  likeLoading,
  onAuthTrigger,
  isOwner,
}: RightSectionProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (!idea.founderId) return;
    getDoc(doc(getFirebaseDb(), "users", idea.founderId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAvatarUrl(data?.photoURL ?? data?.avatarUrl ?? null);
      }
    });
  }, [idea.founderId]);

  // ✅ Canonical share link (ALWAYS https + your domain)
  const SHARE_URL = `https://www.preseedme.com/ideas/${idea.id}`;

  const handleShare = async () => {
    try {
      // Native share (mobile, modern browsers)
      if (navigator.share) {
        await navigator.share({
          title: idea.title ?? "Startup Idea",
          url: SHARE_URL,
        });
        return;
      }

      // Clipboard fallback
      await navigator.clipboard.writeText(SHARE_URL);
      alert("Link copied to clipboard!");
    } catch (err) {
      // Last-resort fallback
      window.prompt("Copy this link:", SHARE_URL);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto no-scrollbar pb-10">
      {/* 1. Media with Created/Updated overlays */}
      <IdeaThumbnail idea={idea} />

      {/* 2. Publisher Section */}
      <SidebarPublisher idea={idea} avatarUrl={avatarUrl} />

      {/* 3. Primary Action */}
      <UpvoteButton
        idea={idea}
        user={user}
        onToggleLike={onToggleLike}
        likeLoading={likeLoading}
      />

      {/* 4. Fundraising Tracker */}
      {idea.isFundraising && <SidebarFundraising idea={idea} />}

      {/* 5. Discussion Section */}
      <div className="pt-2">
        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="group flex items-center justify-between w-full mb-4 px-1 rounded-lg hover:bg-neutral-900/30 py-2 -mx-1 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand group-hover:scale-110 transition-transform duration-200" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-wider">
              Community Discussion
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-all duration-300 ease-out group-hover:text-brand ${
              commentsOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            commentsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <CommentsSection
              ideaId={idea.id}
              ideaTitle={idea.title}
              ideaOwnerId={idea.founderId}
              user={user}
              isIdeaOwner={isOwner ?? false}
              onAuthTrigger={onAuthTrigger || (() => {})}
            />
          </div>
        </div>
      </div>

      {/* 6. Metadata / Tags */}
      <div className="bg-gradient-to-br from-neutral-950/20 via-neutral-900/20 to-neutral-900 border border-neutral-800 p-4 rounded-2xl">
        <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-3">
          TAGS
        </p>
        <IdeaMetaChips idea={idea} />
      </div>

      {/* 7. Share Action */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-gradient-to-br from-neutral-950/20 via-neutral-900/20 to-neutral-900 border border-neutral-700 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors"
      >
        <Share2 size={13} /> Share Startup
      </button>
    </div>
  );
}
