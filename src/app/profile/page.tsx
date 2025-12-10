"use client";

import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
  useRef,
  type ReactNode,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { performAccountArchivalAndCleanup } from "@/lib/accountUtils";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import type { Idea } from "@/types";
import Link from "next/link";
import ProfileIdeaCard from "@/components/profile/ProfileIdeaCard";
import {
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Save,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

import { CameraIcon } from "@/components/icons/CameraIcon";
import AddNewIcon from "@/components/icons/AddNewIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { SignoutIcon } from "@/components/icons/SignOutIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import { MailIcon } from "@/components/icons/MailIcon";

const INITIAL_DATA = {
  email: "",
  preferredPhoneNumber: "",
  address: "",
  username: "",
  handle: "",
  photoURL: "",
  bio: "",
  location: "",
  role: "founder" as "founder" | "investor" | "both",
  twitterUrl: "",
  linkedinUrl: "",
  websiteUrl: "",
  githubUrl: "",
};

type StatusState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

type ProjectsView = "created" | "liked";
type ProfileTab = "basic" | "contact" | "links";

/**
 * Ensure we always have a proper protocol:
 * - "", null, undefined -> null
 * - "www.foo.com" -> "https://www.foo.com"
 * - "foo.com" -> "https://foo.com"
 * - "https://foo.com" / "http://foo.com" stay as is
 */
const ensureHttps = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If user already typed a protocol (http, https, custom), keep it
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-neutral-900/30 p-4 md:p-5 rounded-2xl border border-neutral-800 space-y-4 ${className}`}
    >
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

type IconInputProps = {
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  prefix?: ReactNode;
};

function IconInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  prefix,
}: IconInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <div
        className={`relative ${
          readOnly ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {Icon && (
          <Icon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
        )}
        {prefix && !Icon && (
          <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value || ""}
          readOnly={readOnly}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          className={`w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 ${
            Icon || prefix ? "pl-10" : "pl-3"
          } pr-4 text-base md:text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [likedIdeas, setLikedIdeas] = useState<Idea[]>([]);
  const [projectsView, setProjectsView] = useState<ProjectsView>("created");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState(INITIAL_DATA);
  const [originalData, setOriginalData] = useState(INITIAL_DATA);
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "ideas">("profile");
  const [profileTab, setProfileTab] = useState<ProfileTab>("basic");
  const [status, setStatus] = useState<StatusState>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Fetch user + projects
  useEffect(() => {
    if (!user || authLoading) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirebaseDb();

        // User profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.replace("/onboarding/handle");
          return;
        }

        const data = userSnap.data() || {};

        if (!data.handle) {
          router.replace("/onboarding/handle");
          return;
        }

        const loadedData = {
          ...INITIAL_DATA,
          ...data,
          email: data.email ?? user.email ?? "",
          bio: data.bio ?? "",
          username: data.username ?? "",
          preferredPhoneNumber: data.preferredPhoneNumber ?? "",
          address: data.address ?? "",
          photoURL: data.photoURL ?? "",
          location: data.location ?? "",
          // normalize URLs on load so next save will clean DB
          twitterUrl: ensureHttps(data.twitterUrl) ?? "",
          linkedinUrl: ensureHttps(data.linkedinUrl) ?? "",
          websiteUrl: ensureHttps(data.websiteUrl) ?? "",
          githubUrl: ensureHttps(data.githubUrl) ?? "",
        };

        setFormData(loadedData);
        setOriginalData(loadedData);
        setPhotoPreview(loadedData.photoURL);

        // Projects
        const createdIdeasQuery = query(
          collection(db, "ideas"),
          where("founderId", "==", user.uid)
        );

        const likedIdeasQuery = query(
          collection(db, "ideas"),
          where("likedByUserIds", "array-contains", user.uid)
        );

        const [createdSnap, likedSnap] = await Promise.all([
          getDocs(createdIdeasQuery),
          getDocs(likedIdeasQuery),
        ]);

        setIdeas(
          createdSnap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
              } as Idea)
          )
        );

        setLikedIdeas(
          likedSnap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
              } as Idea)
          )
        );
      } catch (err) {
        console.error("Fetch error:", err);
        setStatus({
          type: "error",
          message: "Failed to load your profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  const handleChange = (field: keyof typeof INITIAL_DATA, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        type: "error",
        message: "Image must be smaller than 5MB",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const hasChanges =
    JSON.stringify(formData) !== JSON.stringify(originalData) ||
    !!selectedFile;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !formData.username?.trim()) {
      setStatus({ type: "error", message: "Username is required" });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      let finalPhotoURL = formData.photoURL;

      // Upload new photo if selected
      if (selectedFile) {
        const storage = getFirebaseStorage();

        try {
          const listRef = ref(storage, `profile-photos/${user.uid}`);
          const listRes = await listAll(listRef);
          await Promise.all(
            listRes.items.map((itemRef) => deleteObject(itemRef))
          );
        } catch (err) {
          console.warn("Profile photo cleanup warning:", err);
        }

        const ext = selectedFile.name.split(".").pop() || "jpg";
        const fileRef = ref(
          storage,
          `profile-photos/${user.uid}/profile_${Date.now()}.${ext}`
        );
        const snap = await uploadBytes(fileRef, selectedFile);
        finalPhotoURL = await getDownloadURL(snap.ref);
      }

      // Normalize + trim everything before saving
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => {
          if (typeof v === "string") {
            const trimmed = v.trim();
            if (trimmed === "") return [k, null];

            if (
              ["twitterUrl", "linkedinUrl", "websiteUrl", "githubUrl"].includes(
                k
              )
            ) {
              return [k, ensureHttps(trimmed)];
            }

            return [k, trimmed];
          }
          return [k, v];
        })
      );

      await updateDoc(doc(getFirebaseDb(), "users", user.uid), {
        ...cleanData,
        photoURL: finalPhotoURL,
      });

      // Update local form with normalized URLs
      const newData = {
        ...formData,
        twitterUrl: ensureHttps(formData.twitterUrl) ?? "",
        linkedinUrl: ensureHttps(formData.linkedinUrl) ?? "",
        websiteUrl: ensureHttps(formData.websiteUrl) ?? "",
        githubUrl: ensureHttps(formData.githubUrl) ?? "",
        photoURL: finalPhotoURL,
      };

      setFormData(newData);
      setOriginalData(newData);
      setSelectedFile(null);
      setStatus({
        type: "success",
        message: "Profile saved successfully",
      });

      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete this idea? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const db = getFirebaseDb();
      await Promise.all([
        deleteDoc(doc(db, "ideas", ideaId)),
        updateDoc(doc(db, "users", user.uid), {
          publishedIdeaIds: arrayRemove(ideaId),
        }),
      ]);
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      setLikedIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    } catch (err) {
      console.error("Delete idea error:", err);
      setStatus({
        type: "error",
        message: "Failed to delete idea. Please try again.",
      });
    }
  };

  const handleAccountDeletion = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      await performAccountArchivalAndCleanup(user.uid);
      await user.delete();
      router.push("/");
    } catch (error: any) {
      console.error("Deletion Error:", error);
      setIsDeleting(false);
      setShowDeleteModal(false);

      if (error.code === "auth/requires-recent-login") {
        setStatus({
          type: "error",
          message:
            "Security check: Please log out and log back in to delete your account.",
        });
      } else {
        setStatus({
          type: "error",
          message: "Failed to delete account. Please try again.",
        });
      }
    }
  };

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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-red-900/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Delete Account?
                </h3>
                <p className="text-neutral-400 text-sm mt-1">
                  This action cannot be undone. Your projects will be taken
                  offline and archived.
                </p>
              </div>
            </div>

            <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/30 mb-6">
              <ul className="text-xs text-red-200/80 space-y-2 list-disc pl-4">
                <li>Your profile will be deleted.</li>
                <li>Your {ideas.length} published project(s) will be archived.</li>
                <li>All your likes will be removed from other projects.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDeletion}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Yes, Delete It"
                )}
              </button>
            </div>
          </div>
        </div>
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
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            {/* Profile sub-tabs */}
            <div className="flex p-1 bg-neutral-900/20 rounded-full border border-neutral-800 text-xs font-medium max-w-md">
              {(["basic", "contact", "links"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProfileTab(tab)}
                  className={`flex-1 py-1.5 rounded-full capitalize transition-all ${
                    profileTab === tab
                      ? "bg-brand/50 text-white shadow-sm"
                      : "text-neutral-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* BASIC TAB */}
            {profileTab === "basic" && (
              <SectionCard>
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="relative group">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-neutral-700 group-hover:border-brand transition-colors"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold border-2 border-neutral-700">
                        {formData.username?.[0]?.toUpperCase() || (
                          <ProfileIcon />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-neutral-800 rounded-full border border-neutral-600 hover:bg-brand hover:text-black transition-colors shadow-lg"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Profile</h2>
                    <p className="text-sm text-neutral-400">
                      Update how others see you across the app.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <IconInput
                    label="Display Name"
                    icon={ProfileIcon}
                    value={formData.username || ""}
                    onChange={(v) => handleChange("username", v)}
                    placeholder="Your name"
                  />

                  <IconInput
                    label="Handle"
                    prefix="@"
                    value={formData.handle || ""}
                    onChange={() => {}}
                    readOnly
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium text-neutral-300">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all min-h-[90px] max-h-[200px] resize-y"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-neutral-500">
                      {(formData.bio || "").length}/500
                    </span>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* CONTACT TAB */}
            {profileTab === "contact" && (
              <SectionCard title="Contact Info">
                <div className="grid gap-4 md:grid-cols-2">
                  <IconInput
                    label="Email"
                    icon={MailIcon}
                    value={formData.email || ""}
                    onChange={(v) => handleChange("email", v)}
                    placeholder="you@example.com"
                  />
                  <IconInput
                    label="Phone"
                    icon={Phone}
                    value={formData.preferredPhoneNumber || ""}
                    onChange={(v) => handleChange("preferredPhoneNumber", v)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <details className="mt-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
                  <summary className="cursor-pointer py-2 px-3 text-xs uppercase tracking-wide text-neutral-400 select-none">
                    Advanced details
                  </summary>
                  <div className="p-3 pt-1">
                    <IconInput
                      label="Address"
                      icon={MapPin}
                      value={formData.address || ""}
                      onChange={(v) => handleChange("address", v)}
                      placeholder="Full business address"
                    />
                  </div>
                </details>
              </SectionCard>
            )}

            {/* LINKS TAB */}
            {profileTab === "links" && (
              <SectionCard
                title="Socials"
                description="Share where people can find you."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <IconInput
                    icon={Twitter}
                    value={formData.twitterUrl || ""}
                    onChange={(v) => handleChange("twitterUrl", v)}
                    placeholder="twitter.com/you"
                  />
                  <IconInput
                    icon={Linkedin}
                    value={formData.linkedinUrl || ""}
                    onChange={(v) => handleChange("linkedinUrl", v)}
                    placeholder="linkedin.com/in/you"
                  />
                  <IconInput
                    icon={Github}
                    value={formData.githubUrl || ""}
                    onChange={(v) => handleChange("githubUrl", v)}
                    placeholder="github.com/you"
                  />
                  <IconInput
                    icon={Globe}
                    value={formData.websiteUrl || ""}
                    onChange={(v) => handleChange("websiteUrl", v)}
                    placeholder="www.yourstartup.com"
                  />
                </div>
              </SectionCard>
            )}

            {status && (
              <div
                className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
                  status.type === "error"
                    ? "bg-red-950/50 text-red-300 border border-red-900"
                    : "bg-green-950/50 text-green-300 border border-green-900"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="sticky bottom-4 z-10 pt-2 bg-gradient-to-t from-neutral-950/80 via-neutral-950/60 to-transparent">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="w-full shadow-lg shadow-brand/10 bg-brand text-black font-bold py-3 rounded-xl hover:bg-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>

          <SectionCard
            title="Account"
            description="Manage your account access and data."
            className="mt-6"
          >
            <div className="flex flex-col gap-3">
              <button
                onClick={signOutUser}
                className="w-full py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <SignoutIcon className="w-4 h-4" /> Sign Out
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 px-4 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 text-red-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT: PROJECTS */}
        <div
          className={`space-y-8 ${
            activeTab === "ideas" ? "block" : "hidden sm:block"
          }`}
        >
          <div className="space-y-6 animate-fade-in">
            <div className="hidden md:flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Your Projects</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  {projectsView === "created"
                    ? "Projects you've published"
                    : "Projects you've liked"}
                </p>
              </div>
            </div>

            <div className="flex p-1 bg-neutral-900/20 rounded-full border border-neutral-800 text-xs font-medium w-full">
              <button
                type="button"
                onClick={() => setProjectsView("created")}
                className={`flex-1 py-1.5 rounded-full transition-all ${
                  projectsView === "created"
                    ? "bg-neutral-800/50 text-white shadow-sm"
                    : "text-neutral-400"
                }`}
              >
                Created
              </button>
              <button
                type="button"
                onClick={() => setProjectsView("liked")}
                className={`flex-1 py-1.5 rounded-full transition-all ${
                  projectsView === "liked"
                    ? "bg-neutral-800/50 text-white shadow-sm"
                    : "text-neutral-400"
                }`}
              >
                Liked
              </button>
            </div>

            {projectsView === "created" ? (
              ideas.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
                  <p className="text-neutral-400 mb-4">
                    No ideas published yet.
                  </p>
                  <Link
                    href="/ideas/new"
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Draft your first idea
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/ideas/new"
                    className="mb-4 w-full py-3 rounded-xl border border-dashed border-neutral-800 hover:border-brand/50 text-neutral-400 hover:text-brand transition-all flex items-center justify-center gap-2 group"
                  >
                    <div className="p-1 rounded-full transition-colors">
                      <AddNewIcon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">
                      Create New Project
                    </span>
                  </Link>

                  <div className="grid gap-6">
                    {ideas.map((idea) => (
                      <div key={idea.id} className="relative group">
                        <ProfileIdeaCard
                          idea={idea}
                          showEdit={idea.founderId === user?.uid}
                          onDelete={() => handleDeleteIdea(idea.id)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )
            ) : likedIdeas.length === 0 ? (
              <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
                <p className="text-neutral-400 mb-2">
                  You haven&apos;t liked any projects yet.
                </p>
                <p className="text-xs text-neutral-500">
                  Browse the explore page and tap the heart on projects you
                  love.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {likedIdeas.map((idea) => (
                  <div key={idea.id} className="relative group">
                    <ProfileIdeaCard idea={idea} showEdit={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
