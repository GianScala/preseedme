// src/lib/ideas.ts
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  runTransaction,
  doc,
  getDocsFromServer, // ✅ Force server fetch
  getDocFromServer,  // ✅ Force server fetch
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { Idea } from "@/types";

// Toggle this when you need verbose tracing
const DEBUG = false;

export type IdeaWithLikes = Idea & {
  likeCount?: number;
  likedByUserIds?: string[];
  founderAvatarUrl?: string | null;
};

const toMillis = (v: any): number | null => {
  if (!v) return null;
  if (typeof v === "number") return v;
  if (typeof v.toMillis === "function") return v.toMillis();
  return null;
};

export function mapIdeaDoc(snapshot: any): IdeaWithLikes {
  const data = snapshot.data?.() || {};

  if (DEBUG && !data.title) {
    console.warn(
      `[ideas.ts] Mapping doc ${snapshot.id} missing title (check data integrity).`
    );
  }

  // ✅ Enhanced timestamp handling with fallback
  const createdAtValue = toMillis(data.createdAt) ?? data.createdAt ?? Date.now();
  const updatedAtValue = toMillis(data.updatedAt) ?? data.updatedAt ?? null;
  const deliverablesUpdatedValue = toMillis(data.deliverablesUpdatedAt) ?? data.deliverablesUpdatedAt ?? null;
  
  // Use updatedAt if available, otherwise fall back to deliverablesUpdatedAt
  const finalUpdatedAt = updatedAtValue || deliverablesUpdatedValue;

  return {
    // identity
    id: snapshot.id,

    // core
    title: data.title,
    oneLiner: data.oneLiner,
    description: data.description,

    // founder
    founderId: data.founderId,
    founderHandle: data.founderHandle,
    founderUsername: data.founderUsername,
    founderAvatarUrl:
      data.founderAvatarUrl ??
      data.founderPhotoURL ??
      data.photoURL ??
      data.avatarUrl ??
      data.avatar ??
      data.founderProfileImage ??
      null,

    // timestamps
    createdAt: createdAtValue,
    updatedAt: finalUpdatedAt,

    // media
    websiteUrl: data.websiteUrl,
    demoVideoUrl: data.demoVideoUrl,
    thumbnailUrl: data.thumbnailUrl,

    // categorization
    category: data.category,
    tags: data.tags ?? [],
    sector: data.sector,
    sectors: data.sectors ?? [],
    targetAudience: data.targetAudience,
    targetAudiences: data.targetAudiences ?? [],
    targetDemographics: data.targetDemographics ?? [],
    revenueModels: data.revenueModels ?? [],

    // business metrics
    foundedYear: data.foundedYear,
    totalRevenueSinceInception: data.totalRevenueSinceInception,
    monthlyRecurringRevenue: data.monthlyRecurringRevenue,
    userCount: data.userCount,
    targetMarket: data.targetMarket,

    // why win
    teamBackground: data.teamBackground,
    teamWhyYouWillWin: data.teamWhyYouWillWin,
    industryInsights: data.industryInsights,
    valuePropositionDetail: data.valuePropositionDetail,

    // deliverables
    deliverablesOverview: data.deliverablesOverview,
    deliverables: data.deliverables ?? [],
    deliverablesUpdatedAt: data.deliverablesUpdatedAt,
    deliverablesMilestones: data.deliverablesMilestones,

    // fundraising
    isFundraising: data.isFundraising,
    fundraisingGoal: data.fundraisingGoal,
    fundraisingRaisedSoFar: data.fundraisingRaisedSoFar,
    fundraisingMinCheckSize: data.fundraisingMinCheckSize,

    // likes
    likeCount: data.likeCount ?? 0,
    likedByUserIds: data.likedByUserIds ?? [],

    // achievements
    achievements: data.achievements ?? [],
  };
}

// ==========================================
// FETCH: LISTS
// ==========================================
export async function getLatestIdeas(limitCount = 50): Promise<IdeaWithLikes[]> {
  const db = getFirebaseDb();
  const ideasRef = collection(db, "ideas");
  const q = query(ideasRef, orderBy("createdAt", "desc"), limit(limitCount));
  
  // ✅ FORCE SERVER FETCH - bypass cache
  const snap = await getDocsFromServer(q);
  return snap.docs.map(mapIdeaDoc);
}

// ==========================================
// FETCH: FEATURED / DAILY (ID-then-IDEA)
// ==========================================
async function getCollectionProjectId(collectionName: string): Promise<string | null> {
  const db = getFirebaseDb();

  try {
    const ref = collection(db, collectionName);
    const q = query(ref, limit(1));
    
    // ✅ FORCE SERVER FETCH - bypass cache
    const snap = await getDocsFromServer(q);

    if (DEBUG) {
      console.log(`[ideas.ts] ${collectionName}: found ${snap.size} docs (fresh from server)`);
    }

    if (snap.empty) return null;

    const projectId = snap.docs[0].data()?.projectId as string;

    if (!projectId || typeof projectId !== "string") {
      if (DEBUG) {
        console.error(
          `[ideas.ts] ${collectionName}: projectId missing or invalid:`,
          snap.docs[0].data()
        );
      }
      return null;
    }

    return projectId.trim();
  } catch (error) {
    console.error(`[ideas.ts] Error reading ${collectionName}:`, error);
    return null;
  }
}

async function getIdeaById(ideaId: string): Promise<IdeaWithLikes | null> {
  const db = getFirebaseDb();

  try {
    // ✅ FORCE SERVER FETCH - bypass cache
    const snap = await getDocFromServer(doc(db, "ideas", ideaId));
    
    if (DEBUG) {
      console.log(`[ideas.ts] Fetched idea ${ideaId} from server`);
    }
    
    return snap.exists() ? mapIdeaDoc(snap) : null;
  } catch (error) {
    console.error(`[ideas.ts] Error fetching idea ${ideaId}:`, error);
    return null;
  }
}

export async function getFeaturedProjectId(): Promise<string | null> {
  return getCollectionProjectId("featured_projects");
}

export async function getProjectDailyId(): Promise<string | null> {
  return getCollectionProjectId("project_daily");
}

export async function getFeaturedIdea(): Promise<IdeaWithLikes | null> {
  const projectId = await getFeaturedProjectId();
  return projectId ? getIdeaById(projectId) : null;
}

export async function getProjectDaily(): Promise<IdeaWithLikes | null> {
  const projectId = await getProjectDailyId();
  return projectId ? getIdeaById(projectId) : null;
}

// ==========================================
// INTERACTIONS
// ==========================================
export async function toggleLikeIdea(ideaId: string, userId: string): Promise<boolean> {
  const db = getFirebaseDb();
  const ideaRef = doc(db, "ideas", ideaId);

  const newLikedState = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ideaRef);
    if (!snap.exists()) throw new Error("Idea not found");

    const data = snap.data() as any;
    const likedByUserIds: string[] = data.likedByUserIds ?? [];
    const likeCount: number = data.likeCount ?? 0;

    const alreadyLiked = likedByUserIds.includes(userId);
    const updatedLikes = alreadyLiked
      ? likedByUserIds.filter((id) => id !== userId)
      : [...likedByUserIds, userId];

    const updatedCount = alreadyLiked ? likeCount - 1 : likeCount + 1;

    tx.update(ideaRef, {
      likedByUserIds: updatedLikes,
      likeCount: updatedCount,
    });

    return !alreadyLiked;
  });

  return newLikedState;
}