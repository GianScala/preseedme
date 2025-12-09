// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    // Backdrop blur per fondersi con lo sfondo animato
    <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-md mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-semibold text-neutral-200">
              Preseed<span className="text-[var(--brand)]">Me</span>
            </span>
            <span className="text-xs text-neutral-500">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-500">
             {/* Esempio di link footer se servono */}
             <Link href="/privacy" className="hover:text-[var(--brand)] transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-[var(--brand)] transition-colors">Terms</Link>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs font-medium text-neutral-400">
              Indie founders <span className="text-[var(--brand)]">×</span> micro-investors
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">
              Made by founders backing founders
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}