import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { INITIAL_DATA, ProfileFormData } from "@/app/profile/utils/types";
import { normalizeUrl } from "@/app/profile/utils/urlHelpers";

export function useProfileData(userId: string | undefined, authLoading: boolean) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_DATA);
  const [originalData, setOriginalData] = useState<ProfileFormData>(INITIAL_DATA);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!userId || authLoading) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirebaseDb();
        const userRef = doc(db, "users", userId);
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

        const loadedData: ProfileFormData = {
          ...INITIAL_DATA,
          ...data,
          email: data.email ?? "",
          bio: data.bio ?? "",
          username: data.username ?? "",
          preferredPhoneNumber: data.preferredPhoneNumber ?? "",
          address: data.address ?? "",
          photoURL: data.photoURL ?? "",
          location: data.location ?? "",
          xUrl: normalizeUrl(data.xUrl, "x") ?? "",
          linkedinUrl: normalizeUrl(data.linkedinUrl, "linkedin") ?? "",
          websiteUrl: normalizeUrl(data.websiteUrl, "website") ?? "",
          githubUrl: normalizeUrl(data.githubUrl, "github") ?? "",
        };

        setFormData(loadedData);
        setOriginalData(loadedData);
        setPhotoPreview(loadedData.photoURL);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authLoading, router]);

  return {
    loading,
    formData,
    setFormData,
    originalData,
    setOriginalData,
    photoPreview,
    setPhotoPreview,
  };
}