// src/components/common/NavBar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Dropdown state for Desktop
  const [aboutOpen, setAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mount effect - prevents hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click Outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unread Messages Logic - DEFERRED (only load after mount and if user exists)
  useEffect(() => {
    if (!mounted || !user) { 
      setUnreadCount(0); 
      return; 
    }
    
    // Add a small delay to defer this non-critical feature
    const timer = setTimeout(() => {
      const db = getFirebaseDb();
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageAt", "desc")
      );
      
      const unsub = onSnapshot(q, (snap) => {
        let count = 0;
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.lastMessageSenderId && data.lastMessageSenderId !== user.uid) {
            const lastMsg = data.lastMessageAt?.toMillis?.() ?? 0;
            const lastRead = data.lastReadAt?.[user.uid]?.toMillis?.() ?? 0;
            if (lastRead < lastMsg) count++;
          }
        });
        setUnreadCount(count);
      });
      
      return () => unsub();
    }, 500); // Defer by 500ms
    
    return () => clearTimeout(timer);
  }, [user, mounted]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <NavbarSkeleton />;
  }

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
          
          {/* LOGO */}
          <Link href="/" className="font-bold text-xl tracking-tight text-white hover:opacity-90">
            Preseed<span className="text-[var(--brand)]">Me</span>
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex items-center gap-8">
            {/* 1. Find Projects */}
            <NavLink href="/ideas">Find Projects</NavLink>
            
            {/* 2. Create & Messages (If User) */}
            {user && (
              <>
                <NavLink href="/ideas/new">Create Pitch</NavLink>
                <Link href="/chat" className="relative text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand)] text-black text-[10px] font-bold shadow-[0_0_10px_rgba(33,221,192,0.5)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* 3. About Section (Right before profile) */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setAboutOpen(!aboutOpen)}
                className="text-sm font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                About
                <svg className={`w-3 h-3 transition-transform ${aboutOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {aboutOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900/60 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1">
                  <Link href="/about" className="block px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white" onClick={() => setAboutOpen(false)}>About Us</Link>
                  <Link href="/mission" className="block px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white" onClick={() => setAboutOpen(false)}>Our Mission</Link>
                  <Link href="/how-it-works" className="block px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white" onClick={() => setAboutOpen(false)}>How it Works</Link>
                </div>
              )}
            </div>

            {/* 4. Profile/Auth Section (Last) */}
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

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-current transition-all ${mobileMenuOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`} />
              <span className={`block h-0.5 bg-current transition-all ${mobileMenuOpen ? "opacity-0" : "w-4"}`} />
              <span className={`block h-0.5 bg-current transition-all ${mobileMenuOpen ? "w-6 -rotate-45 -translate-y-2" : "w-6"}`} />
            </div>
          </button>
        </div>

        {/* --- MOBILE NAVIGATION DROPDOWN --- */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 pb-6 space-y-2 border-t border-white/10 mt-2 overflow-y-auto max-h-[80vh]">
            
            {/* 1. Find Projects */}
            <MobileNavLink href="/ideas" onClick={() => setMobileMenuOpen(false)}>Find Projects</MobileNavLink>
            
            {/* 2. Create & Messages (If User) */}
            {user && (
              <>
                <MobileNavLink href="/ideas/new" onClick={() => setMobileMenuOpen(false)}>Create Pitch</MobileNavLink>
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

            {/* Separator */}
            <div className="w-full h-px bg-white/5 my-2" />

            {/* 3. About Section (Grouped) */}
            <MobileNavLink href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</MobileNavLink>
            <MobileNavLink href="/mission" onClick={() => setMobileMenuOpen(false)}>Our Mission</MobileNavLink>
            <MobileNavLink href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</MobileNavLink>

            {/* Separator */}
            <div className="w-full h-px bg-white/5 my-2" />

            {/* 4. Profile / Auth (Last) */}
            <div className="pt-2">
              {loading ? (
                <div className="px-4 py-3"><div className="w-8 h-8 rounded-full bg-white/10 animate-pulse mx-auto" /></div>
              ) : user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ProfileImage profile={profile} />
                  <div className="flex-1">
                    <p className="text-white font-medium">{profile?.username || "My Profile"}</p>
                    <p className="text-neutral-400 text-xs">{user.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-neutral-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="block w-full text-center px-4 py-3 text-sm font-bold rounded-lg bg-[var(--brand)] text-black hover:bg-[var(--brand-light)] transition-colors mx-2"
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

// Inline skeleton for initial render
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

// --- HELPERS ---

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-neutral-400 hover:text-[var(--brand-light)] transition-colors duration-200">
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

function ProfileImage({ profile, size = "md" }: { profile: any; size?: "sm" | "md" }) {
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm" };
  if (profile?.photoURL) {
    return <img src={profile.photoURL} alt="Profile" className={`rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--brand)] transition-all ${sizeClasses[size]}`} />;
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center font-bold text-black ${sizeClasses[size]}`}>
      {profile?.username?.[0]?.toUpperCase() || "U"}
    </div>
  );
}