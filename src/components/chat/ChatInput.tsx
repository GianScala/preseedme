"use client";

import React, { useEffect, useRef } from "react";

type ChatInputProps = {
  text: string;
  setText: (text: string) => void;
  onSend: (e: React.FormEvent) => void;
  disabled: boolean;
};

export function ChatInput({ text, setText, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_LINES = 3;

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height so scrollHeight is measured correctly
    el.style.height = "auto";

    const computed = window.getComputedStyle(el);
    const lineHeight =
      parseFloat(computed.lineHeight || computed.fontSize || "20");
    const maxHeight = lineHeight * MAX_LINES;

    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    adjustTextareaHeight();

    // Optional: re-adjust on orientation / viewport change
    const handleResize = () => adjustTextareaHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim()) return;
    onSend(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (disabled || !text.trim()) return;
      onSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full items-end rounded-xl border border-neutral-700 bg-black/10 px-4 py-2 shadow-sm focus-within:border-brand focus-within:ring-1 focus-within:ring-amber-500/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          aria-label="Type a message"
          enterKeyHint="send"
          inputMode="text"
          // IMPORTANT: text-base on mobile (~16px) prevents iOS Safari auto-zoom
          className="max-h-32 w-full resize-none bg-transparent pr-10 text-base md:text-sm text-white placeholder:text-neutral-500 outline-none leading-[1.4rem] pt-1.5 pb-1.5"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-black shadow-lg shadow-[var(--brand)]/30 hover:bg-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {/* Paper-plane icon */}
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M4 20L20 12L4 4L4 10L14 12L4 14L4 20Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
