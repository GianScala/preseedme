"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  Link2,
  Check,
  Twitter, // X icon
  Linkedin,
  Facebook,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaTitle: string;
  ideaId: string;
  description?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  ideaTitle,
  ideaId,
}: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Base URL for this startup
  const shareUrl = `https://www.preseedme.com/ideas/${ideaId}`;

  // Unified message you asked for
  const shareMessage = `Check out this amazing startup on PreSeedMe: ${shareUrl}`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(shareMessage);

  const socialLinks = useMemo(
    () => [
      {
        name: "X",
        icon: Twitter,
        // X supports prefilling the message
        href: `https://x.com/intent/tweet?text=${encodedMessage}`,
        hoverClass:
          "hover:bg-[#000000]/20 hover:border-[#000000]/50 hover:text-[#000000]",
      },
      {
        name: "LinkedIn",
        icon: Linkedin,
        // LinkedIn mainly takes the URL; the page's OG tags will control preview text
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        hoverClass:
          "hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/50 hover:text-[#0A66C2]",
      },
      {
        name: "Facebook",
        icon: Facebook,
        // Facebook also mostly uses the URL & OG tags
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        hoverClass:
          "hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:text-[#1877F2]",
      },
    ],
    [encodedUrl, encodedMessage]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
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

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareUrl]);

  const handleSocialClick = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-white/10 hover:text-white"
          aria-label="Close share modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/10 mx-auto">
          <Share2 className="h-6 w-6 text-[var(--brand)]" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-white">Share this Startup</h3>
          <p className="mt-2 text-sm text-neutral-400 line-clamp-2">
            {ideaTitle}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {shareMessage}
          </p>
        </div>

        {/* Copy Link Section */}
        <div className="mt-6 mb-8">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <Link2 className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <span className="text-xs text-neutral-400 truncate font-mono">
                {shareUrl}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                copied
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-[var(--brand)] text-black hover:opacity-90"
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-3 gap-4">
          {socialLinks.map((social) => (
            <button
              key={social.name}
              onClick={() => handleSocialClick(social.href)}
              className={`group flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl transition-all active:scale-95 ${social.hoverClass}`}
              title={`Share on ${social.name}`}
            >
              <social.icon className="w-8 h-8 text-neutral-400 group-hover:text-current transition-colors" />
              <span className="text-xs text-neutral-500 font-bold group-hover:text-current transition-colors">
                {social.name}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-[10px] text-neutral-600 text-center">
          Help founders get discovered by sharing great ideas ✨
        </p>
      </div>
    </div>,
    document.body
  );
}
