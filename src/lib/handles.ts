// src/lib/handles.ts
import { getFirebaseDb } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

/**
 * Sanitize a handle to only allow lowercase letters, numbers, and underscores
 */
export function sanitizeHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

/**
 * Generate a default handle from username
 */
export function generateDefaultHandle(username: string, uid: string): string {
  const base = sanitizeHandle(username || "user");
  const suffix = uid.slice(0, 6);
  return `${base}_${suffix}`;
}

/**
 * Check if a handle is available
 */
export async function isHandleAvailable(
  handle: string,
  currentUserUid?: string
): Promise<boolean> {
  const sanitized = sanitizeHandle(handle);

  if (!sanitized || sanitized.length < 3) {
    return false;
  }

  const db = getFirebaseDb();
  const handleDoc = await getDoc(doc(db, "user_handles", sanitized));

  if (!handleDoc.exists()) return true;

  // If checking for current user, allow if they already own it
  if (currentUserUid) {
    return handleDoc.data().uid === currentUserUid;
  }

  return false;
}

/**
 * Claim a handle for a user (initial setup, one-time)
 * This is the ONLY way to set a handle. Handles are permanent.
 */
export async function claimHandleForUser(
  uid: string,
  username: string,
  handle: string
): Promise<void> {
  const sanitized = sanitizeHandle(handle);

  if (!sanitized || sanitized.length < 3) {
    throw new Error(
      "Handle must be at least 3 characters (letters, numbers, underscore only)"
    );
  }

  const db = getFirebaseDb();

  await runTransaction(db, async (transaction) => {
    const handleRef = doc(db, "user_handles", sanitized);
    const handleDoc = await transaction.get(handleRef);

    if (handleDoc.exists()) {
      throw new Error("Handle is already taken");
    }

    // Create handle document
    transaction.set(handleRef, {
      uid,
      createdAt: new Date().toISOString(),
    });

    // Update user document with handle (one-time)
    const userRef = doc(db, "users", uid);
    transaction.update(userRef, {
      handle: sanitized,
      username: username.trim(),
    });
  });
}
