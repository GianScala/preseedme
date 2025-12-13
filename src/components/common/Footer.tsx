// src/components/Footer.tsx
import Link from "next/link";
import {XIcon} from "@/components/icons/XIcon";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-neutral/10 backdrop-blur-md mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-semibold text-neutral-200">
              Preseed<span className="text-[var(--brand)]">Me</span>
            </span>
            <span className="text-xs text-neutral-500">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          {/* Links (simple, wrap on mobile) */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <Link href="/how-it-works" className="hover:text-[var(--brand)] transition-colors">
              How it works
            </Link>
            <Link href="/mission" className="hover:text-[var(--brand)] transition-colors">
              Our mission
            </Link>
            <Link href="/privacy" className="hover:text-[var(--brand)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--brand)] transition-colors">
              Terms
            </Link>

            {/* Follow us (X) */}
            <a
              href="https://x.com/preseedme"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X"
              className="inline-flex items-center gap-2 hover:text-[var(--brand)] transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Tagline */}
          <div className="text-center md:text-right">
            <p className="text-xs font-medium text-neutral-400">
              early founders <span className="text-[var(--brand)]">·</span> micro-investors
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
