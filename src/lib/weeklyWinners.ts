// src/lib/weeklyWinners.ts
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    documentId,
  } from "firebase/firestore";
  import { getFirebaseDb } from "./firebase";
  import type { IdeaWithLikes } from "./ideas";
  import { mapIdeaDoc } from "./ideas";
  
  export type WeeklyWinner = {
    idea: IdeaWithLikes;
    rank: number;
  };
  
  /**
   * Fetch weekly winners based on a manual Firestore collection:
   *
   * Collection: weekly_winners
   *   - doc ID = ideaId (e.g. "FF30y8C5t6mgizJXpq2x")
   *   - fields:
   *       rank: number (1, 2, 3, 4, ...)
   */
  export async function fetchWeeklyWinnersFromFirebase(): Promise<WeeklyWinner[]> {
    const db = getFirebaseDb();
  
    // 1. Load weekly_winners docs (sorted by rank, max 4)
    const weeklyWinnersRef = collection(db, "weekly_winners");
    const winnersQuery = query(
      weeklyWinnersRef,
      orderBy("rank", "asc"),
      limit(4)
    );
    const winnersSnap = await getDocs(winnersQuery);
  
    if (winnersSnap.empty) return [];
  
    const ideaIdsWithRank = winnersSnap.docs.map((docSnap) => {
      const data = docSnap.data() as { rank?: number };
      return {
        ideaId: docSnap.id, // doc ID = idea ID
        rank: data.rank ?? 4,
      };
    });
  
    const ideaIds = ideaIdsWithRank.map((x) => x.ideaId);
  
    // 2. Fetch all corresponding ideas in one go
    const ideasRef = collection(db, "ideas");
    const ideasQuery = query(
      ideasRef,
      where(documentId(), "in", ideaIds) // we only ever have up to 4
    );
    const ideasSnap = await getDocs(ideasQuery);
  
    const ideaById = new Map<string, IdeaWithLikes>();
    ideasSnap.docs.forEach((docSnap) => {
      ideaById.set(docSnap.id, mapIdeaDoc(docSnap));
    });
  
    // 3. Combine rank + idea, preserving rank order
    const weeklyWinners: WeeklyWinner[] = ideaIdsWithRank
      .map(({ ideaId, rank }) => {
        const idea = ideaById.get(ideaId);
        if (!idea) return null; // idea might have been deleted
        return { idea, rank };
      })
      .filter((x): x is WeeklyWinner => x !== null)
      .sort((a, b) => a.rank - b.rank);
  
    return weeklyWinners;
  }
  