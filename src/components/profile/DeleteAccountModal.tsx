import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { performAccountArchivalAndCleanup } from "@/lib/accountUtils";
import { StatusState } from "@/app/profile/utils/types";

type DeleteAccountModalProps = {
  onClose: () => void;
  ideasCount: number;
  user: any;
  setStatus: (status: StatusState) => void;
};

export default function DeleteAccountModal({
  onClose,
  ideasCount,
  user,
  setStatus,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAccountDeletion = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      await performAccountArchivalAndCleanup(user.uid);
      await user.delete();
      router.push("/");
    } catch (error: any) {
      console.error("Deletion Error:", error);
      setIsDeleting(false);
      onClose();

      if (error.code === "auth/requires-recent-login") {
        setStatus({
          type: "error",
          message:
            "Security check: Please log out and log back in to delete your account.",
        });
      } else {
        setStatus({
          type: "error",
          message: "Failed to delete account. Please try again.",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-red-900/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Delete Account?</h3>
            <p className="text-neutral-400 text-sm mt-1">
              This action cannot be undone. Your projects will be taken offline
              and archived.
            </p>
          </div>
        </div>

        <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/30 mb-6">
          <ul className="text-xs text-red-200/80 space-y-2 list-disc pl-4">
            <li>Your profile will be deleted.</li>
            <li>Your {ideasCount} published project(s) will be archived.</li>
            <li>All your likes will be removed from other projects.</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleAccountDeletion}
            disabled={isDeleting}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Yes, Delete It"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}