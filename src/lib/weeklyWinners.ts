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

  export async function fetchWeeklyWinnersFromFirebase(): Promise<WeeklyWinner[]> {
    const db = getFirebaseDb();
  
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
        ideaId: docSnap.id,
        rank: data.rank ?? 4,
      };
    });
  
    const ideaIds = ideaIdsWithRank.map((x) => x.ideaId);
  
    const ideasRef = collection(db, "ideas");
    const ideasQuery = query(
      ideasRef,
      where(documentId(), "in", ideaIds)
    );
    const ideasSnap = await getDocs(ideasQuery);
  
    const ideaById = new Map<string, IdeaWithLikes>();
    ideasSnap.docs.forEach((docSnap) => {
      ideaById.set(docSnap.id, mapIdeaDoc(docSnap));
    });
  
    const weeklyWinners: WeeklyWinner[] = ideaIdsWithRank
      .map(({ ideaId, rank }) => {
        const idea = ideaById.get(ideaId);
        if (!idea) return null;
        return { idea, rank };
      })
      .filter((x): x is WeeklyWinner => x !== null)
      .sort((a, b) => a.rank - b.rank);
  
    return weeklyWinners;
  }
  