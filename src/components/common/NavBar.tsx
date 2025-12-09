// src/components/common/NavBar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Effect to detect scroll for better styling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for unread messages
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const db = getFirebaseDb();
    const convRef = collection(db, "conversations");

    const q = query(
      convRef,
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.lastMessageAt && data.lastMessageSenderId) {
          if (data.lastMessageSenderId === user.uid) return;
          const lastMessageTime = data.lastMessageAt?.toMillis?.() ?? 0;
          const lastReadTime = data.lastReadAt?.[user.uid]?.toMillis?.() ?? 0;
          if (lastReadTime === 0 || lastReadTime < lastMessageTime) {
            count++;
          }
        }
      });
      setUnreadCount(count);
    });

    return () => unsub();
  }, [user]);



  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled || mobileMenuOpen
          ? "bg-black/60 backdrop-blur-xl border-white/10 shadow-lg"
          : "bg-transparent border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 font-bold text-xl tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span>
              Preseed<span className="text-[var(--brand)]">Me</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/ideas">Find Projects</NavLink>
            {user && (
              <>
                <NavLink href="/ideas/new">Create Pitch</NavLink>
                <Link
                  href="/chat"
                  className="relative text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand)] text-black text-[10px] font-bold shadow-[0_0_10px_rgba(33,221,192,0.5)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <NavLink href="/about">About</NavLink>

            {/* Auth Section */}
            <div className="pl-4 border-l border-white/10 ml-2">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 p-1 pr-3 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group"
                >
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[var(--brand)] transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-xs font-bold text-black shadow-lg">
                      {profile?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                    {profile?.username || "Account"}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="px-5 py-2 text-sm font-bold rounded-full bg-white text-black hover:bg-[var(--brand)] hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(33,221,192,0.4)]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 bg-current transition-all ${
                  mobileMenuOpen ? "w-6 rotate-45 translate-y-2" : "w-6"
                }`}
              />
              <span
                className={`block h-0.5 bg-current transition-all ${
                  mobileMenuOpen ? "opacity-0" : "w-4"
                }`}
              />
              <span
                className={`block h-0.5 bg-current transition-all ${
                  mobileMenuOpen ? "w-6 -rotate-45 -translate-y-2" : "w-6"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 pb-6 space-y-2 border-t border-white/10 mt-2">
            <MobileNavLink href="/ideas" onClick={() => setMobileMenuOpen(false)}>
              Find Projects
            </MobileNavLink>
            <MobileNavLink href="/about" onClick={() => setMobileMenuOpen(false)}>
              About
            </MobileNavLink>

            {user && (
              <>
                <MobileNavLink href="/ideas/new" onClick={() => setMobileMenuOpen(false)}>
                  Create Pitch
                </MobileNavLink>
                <Link
                  href="/chat"
                  className="flex items-center justify-between px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--brand)] text-black text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="pt-4 mt-2 border-t border-white/5">
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-black font-bold">
                    {profile?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-neutral-200">My Profile</span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="block w-full text-center px-4 py-3 text-sm font-bold rounded-lg bg-[var(--brand)] text-black mt-2"
                  onClick={() => setMobileMenuOpen(false)}
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

// Helper Components
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-neutral-400 hover:text-[var(--brand-light)] transition-colors duration-200"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}