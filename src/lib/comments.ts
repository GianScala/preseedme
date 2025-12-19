// src/lib/comments.ts
import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    Timestamp,
  } from "firebase/firestore";
  import { getFirebaseDb } from "./firebase";
  import type { Comment } from "@/types";
  
  /**
   * Adds a new comment or reply to a specific idea.
   */
  export async function addComment(
    ideaId: string,
    userId: string,
    username: string,
    userHandle: string,
    userPhotoURL: string | null | undefined,
    text: string,
    parentId: string | null = null, // Support for threaded replies
    threadOwnerId: string // NEW: ID of the user who owns the root comment
  ): Promise<Comment> {
    const db = getFirebaseDb();
    const commentsRef = collection(db, "comments");
  
    const commentData = {
      ideaId,
      userId,
      username,
      userHandle,
      userPhotoURL: userPhotoURL || null,
      text: text.trim(),
      parentId: parentId || null, // Null for top-level, string ID for replies
      threadOwnerId, // NEW: Store thread owner for easy deletion permissions
      createdAt: serverTimestamp(),
      isEdited: false,
    };
  
    const docRef = await addDoc(commentsRef, commentData);
  
    return {
      id: docRef.id,
      ideaId,
      userId,
      username,
      userHandle,
      userPhotoURL: userPhotoURL || null,
      text: text.trim(),
      parentId: parentId || null,
      threadOwnerId, // NEW: Include in return object
      createdAt: Date.now(), // Local fallback for immediate UI update
      isEdited: false,
    };
  }
  
  /**
   * Fetches all comments for a specific idea, ordered by creation time.
   */
  export async function getComments(ideaId: string): Promise<Comment[]> {
    const db = getFirebaseDb();
    const commentsRef = collection(db, "comments");
  
    // Requires Composite Index: ideaId (Asc) + createdAt (Asc)
    const q = query(
      commentsRef,
      where("ideaId", "==", ideaId),
      orderBy("createdAt", "asc")
    );
  
    const snap = await getDocs(q);
  
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ideaId: data.ideaId,
        userId: data.userId,
        username: data.username,
        userHandle: data.userHandle,
        userPhotoURL: data.userPhotoURL || null,
        text: data.text,
        parentId: data.parentId || null,
        threadOwnerId: data.threadOwnerId || data.userId, // NEW: Fallback to userId for old comments
        isEdited: data.isEdited || false,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : data.createdAt || Date.now(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toMillis()
            : undefined,
      };
    }) as Comment[];
  }
  
  /**
   * Updates the text of an existing comment.
   * Only the comment owner can edit their own comment.
   */
  export async function updateComment(
    commentId: string,
    newText: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const commentRef = doc(db, "comments", commentId);
  
    await updateDoc(commentRef, {
      text: newText.trim(),
      isEdited: true,
      updatedAt: serverTimestamp(),
    });
  }
  
  /**
   * Deletes a comment by ID.
   * Can be deleted by: (1) Comment owner, OR (2) Idea owner, OR (3) Thread owner
   * Note: When a parent comment is deleted, you may want to handle child replies.
   */
  export async function deleteComment(commentId: string): Promise<void> {
    const db = getFirebaseDb();
    const commentRef = doc(db, "comments", commentId);
    await deleteDoc(commentRef);
  }
  
  /**
   * Delete a comment and all its replies (cascade delete)
   * This works because all replies in a thread share the same threadOwnerId,
   * so Firestore rules allow the thread owner to delete all of them.
   */
  export async function deleteCommentWithReplies(
    commentId: string,
    allComments: Comment[]
  ): Promise<string[]> {
    const db = getFirebaseDb();
    const idsToDelete: string[] = [commentId];
  
    // Find all child replies recursively
    const findChildren = (parentId: string) => {
      const children = allComments.filter((c) => c.parentId === parentId);
      children.forEach((child) => {
        idsToDelete.push(child.id);
        findChildren(child.id); // Recurse for nested replies
      });
    };
  
    findChildren(commentId);
  
    // Delete all comments - Firestore rules will allow this because 
    // all comments in the thread have the same threadOwnerId
    await Promise.all(
      idsToDelete.map((id) => deleteDoc(doc(db, "comments", id)))
    );
  
    return idsToDelete;
  }