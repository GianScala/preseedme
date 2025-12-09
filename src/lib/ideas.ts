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
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { Idea } from "@/types";

// ==========================================
// TYPES & MAPPING
// ==========================================

export type IdeaWithLikes = Idea & {
  likeCount?: number;
  likedByUserIds?: string[];
};

export function mapIdeaDoc(snapshot: any): IdeaWithLikes {
  const data = snapshot.data() || {};
  // Basic safety check for data integrity
  if (!data.title) {
     console.warn(`[DEBUG] Warning: Mapping document ${snapshot.id} which seems missing essential data (title).`);
  }

  return {
    id: snapshot.id,
    title: data.title,
    oneLiner: data.oneLiner,
    description: data.description,
    founderId: data.founderId,
    founderHandle: data.founderHandle,
    founderUsername: data.founderUsername,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),

    // Links & media
    websiteUrl: data.websiteUrl,
    demoVideoUrl: data.demoVideoUrl,
    thumbnailUrl: data.thumbnailUrl,

    // Primary categorization
    category: data.category,
    tags: data.tags ?? [],

    // Tag-style fields
    sector: data.sector,
    sectors: data.sectors ?? [],
    targetAudience: data.targetAudience,
    targetAudiences: data.targetAudiences ?? [],
    targetDemographics: data.targetDemographics ?? [],
    revenueModels: data.revenueModels ?? [],

    // Business metrics
    foundedYear: data.foundedYear,
    totalRevenueSinceInception: data.totalRevenueSinceInception,
    monthlyRecurringRevenue: data.monthlyRecurringRevenue,
    userCount: data.userCount,
    targetMarket: data.targetMarket,

    // 🧠 Team / why they'll win
    teamBackground: data.teamBackground,
    teamWhyYouWillWin: data.teamWhyYouWillWin,
    industryInsights: data.industryInsights,
    valuePropositionDetail: data.valuePropositionDetail,

    // 💸 Fundraising
    isFundraising: data.isFundraising,
    fundraisingGoal: data.fundraisingGoal,
    fundraisingRaisedSoFar: data.fundraisingRaisedSoFar,
    fundraisingMinCheckSize: data.fundraisingMinCheckSize,

    // Likes
    likeCount: data.likeCount ?? 0,
    likedByUserIds: data.likedByUserIds ?? [],
  };
}

// ==========================================
// MAIN FETCH FUNCTIONS
// ==========================================

