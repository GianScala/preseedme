import { useState, ChangeEvent } from "react";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { ProfileFormData, StatusState } from "@/app/profile//utils/types";
import { normalizeUrl } from "@/app/profile/utils/urlHelpers";

export function useProfileForm(
  userId: string | undefined,
  formData: ProfileFormData,
  setFormData: (data: ProfileFormData) => void,
  originalData: ProfileFormData,
  setOriginalData: (data: ProfileFormData) => void,
  setPhotoPreview: (url: string) => void
) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
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
    JSON.stringify(formData) !== JSON.stringify(originalData) || !!selectedFile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formData.username?.trim()) {
      setStatus({ type: "error", message: "Username is required" });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      let finalPhotoURL = formData.photoURL;

      if (selectedFile) {
        const storage = getFirebaseStorage();

        try {
          const listRef = ref(storage, `profile-photos/${userId}`);
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
          `profile-photos/${userId}/profile_${Date.now()}.${ext}`
        );
        const snap = await uploadBytes(fileRef, selectedFile);
        finalPhotoURL = await getDownloadURL(snap.ref);
      }

      // Normalize URLs with smart detection
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => {
          if (typeof v === "string") {
            const trimmed = v.trim();
            if (trimmed === "") return [k, null];

            // Smart URL normalization
            if (k === "xUrl") {
              return [k, normalizeUrl(trimmed, "x")];
            }
            if (k === "linkedinUrl") {
              return [k, normalizeUrl(trimmed, "linkedin")];
            }
            if (k === "githubUrl") {
              return [k, normalizeUrl(trimmed, "github")];
            }
            if (k === "websiteUrl") {
              return [k, normalizeUrl(trimmed, "website")];
            }

            return [k, trimmed];
          }
          return [k, v];
        })
      );

      await updateDoc(doc(getFirebaseDb(), "users", userId), {
        ...cleanData,
        photoURL: finalPhotoURL,
      });

      const newData: ProfileFormData = {
        ...formData,
        xUrl: normalizeUrl(formData.xUrl, "x") ?? "",
        linkedinUrl: normalizeUrl(formData.linkedinUrl, "linkedin") ?? "",
        websiteUrl: normalizeUrl(formData.websiteUrl, "website") ?? "",
        githubUrl: normalizeUrl(formData.githubUrl, "github") ?? "",
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

  return {
    saving,
    status,
    setStatus,
    selectedFile,
    hasChanges,
    handleChange,
    handleFileSelect,
    handleSubmit,
  };
}