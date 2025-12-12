import { MapPin, MessageCircle, Lock } from "lucide-react";
import type { UserProfile } from "@/types";
import { SocialLink, normalizeUrl, getSocialIcon } from "../utils/socialHelpers";
import RestrictedSection from "./RestrictedSection";

type ProfileHeaderProps = {
  profile: UserProfile;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  onMessage: () => void;
  onAuthTrigger: () => void;
};

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isAuthenticated,
  onMessage,
  onAuthTrigger,
}: ProfileHeaderProps) {
  const socialLinks = [
    { url: normalizeUrl(profile.xUrl ), platform: "x" },
    { url: normalizeUrl(profile.linkedinUrl), platform: "linkedin" },
    { url: normalizeUrl(profile.githubUrl), platform: "github" },
    { url: normalizeUrl(profile.websiteUrl), platform: "website" },
  ].filter((link) => link.url);

  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-3 sm:gap-4 w-full md:w-auto">
        {/* Avatar */}
        <div className="relative shrink-0">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-neutral-800 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-xl sm:text-2xl font-bold text-white border-2 border-neutral-800 shadow-lg">
              {profile.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1.5 pt-0.5 flex-1 min-w-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {profile.username}
            </h1>
            {profile.handle && (
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                @{profile.handle}
              </p>
            )}
          </div>

          {profile.location && (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}

          {/* Socials */}
          <RestrictedSection
            className="pt-1 inline-block"
            hideOverlay
            isAuthenticated={isAuthenticated}
            onAuthTrigger={onAuthTrigger}
          >
            <div className="flex flex-wrap gap-1.5">
              {socialLinks.map((link, idx) => (
                <SocialLink
                  key={idx}
                  href={link.url!}
                  icon={getSocialIcon(link.platform)}
                />
              ))}

              {!isAuthenticated && socialLinks.length === 0 && (
                <div className="flex gap-1.5 opacity-50">
                  <div className="w-7 h-7 bg-neutral-800 rounded-lg" />
                  <div className="w-7 h-7 bg-neutral-800 rounded-lg" />
                  <div className="w-7 h-7 bg-neutral-800 rounded-lg" />
                </div>
              )}
            </div>
          </RestrictedSection>
        </div>
      </div>

      {/* Message Button */}
      {!isOwnProfile && (
        <button
          type="button"
          onClick={onMessage}
          className="w-full md:w-auto shrink-0 px-4 py-2.5 rounded-lg bg-brand text-black text-sm font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/10"
        >
          {isAuthenticated ? (
            <MessageCircle className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          {isAuthenticated ? "Message Founder" : "Login to Message"}
        </button>
      )}
    </header>
  );
}