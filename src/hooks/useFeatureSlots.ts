import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  getFirestore 
} from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase";

/**
 * Listens to the 'featured_slots' collection.
 * Expects documents with IDs in 'YYYY-MM-DD' format.
 */
export function useFeatureSlots() {
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore(getFirebaseApp());
    const slotsRef = collection(db, "featured_slots");

    // Real-time listener so the calendar updates instantly if someone else books
    const unsubscribe = onSnapshot(slotsRef, (snapshot) => {
      const dates = snapshot.docs.map((doc) => doc.id);
      setBookedDates(dates);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching slots:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { bookedDates, loading };
}