"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import SignInModal from "@/components/common/modal/SignInModal";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import ProfileHeader from "./components/ProfileHeader";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import ProjectsSection from "./components/ProjectsSection";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { profile, ideas, loading, error } = usePublicProfile(userId);

  const handleAuthTrigger = () => setIsSignInModalOpen(true);

  const handleMessage = () => {
    if (!profile) return;

    if (!user) {
      handleAuthTrigger();
      return;
    }

    const ids = [user.uid, profile.id].sort();
    router.push(`/chat/${ids[0]}_${ids[1]}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertCircle className="w-10 h-10 text-neutral-600 mb-3" />
        <h2 className="text-lg font-bold mb-1.5">Profile Not Found</h2>
        <p className="text-sm text-neutral-500 mb-3">
          This profile doesn&apos;t exist or is no longer available.
        </p>
        <Link href="/ideas" className="text-sm text-brand hover:underline">
          Back to Ideas
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.uid === profile.id;

  return (
    <div className="py-3 sm:py-4 px-4 sm:px-6 space-y-5 sm:space-y-6 animate-fade-in">
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isAuthenticated={!!user}
        onMessage={handleMessage}
        onAuthTrigger={handleAuthTrigger}
      />

      {profile.bio && (
        <AboutSection
          bio={profile.bio}
          isAuthenticated={!!user}
          onAuthTrigger={handleAuthTrigger}
        />
      )}

      <ContactSection
        email={profile.email ?? undefined}
        phone={profile.preferredPhoneNumber ?? undefined}
        address={profile.address ?? undefined}
        isAuthenticated={!!user}
        onAuthTrigger={handleAuthTrigger}
      />

      <ProjectsSection
        ideas={ideas}
        isAuthenticated={!!user}
        onAuthTrigger={handleAuthTrigger}
      />
    </div>
  );
}