"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Megaphone, Clock } from "lucide-react";

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
  bookedDates: string[]; // YYYY-MM-DD strings
  onCheckout: (selectedDates: string[], totalAmount: number, ideaId: string) => void;
}

export default function AdvertiseModal({
  isOpen,
  onClose,
  ideaId,
  ideaTitle,
  bookedDates,
  onCheckout,
}: AdvertiseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative flex h-full max-h-[600px] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl">
        {/* LEFT: Info */}
        <div className="hidden w-[40%] flex-col border-r border-white/10 bg-black/20 p-8 md:flex">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Megaphone className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Feature Your Startup
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Reserve days to appear at the top of the leaderboard.
            </p>

            {ideaTitle && (
              <p className="mt-4 text-xs font-semibold text-[var(--brand)]/80">
                Featuring:{" "}
                <span className="text-[var(--brand)]">
                  {ideaTitle}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-4 text-sm text-neutral-300">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-neutral-500" />
              <span>Coming soon...</span>
            </div>
          </div>

          <div className="mt-auto rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">
              Coming Soon
            </div>
            <div className="text-sm text-neutral-400">
              The advertisement feature will be available in the near future.
            </div>
          </div>
        </div>

        {/* RIGHT: Coming Soon Message */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-neutral-400">
              The advertisement feature is currently under development
            </p>
          </div>

          {/* Main Message */}
          <div className="max-w-md text-center space-y-6">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-3">
                Stay Tuned!
              </h4>
              <p className="text-neutral-300 mb-4">
                We're working on an exciting advertising feature that will allow you to 
                feature your startup at the top of the leaderboard for selected dates.
              </p>
              <div className="space-y-2 text-sm text-neutral-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand)]"></div>
                  <span>Select specific dates for maximum visibility</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand)]"></div>
                  <span>Reach more users with featured placement</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand)]"></div>
                  <span>Simple and transparent pricing</span>
                </div>
              </div>
            </div>

            {/* Mobile idea label */}
            {ideaTitle && (
              <div className="rounded-lg bg-black/30 p-4 border border-white/5 md:hidden">
                <p className="text-xs font-semibold text-[var(--brand)]/80 mb-1">
                  Ready for featuring:
                </p>
                <p className="text-sm text-[var(--brand)]">
                  {ideaTitle}
                </p>
              </div>
            )}
          </div>

          {/* Bottom message */}
          <div className="mt-8 pt-6 border-t border-white/10 w-full max-w-md">
            <p className="text-center text-sm text-neutral-500">
              We'll notify you when this feature becomes available
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}