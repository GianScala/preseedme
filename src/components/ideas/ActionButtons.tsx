// src/components/ideas/ActionButtons.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc, arrayRemove } from "firebase/firestore";
import type { IdeaWithLikes } from "@/app/ideas/[id]/page";
import SignInModal from "@/components/common/modal/SignInModal";
import { MessageCircle, Trash2, Info, CheckCircle2, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  idea: IdeaWithLikes;
  user: any; // Ideally this should be your User type
  isOwner: boolean;
  setError: (error: string) => void;
}

export default function ActionButtons({
  idea,
  user,
  isOwner,
  setError,
}: ActionButtonsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleContactFounder = useCallback(() => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }

    if (!idea?.founderId) return;

    // Deterministic conversation ID creation
    const sorted = [user.uid, idea.founderId].sort();
    const conversationId = `${sorted[0]}_${sorted[1]}`;
    router.push(`/chat/${conversationId}?ideaId=${idea.id}`);
  }, [user, idea, router]);

  const handleDelete = useCallback(async () => {
    if (!user || !idea) return;
    
    // In a real app, a custom Modal is better than window.confirm, 
    // but we'll stick to this for simplicity as per request.
    if (!window.confirm("Are you sure you want to delete this idea? This action cannot be undone.")) return;

    setDeleting(true);
    setError("");

    try {
      const db = getFirebaseDb();
      
      // Parallelize operations for speed
      await Promise.all([
        deleteDoc(doc(db, "ideas", idea.id)),
        updateDoc(doc(db, "users", user.uid), {
          publishedIdeaIds: arrayRemove(idea.id),
        })
      ]);

      router.push("/ideas");
    } catch (err) {
      console.error("Error deleting idea:", err);
      setError(err instanceof Error ? err.message : "Failed to delete idea");
      setDeleting(false);
    }
  }, [user, idea, router, setError]);

  return (
    <>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <div className="mt-8 pt-6 border-t border-neutral-800/60">
        {!isOwner ? (
          /* ---------------- NOT OWNER VIEW ---------------- */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <div className="p-1.5 rounded-full bg-neutral-800/50">
                <Info className="w-4 h-4 text-neutral-400" />
              </div>
              <span>Interested in learning more or investing?</span>
            </div>

            <button
              onClick={handleContactFounder}
              className="
                group relative w-full sm:w-auto
                inline-flex items-center justify-center gap-2.5
                px-6 py-3 sm:py-2.5 rounded-xl
                bg-gradient-to-br from-brand to-brand-dark
                text-white font-bold text-sm sm:text-base
                shadow-lg shadow-brand/20
                hover:shadow-brand/40 hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                overflow-hidden
              "
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]" />
              
              <MessageCircle className="w-5 h-5" />
              <span>Contact Founder</span>
            </button>
          </div>
        ) : (
          /* ---------------- OWNER VIEW ---------------- */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/20 p-4 rounded-xl border border-neutral-800/30">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-neutral-300 font-medium">
                You are the owner of this idea
              </span>
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="
                w-full sm:w-auto
                inline-flex items-center justify-center gap-2
                px-5 py-2.5 rounded-lg
                bg-red-500/5 border border-red-500/20
                text-red-400 text-sm font-semibold
                hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300
                active:scale-[0.98]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Idea</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}