export async function getLatestIdeas(
  limitCount = 50
): Promise<IdeaWithLikes[]> {
  // console.log(`[DEBUG] Fetching latest ${limitCount} ideas...`);
  const db = getFirebaseDb();
  const ideasRef = collection(db, "ideas");
  const q = query(ideasRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  // console.log(`[DEBUG] Fetched ${snap.size} latest ideas.`);
  return snap.docs.map(mapIdeaDoc);
}

// ------------------------------------------------------------------
// SECTION: FEATURED PROJECT
// ------------------------------------------------------------------

/**
 * STEP 1: Get the ID string from the 'featured_projects' collection
 */
export async function getFeaturedProjectId(): Promise<string | null> {
  console.log("[DEBUG] STEP 1: Attempting to fetch Project ID from 'featured_projects' collection...");
  const db = getFirebaseDb();
  
  try {
    const featuredRef = collection(db, "featured_projects");
    const q = query(featuredRef, limit(1));
    
    console.log("[DEBUG] Executing query against Firestore 'featured_projects'...");
    const snap = await getDocs(q);

    console.log(`[DEBUG] Query complete. Found ${snap.size} documents in 'featured_projects'.`);

    if (snap.empty) {
        console.warn("[DEBUG] WARNING: 'featured_projects' collection is empty or unreadable.");
        return null;
    }

    const docData = snap.docs[0].data();
    console.log("[DEBUG] Raw data found in featured document:", docData);

    const projectId = docData.projectId as string;

    if (!projectId || typeof projectId !== 'string') {
       console.error("[DEBUG] CRITICAL: Found document, but 'projectId' field is missing or not a string.");
       return null;
    }
    
    console.log(`[DEBUG] SUCCESS: Found featured projectId string: '${projectId}'`);
    return projectId.trim(); // trimming just in case of whitespace

  } catch (error) {
    console.error("[DEBUG] ERROR in getFeaturedProjectId:", error);
    return null;
  }
}

/**
 * STEP 2: Use the ID to fetch the actual full Idea document
 */
export async function getFeaturedIdea(): Promise<IdeaWithLikes | null> {
  console.log("--- [DEBUG] Starting full featured idea fetch sequence ---");
  
  // 1. Run Step 1 above
  const projectId = await getFeaturedProjectId();

  if (!projectId) {
    console.warn("[DEBUG] Aborting sequence because no valid projectId string was found in Step 1.");
    console.log("------------------------------------------------------------");
    return null;
  }

  // 2. Fetch the actual document
  console.log(`[DEBUG] STEP 2: Attempting to fetch actual document from 'ideas' collection using ID: '${projectId}'...`);
  const db = getFirebaseDb();
  const ideaRef = doc(db, "ideas", projectId);
  
  try {
    const snap = await getDoc(ideaRef);

    if (!snap.exists()) {
      console.error(`[DEBUG] CRITICAL ERROR: The ID '${projectId}' was found in 'featured_projects', BUT that document ID does NOT exist in the 'ideas' collection. Check for typos in the ID.`);
      console.log("------------------------------------------------------------");
      return null;
    }

    console.log(`[DEBUG] SUCCESS: Found the actual idea document for ID '${projectId}'. Mapping data now...`);
    const mappedDoc = mapIdeaDoc(snap);
    console.log("--- [DEBUG] Finished featured idea fetch sequence successfully ---");
    return mappedDoc;

  } catch (err) {
    console.error("[DEBUG] ERROR trying to fetch the specific idea document:", err);
    console.log("------------------------------------------------------------");
    return null;
  }
}

// ------------------------------------------------------------------
// SECTION: PROJECT DAILY
// ------------------------------------------------------------------

/**
 * STEP 1 (Daily): Get the ID string from the 'project_daily' collection
 */
export async function getProjectDailyId(): Promise<string | null> {
  console.log("[DEBUG] STEP 1 (Daily): Attempting to fetch Project ID from 'project_daily' collection...");
  const db = getFirebaseDb();
  
  try {
    const dailyRef = collection(db, "project_daily");
    const q = query(dailyRef, limit(1));
    
    console.log("[DEBUG] Executing query against Firestore 'project_daily'...");
    const snap = await getDocs(q);

    console.log(`[DEBUG] Query complete. Found ${snap.size} documents in 'project_daily'.`);

    if (snap.empty) {
        console.warn("[DEBUG] WARNING: 'project_daily' collection is empty or unreadable.");
        return null;
    }

    const docData = snap.docs[0].data();
    console.log("[DEBUG] Raw data found in project_daily document:", docData);

    const projectId = docData.projectId as string;

    if (!projectId || typeof projectId !== 'string') {
       console.error("[DEBUG] CRITICAL: Found document in 'project_daily', but 'projectId' field is missing or not a string.");
       return null;
    }
    
    console.log(`[DEBUG] SUCCESS: Found daily projectId string: '${projectId}'`);
    return projectId.trim();

  } catch (error) {
    console.error("[DEBUG] ERROR in getProjectDailyId:", error);
    return null;
  }
}

/**
 * STEP 2 (Daily): Use the ID to fetch the actual full Idea document
 */
export async function getProjectDaily(): Promise<IdeaWithLikes | null> {
  console.log("--- [DEBUG] Starting full project_daily fetch sequence ---");
  
  // 1. Run Step 1 above
  const projectId = await getProjectDailyId();

  if (!projectId) {
    console.warn("[DEBUG] Aborting sequence because no valid projectId string was found in Step 1 (Daily).");
    console.log("------------------------------------------------------------");
    return null;
  }

  // 2. Fetch the actual document
  console.log(`[DEBUG] STEP 2 (Daily): Attempting to fetch actual document from 'ideas' collection using ID: '${projectId}'...`);
  const db = getFirebaseDb();
  const ideaRef = doc(db, "ideas", projectId);
  
  try {
    const snap = await getDoc(ideaRef);

    if (!snap.exists()) {
      console.error(`[DEBUG] CRITICAL ERROR: The ID '${projectId}' was found in 'project_daily', BUT that document ID does NOT exist in the 'ideas' collection.`);
      console.log("------------------------------------------------------------");
      return null;
    }

    console.log(`[DEBUG] SUCCESS: Found the actual idea document for daily project ID '${projectId}'. Mapping data now...`);
    const mappedDoc = mapIdeaDoc(snap);
    console.log("--- [DEBUG] Finished project_daily fetch sequence successfully ---");
    return mappedDoc;

  } catch (err) {
    console.error("[DEBUG] ERROR trying to fetch the specific daily idea document:", err);
    console.log("------------------------------------------------------------");
    return null;
  }
}

// ==========================================
// INTERACTIONS
// ==========================================

export async function toggleLikeIdea(
  ideaId: string,
  userId: string
): Promise<boolean> {
  const db = getFirebaseDb();
  const ideaRef = doc(db, "ideas", ideaId);

  const newLikedState = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ideaRef);
    if (!snap.exists()) {
      throw new Error("Idea not found");
    }

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