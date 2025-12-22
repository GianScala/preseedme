// components/modals/SuccessModal.tsx
"use client";

import { useEffect } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-brand to-brand-dark flex items-center justify-center">
              <svg
                className="w-10 h-10 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-brand/30 animate-ping" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Idea Published Successfully! 🎉
          </h2>
          <p className="text-neutral-400 leading-relaxed">
            Great! Your idea has been successfully published. If you want to
            edit it later, just go to your profile, select{" "}
            <span className="text-brand font-semibold">Your Ideas</span>, and
            you can edit from there.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-black text-sm font-bold hover:shadow-lg hover:shadow-brand/30 transition-all"
        >
          View All Ideas
        </button>
      </div>
    </div>
  );
}