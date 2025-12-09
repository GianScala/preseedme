// src/app/profile/page.tsx
"use client";

import { useEffect, useState, FormEvent, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
// IMPORT THE HELPER FUNCTION
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
import IdeaCard from "@/components/IdeaCard";
import { 
  Camera, User, Mail, Phone, MapPin, Globe, 
  Linkedin, Github, Twitter, Save, Loader2, Trash2, 
  LogOut, AlertTriangle, X 
} from "lucide-react";

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

export default function ProfilePage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consolidated State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  
  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [originalData, setOriginalData] = useState(INITIAL_DATA);
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<"profile" | "ideas">("profile");
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // 1. Auth Check
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [authLoading, user, router]);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirebaseDb();
        
        // Fetch User
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          
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
            twitterUrl: data.twitterUrl ?? "",
            linkedinUrl: data.linkedinUrl ?? "",
            websiteUrl: data.websiteUrl ?? "",
            githubUrl: data.githubUrl ?? "",
          };

          setFormData(loadedData);
          setOriginalData(loadedData);
          setPhotoPreview(loadedData.photoURL);
        } else {
          router.replace("/onboarding/handle");
          return;
        }

        // Fetch Ideas
        const q = query(collection(db, "ideas"), where("founderId", "==", user.uid));
        const ideaSnap = await getDocs(q);
        setIdeas(ideaSnap.docs.map(d => ({ id: d.id, ...d.data() } as Idea)));

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchData();
  }, [user, authLoading, router]);

  // 3. Helpers
  const handleChange = (field: keyof typeof INITIAL_DATA, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', message: "Image must be smaller than 5MB" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || !!selectedFile;

  // 4. Submission Logic
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !formData.username?.trim()) {
      setStatus({ type: 'error', message: "Username is required" });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      let finalPhotoURL = formData.photoURL;

      if (selectedFile) {
        const storage = getFirebaseStorage();
        try {
            const listRef = ref(storage, `profile-photos/${user.uid}`);
            const listRes = await listAll(listRef);
            await Promise.all(listRes.items.map(ref => deleteObject(ref)));
        } catch (e) { console.warn("Cleanup warning:", e); }

        const ext = selectedFile.name.split(".").pop() || "jpg";
        const fileRef = ref(storage, `profile-photos/${user.uid}/profile_${Date.now()}.${ext}`);
        const snap = await uploadBytes(fileRef, selectedFile);
        finalPhotoURL = await getDownloadURL(snap.ref);
      }

      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === "" ? null : v])
      );

      await updateDoc(doc(getFirebaseDb(), "users", user.uid), {
        ...cleanData,
        photoURL: finalPhotoURL
      });

      const newData = { ...formData, photoURL: finalPhotoURL };
      setFormData(newData);
      setOriginalData(newData);
      setSelectedFile(null);
      setStatus({ type: 'success', message: "Profile saved successfully" });

      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!user || !confirm("Delete this idea? This cannot be undone.")) return;
    try {
      const db = getFirebaseDb();
      await Promise.all([
        deleteDoc(doc(db, "ideas", ideaId)),
        updateDoc(doc(db, "users", user.uid), { publishedIdeaIds: arrayRemove(ideaId) })
      ]);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Account Deletion Logic
  const handleAccountDeletion = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      // A. Archive Data & Cleanup Likes
      await performAccountArchivalAndCleanup(user.uid);
      
      // B. Delete Authentication Account
      await user.delete();
      
      // C. Route will change automatically due to AuthContext, but force it just in case
      router.push("/");
    } catch (error: any) {
      console.error("Deletion Error:", error);
      setIsDeleting(false);
      setShowDeleteModal(false);
      
      // Handle the case where user needs to re-login to delete
      if (error.code === 'auth/requires-recent-login') {
        setStatus({ 
          type: 'error', 
          message: "Security check: Please log out and log back in to delete your account." 
        });
      } else {
        setStatus({ type: 'error', message: "Failed to delete account. Please try again." });
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

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
                <h3 className="text-xl font-bold text-white">Delete Account?</h3>
                <p className="text-neutral-400 text-sm mt-1">
                  This action cannot be undone. Your projects will be taken offline and archived.
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
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="sm:hidden mb-6 flex p-1 bg-neutral-900 rounded-xl border border-neutral-800">
        {(['profile', 'ideas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-10 items-start">
        {/* === SECTION 1: PROFILE FORM === */}
        <div className={activeTab === 'profile' ? 'block' : 'hidden sm:block'}>
            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
              {/* Header Image Section */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800">
                <div className="relative group">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-neutral-700 group-hover:border-brand transition-colors" 
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold border-2 border-neutral-700">
                      {formData.username?.[0]?.toUpperCase() || <User />}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-neutral-800 rounded-full border border-neutral-600 hover:bg-brand hover:text-black transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Profile Photo</h2>
                  <p className="text-sm text-neutral-400">Recommended: Square JPG, PNG, or WEBP (Max 5MB)</p>
                </div>
              </div>

              {/* Main Info Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                    <input
                      value={formData.username || ""}
                      onChange={e => handleChange("username", e.target.value)}
                      className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Handle</label>
                  <div className="relative opacity-60 cursor-not-allowed">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">@</span>
                    <input
                      value={formData.handle || ""}
                      readOnly
                      className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-8 pr-4 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-neutral-300">Bio</label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={e => handleChange("bio", e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all min-h-[100px]"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-neutral-500">{(formData.bio || "").length}/500</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-lg font-semibold text-white">Contact Info</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={formData.email || ""}
                        onChange={e => handleChange("email", e.target.value)}
                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={formData.preferredPhoneNumber || ""}
                        onChange={e => handleChange("preferredPhoneNumber", e.target.value)}
                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-neutral-300">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={formData.address || ""}
                        onChange={e => handleChange("address", e.target.value)}
                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                        placeholder="Full business address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-lg font-semibold text-white">Socials</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { key: "twitterUrl", icon: Twitter, placeholder: "X / Twitter URL" },
                    { key: "linkedinUrl", icon: Linkedin, placeholder: "LinkedIn URL" },
                    { key: "githubUrl", icon: Github, placeholder: "GitHub URL" },
                    { key: "websiteUrl", icon: Globe, placeholder: "Website URL" },
                  ].map((item) => (
                    <div key={item.key} className="relative">
                      <item.icon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={formData[item.key as keyof typeof formData] || ""}
                        onChange={e => handleChange(item.key as keyof typeof INITIAL_DATA, e.target.value)}
                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                        placeholder={item.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Messages */}
              {status && (
                <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
                  status.type === 'error' ? 'bg-red-950/50 text-red-300 border border-red-900' : 'bg-green-950/50 text-green-300 border border-green-900'
                }`}>
                  {status.message}
                </div>
              )}

              {/* Action Bar */}
              <div className="sticky bottom-4 z-10 pt-4">
                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="w-full shadow-lg shadow-brand/10 bg-brand text-black font-bold py-3 rounded-xl hover:bg-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </form>
        </div>
        
        {/* === SECTION 2: IDEAS LIST & ACCOUNT ACTIONS === */}
        <div className={`space-y-8 ${activeTab === 'ideas' ? 'block' : 'hidden sm:block'}`}>
           <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Your Projects</h2>
                <Link href="/ideas/new" className="text-sm text-brand hover:underline">
                  + New Idea
                </Link>
              </div>
              
              {ideas.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
                  <p className="text-neutral-400 mb-4">No ideas published yet.</p>
                  <Link
                    href="/ideas/new"
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Draft your first idea
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6">
                  {ideas.map(idea => (
                    <div key={idea.id} className="relative group">
                      <IdeaCard idea={idea} showEdit />
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
           
           {/* === DANGER ZONE === */}
           <div className="p-6 rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-6">
             <div>
               <h3 className="font-semibold text-lg text-white mb-1">Account</h3>
               <p className="text-sm text-neutral-400">Manage your account access and data</p>
             </div>
             
             <div className="flex flex-col gap-3">
               <button 
                 onClick={signOutUser}
                 className="w-full py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> Sign Out
               </button>

               <button 
                 onClick={() => setShowDeleteModal(true)}
                 className="w-full py-2.5 px-4 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 text-red-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
               >
                 <Trash2 className="w-4 h-4" /> Delete Account
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}