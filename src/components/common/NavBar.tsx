// src/components/common/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    if (!aboutOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [aboutOpen]);

  // Unread messages - fixed cleanup
  useEffect(() => {
    if (!mounted || !user) {
      setUnreadCount(0);
      return;
    }

    let unsub: Unsubscribe | null = null;
    const timer = setTimeout(() => {
      const db = getFirebaseDb();
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageAt", "desc")
      );

      unsub = onSnapshot(q, (snap) => {
        let count = 0;
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.lastMessageSenderId && data.lastMessageSenderId !== user.uid) {
            const lastMsg = data.lastMessageAt?.toMillis?.() ?? 0;
            const lastRead = data.lastReadAt?.[user.uid]?.toMillis?.() ?? 0;
            if (lastRead < lastMsg) count++;
          }
        });
        setUnreadCount(count);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      unsub?.();
    };
  }, [user, mounted]);

  // Close mobile menu on route change / escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeDropdown = useCallback(() => setAboutOpen(false), []);

  if (!mounted) return <NavbarSkeleton />;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled || mobileMenuOpen
          ? "bg-black/80 backdrop-blur-xl border-white/10 shadow-lg"
          : "bg-transparent border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl tracking-tight text-white hover:opacity-90">
            Preseed<span className="text-[var(--brand)]">Me</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/ideas">Find Projects</NavLink>

            {user && (
              <>
                <NavLink href="/ideas/new">Create Pitch</NavLink>
                <Link href="/chat" className="relative text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                  Messages
                  <UnreadBadge count={unreadCount} />
                </Link>
              </>
            )}

            {/* About Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAboutOpen((o) => !o)}
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                className="text-sm font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                About
                <ChevronIcon open={aboutOpen} />
              </button>

              {aboutOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900/90 backdrop-blur border border-white/10 rounded-lg shadow-xl py-1">
                  <DropdownLink href="/about" onClick={closeDropdown}>About Us</DropdownLink>
                  <DropdownLink href="/mission" onClick={closeDropdown}>Our Mission</DropdownLink>
                  <DropdownLink href="/how-it-works" onClick={closeDropdown}>How it Works</DropdownLink>
                </div>
              )}
            </div>

            {/* Auth Section */}
            <div className="pl-4 border-l border-white/10 ml-2">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : user ? (
                <Link href="/profile" className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 transition-all group">
                  <ProfileImage profile={profile} />
                  <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                    {profile?.username || "Account"}
                  </span>
                </Link>
              ) : (
                <Link href="/auth" className="px-5 py-2 text-sm font-bold rounded-full bg-white text-black hover:bg-[var(--brand)] hover:scale-105 transition-all shadow-lg">
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
            className="md:hidden p-2 text-neutral-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <HamburgerIcon open={mobileMenuOpen} />
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 pb-6 space-y-2 border-t border-white/10 mt-2">
            <MobileNavLink href="/ideas" onClick={closeMobileMenu}>Find Projects</MobileNavLink>

            {user && (
              <>
                <MobileNavLink href="/ideas/new" onClick={closeMobileMenu}>Create Pitch</MobileNavLink>
                <Link
                  href="/chat"
                  className="flex items-center justify-between px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                >
                  <span>Messages</span>
                  <UnreadBadge count={unreadCount} mobile />
                </Link>
              </>
            )}

            <Divider />
            <MobileNavLink href="/about" onClick={closeMobileMenu}>About Us</MobileNavLink>
            <MobileNavLink href="/mission" onClick={closeMobileMenu}>Our Mission</MobileNavLink>
            <MobileNavLink href="/how-it-works" onClick={closeMobileMenu}>How it Works</MobileNavLink>
            <Divider />

            <div className="pt-2">
              {loading ? (
                <div className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse mx-auto" />
                </div>
              ) : user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group"
                  onClick={closeMobileMenu}
                >
                  <ProfileImage profile={profile} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{profile?.username || "My Profile"}</p>
                    <p className="text-neutral-400 text-xs truncate">{user.email}</p>
                  </div>
                  <ChevronRightIcon />
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="block text-center px-4 py-3 mx-2 text-sm font-bold rounded-lg bg-[var(--brand)] text-black hover:brightness-110 transition-all"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

// --- Sub-components ---

function NavbarSkeleton() {
  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="font-bold text-xl tracking-tight text-white">
            Preseed<span className="text-[var(--brand)]">Me</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="pl-4 border-l border-white/10 ml-2">
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="md:hidden w-6 h-6 bg-white/10 rounded animate-pulse" />
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-neutral-400 hover:text-[var(--brand-light)] transition-colors">
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
      {children}
    </Link>
  );
}

function DropdownLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white">
      {children}
    </Link>
  );
}

function ProfileImage({ profile }: { profile: any }) {
  if (profile?.photoURL) {
    return (
      <Image
        src={profile.photoURL}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--brand)] transition-all"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center font-bold text-black text-sm">
      {profile?.username?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

function UnreadBadge({ count, mobile }: { count: number; mobile?: boolean }) {
  if (count <= 0) return null;
  const display = count > 9 ? "9+" : count;
  return mobile ? (
    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand)] text-black text-xs font-bold">
      {display}
    </span>
  ) : (
    <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand)] text-black text-[10px] font-bold shadow-[0_0_10px_rgba(33,221,192,0.5)]">
      {display}
    </span>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-6 h-5 flex flex-col justify-between">
      <span className={`block h-0.5 bg-current transition-all origin-center ${open ? "rotate-45 translate-y-[9px]" : ""}`} />
      <span className={`block h-0.5 bg-current transition-all ${open ? "opacity-0 scale-0" : ""}`} />
      <span className={`block h-0.5 bg-current transition-all origin-center ${open ? "-rotate-45 -translate-y-[9px]" : ""}`} />
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5 text-neutral-500 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Divider() {
  return <div className="w-full h-px bg-white/5 my-2" />;
}