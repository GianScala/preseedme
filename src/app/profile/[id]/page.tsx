"use client";

import { useEffect, useState, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { UserProfile, Idea } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import SignInModal from "@/components/common/modal/SignInModal";
import { 
  ArrowLeft, MapPin, Globe, Linkedin, Github, Twitter, 
  MessageCircle, Mail, Phone, Lock, AlertCircle 
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const router = useRouter();
  const { user } = useAuth(); 

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const db = getFirebaseDb();
        
        // 1. Fetch User Data
        const userSnap = await getDoc(doc(db, "users", userId));

        if (!userSnap.exists()) {
          setProfile(null);
          return;
        }

        setProfile({ id: userId, ...userSnap.data() } as UserProfile);

        // 2. Fetch Projects
        const ideaSnap = await getDocs(query(
          collection(db, "ideas"), 
          where("founderId", "==", userId)
        ));
        
        setIdeas(ideaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea)));

      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleAuthTrigger = () => {
    setIsSignInModalOpen(true);
  };

  const handleMessage = () => {
    if (!user) {
      handleAuthTrigger();
      return;
    }
    if (!profile) return;
    const ids = [user.uid, profile.id].sort();
    router.push(`/chat/${ids[0]}_${ids[1]}`);
  };

  /* ---------------- UPDATED HELPER: RESTRICTED SECTION ---------------- */
  // Now accepts 'hideOverlay' to remove the button but keep the blur
  const RestrictedSection = ({ 
    children, 
    className = "",
    hideOverlay = false 
  }: { 
    children: ReactNode; 
    className?: string;
    hideOverlay?: boolean;
  }) => {
    // If user exists, show content normally
    if (user) return <div className={className}>{children}</div>;

    // If NO user, show blurred content
    return (
      <div 
        onClick={handleAuthTrigger}
        className={`relative group cursor-pointer overflow-hidden rounded-xl ${className}`}
      >
        {/* The Content (Blurred) */}
        {/* We use less opacity if there is no overlay to make it look ghosted */}
        <div className={`blur-md select-none pointer-events-none grayscale transition-all duration-500 ${hideOverlay ? 'opacity-40' : 'opacity-60'}`}>
          {children}
        </div>

        {/* The Lock Overlay - Only rendered if hideOverlay is false */}
        {!hideOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl transform transition-transform group-hover:scale-105">
              <Lock className="w-3 h-3 text-brand" />
              <span className="text-xs font-bold text-white tracking-wide">Login to view</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-pulse">
        <div className="flex gap-6 items-center">
          <div className="w-24 h-24 bg-neutral-800 rounded-full" />
          <div className="space-y-3 flex-1">
            <div className="h-8 w-48 bg-neutral-800 rounded" />
            <div className="h-4 w-32 bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR / NOT FOUND ---------------- */
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-neutral-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <Link href="/ideas" className="text-brand hover:underline">Back to Ideas</Link>
      </div>
    );
  }

  const isOwnProfile = user?.uid === profile.id;

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="py-2 px-4 sm:px-6 space-y-8 animate-fade-in">
      <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />

      {/* Navigation */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* SECTION 1: HEADER */}
      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
        <div className="flex flex-col sm:flex-row gap-6 items-start w-full">
          {/* Avatar (Always Visible) */}
          <div className="relative shrink-0">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.username} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-neutral-900 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-3xl font-bold text-white border-4 border-neutral-900 shadow-xl">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-2 pt-2 flex-1">
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">{profile.username}</h1>
              {profile.handle && <p className="text-neutral-400 font-medium">@{profile.handle}</p>}
            </div>
            
            {/* Location (Explicitly Allowed Publicly) */}
            {profile.location && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Social Row - BLURRED ONLY (No Text Overlay) */}
            <RestrictedSection className="pt-2 inline-block" hideOverlay={true}>
              <div className="flex gap-2">
                {profile.twitterUrl && <SocialLink href={profile.twitterUrl} icon={Twitter} />}
                {profile.linkedinUrl && <SocialLink href={profile.linkedinUrl} icon={Linkedin} />}
                {profile.githubUrl && <SocialLink href={profile.githubUrl} icon={Github} />}
                {profile.websiteUrl && <SocialLink href={profile.websiteUrl} icon={Globe} />}
                {/* Dummy placeholder to show "something is here" if blurred but data empty */}
                {!user && (!profile.twitterUrl && !profile.linkedinUrl) && (
                   <div className="flex gap-2 opacity-50">
                      <div className="w-8 h-8 bg-neutral-800 rounded-lg"></div>
                      <div className="w-8 h-8 bg-neutral-800 rounded-lg"></div>
                      <div className="w-8 h-8 bg-neutral-800 rounded-lg"></div>
                   </div>
                )}
              </div>
            </RestrictedSection>
          </div>
        </div>

        {/* Action Button */}
        {!isOwnProfile && (
          <button
            onClick={handleMessage}
            className="w-full md:w-auto shrink-0 px-6 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/10"
          >
            {user ? <MessageCircle className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            {user ? "Message" : "Login to Message"}
          </button>
        )}
      </div>

      {/* SECTION 2: BIO (Standard Restricted - Shows Button) */}
      {profile.bio && (
        <RestrictedSection className="rounded-2xl border border-neutral-800 bg-neutral-900/30">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        </RestrictedSection>
      )}

      {/* SECTION 3: CONTACT INFO (Standard Restricted - Shows Button) */}
      {(profile.email || profile.preferredPhoneNumber || profile.address) && (
        <RestrictedSection className="rounded-2xl border border-neutral-800 bg-neutral-900/30">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.email && <ContactItem icon={Mail} label="Email" value={profile.email} />}
              {profile.preferredPhoneNumber && <ContactItem icon={Phone} label="Phone" value={profile.preferredPhoneNumber} />}
              {profile.address && <ContactItem icon={MapPin} label="Office" value={profile.address} />}
            </div>
          </div>
        </RestrictedSection>
      )}

      {/* SECTION 4: PROJECTS (Restricted - Shows Button) */}
      <div className="pt-4 border-t border-neutral-800">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          Published Projects <span className="text-sm font-normal text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full">{ideas.length}</span>
        </h3>
        
        {ideas.length > 0 ? (
          <RestrictedSection>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map(idea => (
                <Link 
                  href={user ? `/ideas/${idea.id}` : "#"}
                  key={idea.id}
                  onClick={(e) => !user && e.preventDefault()}
                  className="group block p-5 rounded-xl bg-neutral-900/30 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/60 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white group-hover:text-brand transition-colors line-clamp-1">{idea.title}</h4>
                  </div>
                  <p className="text-sm text-neutral-400 line-clamp-2">{idea.oneLiner}</p>
                </Link>
              ))}
            </div>
          </RestrictedSection>
        ) : (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
            <p className="text-neutral-500">No public projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers
const SocialLink = ({ href, icon: Icon }: { href: string; icon: any }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()} 
    className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
  >
    <Icon className="w-4 h-4" />
  </a>
);

const ContactItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
    <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-neutral-500 font-medium uppercase">{label}</p>
      <p className="text-sm text-neutral-200 font-medium">{value}</p>
    </div>
  </div>
);