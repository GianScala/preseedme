import { useState, useEffect } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { UserProfile, Idea } from "@/types";

export function usePublicProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const db = getFirebaseDb();

        const userSnap = await getDoc(doc(db, "users", userId));
        if (!userSnap.exists()) {
          setProfile(null);
          return;
        }

        const userData = userSnap.data();
        setProfile({ id: userId, ...userData } as UserProfile);

        const ideaSnap = await getDocs(
          query(collection(db, "ideas"), where("founderId", "==", userId))
        );

        const ideasData: Idea[] = ideaSnap.docs.map((docRef) => ({
          ...(docRef.data() as Idea),
          id: docRef.id,
        }));

        setIdeas(ideasData);
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  return { profile, ideas, loading, error };
}