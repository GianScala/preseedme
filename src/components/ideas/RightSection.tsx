"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { MessageSquare, Share2, ChevronDown, Lock } from "lucide-react";
import type { IdeaWithLikes } from "@/app/(app)/ideas/[id]/page";
import { getFirebaseDb } from "@/lib/firebase";

// Modular Sub-components
import IdeaThumbnail from "./sidebar/IdeaThumbnail";
import SidebarPublisher from "./sidebar/SidebarPublisher";
import UpvoteButton from "./sidebar/UpvoteButton";
import SidebarFundraising from "./sidebar/SidebarFundraising";
import { IdeaMetaChips } from "./sidebar/IdeaMetaChips";
import CommentsSection from "./sidebar/CommentsSection";

// Modal
import ShareModal from "@/components/common/modal/ShareModal"; // <-- Adjust path to your modals folder

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
  const [shareModalOpen, setShareModalOpen] = useState(false); // <-- NEW

  useEffect(() => {
    if (!idea.founderId) return;
    getDoc(doc(getFirebaseDb(), "users", idea.founderId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAvatarUrl(data?.photoURL ?? data?.avatarUrl ?? null);
      }
    });
  }, [idea.founderId]);

  return (
    <>
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

        {/* 4. Fundraising Tracker - Compact blur if not signed in */}
        {idea.isFundraising && (
          user ? (
            <SidebarFundraising idea={idea} />
          ) : (
            <div
              onClick={onAuthTrigger}
              className="relative group cursor-pointer overflow-hidden rounded-2xl border border-neutral-800"
              style={{ 
                maxHeight: '100px',
                minHeight: '100px'
              }}
            >
              <div className="absolute inset-0 blur-md select-none pointer-events-none opacity-30 scale-75">
                <SidebarFundraising idea={idea} />
              </div>
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-neutral-950/80 via-neutral-900/90 to-neutral-950/80 backdrop-blur-sm">
                <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-brand/50">
                  <Lock className="w-3.5 h-3.5 text-brand" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Login</span>
                </div>
              </div>
            </div>
          )
        )}

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

        {/* 7. Share Action - NOW OPENS MODAL */}
        <button
          onClick={() => setShareModalOpen(true)}
          className="w-full py-3 bg-gradient-to-br from-neutral-950/20 via-neutral-900/20 to-neutral-900 border border-neutral-700 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors"
        >
          <Share2 size={13} /> Share Startup
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ideaTitle={idea.title ?? "Startup Idea"}
        ideaId={idea.id}
        description={idea.description?.slice(0, 100)}
      />
    </>
  );
}