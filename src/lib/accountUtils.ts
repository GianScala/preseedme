// src/lib/accountUtils.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    writeBatch, 
    doc, 
    increment, 
    arrayRemove,
    getDoc
  } from "firebase/firestore";
  import { ref, deleteObject, listAll } from "firebase/storage";
  import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
  
  /**
   * ARCHIVE STRATEGY:
   * 1. Find all ideas the user liked -> Remove the like.
   * 2. Find all ideas the user created -> Copy to 'deleted_projects' -> Delete original.
   * 3. Find user profile -> Copy to 'deleted_users' -> Delete original.
   * 4. Delete profile photos from Storage.
   */
  export async function performAccountArchivalAndCleanup(userId: string) {
    const db = getFirebaseDb();
    const storage = getFirebaseStorage();
    const batch = writeBatch(db);
  
    try {
      // --- STEP 1: CLEANUP LIKES (Fix other users' projects) ---
      // Find every idea where this user is in the 'likedByUserIds' array
      const likesQuery = query(
        collection(db, "ideas"), 
        where("likedByUserIds", "array-contains", userId)
      );
      const likedIdeasSnap = await getDocs(likesQuery);
  
      likedIdeasSnap.forEach((ideaDoc) => {
        const ideaRef = doc(db, "ideas", ideaDoc.id);
        // Remove user from the array and decrease the counter
        batch.update(ideaRef, {
          likedByUserIds: arrayRemove(userId),
          likeCount: increment(-1)
        });
      });
  
      // --- STEP 2: ARCHIVE PROJECTS (Move User's Ideas) ---
      const myIdeasQuery = query(
        collection(db, "ideas"),
        where("founderId", "==", userId)
      );
      const myIdeasSnap = await getDocs(myIdeasQuery);
  
      myIdeasSnap.forEach((ideaDoc) => {
        const ideaData = ideaDoc.data();
        
        // A. Copy to 'deleted_projects' collection
        const archiveRef = doc(db, "deleted_projects", ideaDoc.id);
        batch.set(archiveRef, {
          ...ideaData,
          archivedAt: Date.now(),
          originalCollection: "ideas"
        });
  
        // B. Delete from 'ideas' collection
        const originalRef = doc(db, "ideas", ideaDoc.id);
        batch.delete(originalRef);
      });
  
      // --- STEP 3: ARCHIVE USER PROFILE ---
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // A. Copy to 'deleted_users'
        const archiveUserRef = doc(db, "deleted_users", userId);
        batch.set(archiveUserRef, {
          ...userData,
          archivedAt: Date.now()
        });
  
        // B. Delete original
        batch.delete(userRef);
      }
  
      // Commit all Database changes at once
      await batch.commit();
  
      // --- STEP 4: CLEANUP STORAGE (Profile Photos) ---
      // We do this last. We try to clear their folder.
      try {
        const listRef = ref(storage, `profile-photos/${userId}`);
        const listRes = await listAll(listRef);
        // Delete all files found in their folder
        await Promise.all(listRes.items.map((itemRef) => deleteObject(itemRef)));
      } catch (storageErr) {
        console.warn("Storage cleanup warning (folder might be empty):", storageErr);
      }
  
      return true;
    } catch (error) {
      console.error("Account cleanup failed:", error);
      throw error;
    }
  }