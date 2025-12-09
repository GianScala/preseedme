"use client";

type ChatInputProps = {
  text: string;
  setText: (text: string) => void;
  onSend: (e: React.FormEvent) => void;
  disabled: boolean;
};

export function ChatInput({ text, setText, onSend, disabled }: ChatInputProps) {
  return (
    <form onSubmit={onSend} className="flex gap-2 sm:gap-3">
      <input
        className="flex-1 rounded-lg px-3 sm:px-4 py-1 sm:py-3 border border-neutral-700 text-sm focus:border-brand focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-black/40 placeholder:text-neutral-500"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Type a message"
      />
      <button
        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-brand text-black text-sm font-semibold hover:bg-brand-light transition-all shadow-lg shadow-[var(--brand)]/20 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        type="submit"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  );
}
