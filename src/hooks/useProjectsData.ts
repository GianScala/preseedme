import { useState, useEffect } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import type { Idea } from "@/types";

export function useProjectsData(userId: string | undefined) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [likedIdeas, setLikedIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
      try {
        const db = getFirebaseDb();

        const createdIdeasQuery = query(
          collection(db, "ideas"),
          where("founderId", "==", userId)
        );

        const likedIdeasQuery = query(
          collection(db, "ideas"),
          where("likedByUserIds", "array-contains", userId)
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
        console.error("Fetch projects error:", err);
      }
    };

    fetchProjects();
  }, [userId]);

  const handleDeleteIdea = async (ideaId: string) => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Delete this idea? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const db = getFirebaseDb();
      await Promise.all([
        deleteDoc(doc(db, "ideas", ideaId)),
        updateDoc(doc(db, "users", userId), {
          publishedIdeaIds: arrayRemove(ideaId),
        }),
      ]);
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      setLikedIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    } catch (err) {
      console.error("Delete idea error:", err);
      throw err;
    }
  };

  return {
    ideas,
    likedIdeas,
    handleDeleteIdea,
  };
}