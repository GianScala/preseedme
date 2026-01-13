"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { ProfileTab, StatusState } from "./utils/types";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileForm } from "@/hooks/useProfileForm";
import { useProjectsData } from "@/hooks/useProjectsData";
import ProfileForm from "@/components/profile/ProfileForm";
import ProjectsPanel from "@/components/profile/ProjectsPanel";
import AccountSection from "@/components/profile/AccountSection";
import DeleteAccountModal from "@/components/profile/DeleteAccountModal";

export default function ProfilePage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "ideas">("profile");
  const [profileTab, setProfileTab] = useState<ProfileTab>("basic");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    loading,
    formData,
    setFormData,
    originalData,
    setOriginalData,
    photoPreview,
    setPhotoPreview,
  } = useProfileData(user?.uid, authLoading);

  const {
    saving,
    status,
    setStatus,
    hasChanges,
    handleChange,
    handleFileSelect,
    handleSubmit,
  } = useProfileForm(
    user?.uid,
    formData,
    setFormData,
    originalData,
    setOriginalData,
    setPhotoPreview
  );

  const { ideas, likedIdeas, handleDeleteIdea } = useProjectsData(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="relative">
      <h1 className="hidden md:block text-3xl font-bold mb-8">Settings</h1>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          ideasCount={ideas.length}
          user={user}
          setStatus={setStatus}
        />
      )}

      {/* Mobile Tabs */}
      <div className="sm:hidden mb-4 flex p-1 bg-neutral-900/10 rounded-xl border border-neutral-800">
        {(["profile", "ideas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-neutral-800/50 text-white shadow-sm"
                : "text-neutral-400"
            }`}
          >
            {tab === "ideas" ? "Projects" : "Profile"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-10 items-start">
        {/* LEFT: PROFILE */}
        <div className={activeTab === "profile" ? "block" : "hidden sm:block"}>
          <ProfileForm
            formData={formData}
            photoPreview={photoPreview}
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            onChange={handleChange}
            onFileSelect={handleFileSelect}
            onSubmit={handleSubmit}
            saving={saving}
            hasChanges={hasChanges}
            status={status}
          />

          <AccountSection
            onDeleteClick={() => setShowDeleteModal(true)}
            onSignOut={signOutUser}
          />
        </div>

        {/* RIGHT: PROJECTS */}
        <div
          className={`space-y-8 ${
            activeTab === "ideas" ? "block" : "hidden sm:block"
          }`}
        >
          <ProjectsPanel
            createdIdeas={ideas}
            likedIdeas={likedIdeas}
            currentUserId={user?.uid}
            onDeleteIdea={handleDeleteIdea}
          />
        </div>
      </div>
    </div>
  );
}