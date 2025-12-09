// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export function getFirebaseApp() {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);
  }
  return auth;
}

export function getFirebaseDb() {
  if (!db) {
    const app = getFirebaseApp();
    db = getFirestore(app);
  }
  return db;
}

export function getFirebaseStorage() {
  if (!storage) {
    const app = getFirebaseApp();
    storage = getStorage(app);
  }
  return storage;
}

// ---- helpers ----
const googleProvider = new GoogleAuthProvider();

/**
 * Delete all existing profile photos for a user
 */
async function deleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const userPhotoDir = ref(storage, `profile-photos/${uid}`);

    const listResult = await listAll(userPhotoDir);

    if (listResult.items.length > 0) {
      console.log(`Deleting ${listResult.items.length} old photo(s) for user ${uid}`);
      const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
      await Promise.all(deletePromises);
      console.log("Old photos deleted successfully");
    }
  } catch (err) {
    console.log("Could not delete old photos (non-critical):", err);
  }
}

/**
 * Try to upgrade Google avatar URL to a higher-resolution variant,
 * but fall back to the original URL if we don't recognize the pattern.
 */
function buildHighResGoogleUrl(googlePhotoURL: string): string {
  let url = googlePhotoURL;

  // 1) ...=sNNN-c or ...=sNNN-c?query
  if (/=s\d+-c(?:$|\?)/.test(url)) {
    url = url.replace(/=s\d+-c/, "=s400-c");
    return url;
  }

  // 2) ?sz=NNN or &sz=NNN
  if (/(\?|&)sz=\d+/.test(url)) {
    url = url.replace(/(\?|&)sz=\d+/, "$1sz=400");
    return url;
  }

  // If we don't know how to bump the size, just use the original
  return url;
}

/**
 * Download Google profile photo and upload to Firebase Storage.
 * Saves to: profile-photos/{uid}/profile.jpg
 *
 * IMPORTANT:
 * - Returns a Firebase Storage URL on success.
 * - Returns null on ANY failure (429, 4xx, 5xx, CORS, etc.).
 * - Never returns a googleusercontent.com URL.
 */
async function migratePhotoToFirebaseStorage(
  uid: string,
  googlePhotoURL: string | null
): Promise<string | null> {
  if (!googlePhotoURL) return null;

  // Already a Firebase Storage URL? No migration needed.
  if (googlePhotoURL.includes("firebasestorage.googleapis.com")) {
    console.log("Photo already in Firebase Storage, skipping migration");
    return googlePhotoURL;
  }

  // Only attempt migration for Google profile URLs.
  if (!googlePhotoURL.includes("googleusercontent.com")) {
    console.log("Photo is not from Google, skipping migration");
    return null;
  }

  try {
    const storage = getFirebaseStorage();

    // New path: profile-photos/{uid}/profile.jpg
    const storagePath = `profile-photos/${uid}/profile.jpg`;
    const storageRef = ref(storage, storagePath);

    console.log("Migrating Google photo to Firebase Storage:", storagePath);

    const highResUrl = buildHighResGoogleUrl(googlePhotoURL);
    console.log("Using Google photo URL:", highResUrl);

    const response = await fetch(highResUrl);

    if (!response.ok) {
      console.error("Failed to fetch photo from Google", {
        url: highResUrl,
        status: response.status,
        statusText: response.statusText,
      });

      // DO NOT return googlePhotoURL here – it's failing / rate-limited.
      return null;
    }

    const blob = await response.blob();

    // Delete old photos only AFTER we know we have a valid blob
    await deleteAllUserPhotos(uid);

    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000",
    });

    const firebasePhotoURL = await getDownloadURL(storageRef);
    console.log("✓ Photo migrated successfully:", firebasePhotoURL);

    return firebasePhotoURL;
  } catch (error) {
    console.error("Failed to migrate profile photo:", error);
    // On any error (including CORS/429), just bail out with null.
    return null;
  }
}

/**
 * Ensure a basic user document exists.
 *
 * Fields:
 * - email
 * - username
 * - handle
 * - photoURL (Firebase Storage URL or null ONLY)
 * - photoMigrationFailed (boolean, so we don't hammer Google if it fails)
 * - emailVerified (boolean - for Resend email verification)
 *
 * NOTE: We NEVER persist googleusercontent.com URLs to Firestore anymore.
 */
export async function ensureUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // New user - try to migrate their Google photo ONCE.
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(
      user.uid,
      user.photoURL
    );

    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: firebasePhotoURL ?? null,
      photoMigrationFailed: firebasePhotoURL === null,
      emailVerified: false, // 👈 NEW: Track verification in Firestore
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    return;
  }

  // Existing user - backfill fields if missing
  const data = snap.data() as any;
  const updates: Record<string, any> = {};

  if (!data.email && user.email) {
    updates.email = user.email;
  }
  if (!data.username && user.displayName) {
    updates.username = user.displayName;
  }

  // 👈 NEW: Ensure emailVerified field exists (backfill for existing users)
  if (data.emailVerified === undefined) {
    updates.emailVerified = false;
  }

  const firestorePhotoURL: string | null = data.photoURL ?? null;
  const photoMigrationFailed: boolean = !!data.photoMigrationFailed;

  const hasFirebasePhoto =
    typeof firestorePhotoURL === "string" &&
    firestorePhotoURL.includes("firebasestorage.googleapis.com");

  // Old data may still have a Google URL stored; clean that up.
  const hasGooglePhoto =
    typeof firestorePhotoURL === "string" &&
    firestorePhotoURL.includes("googleusercontent.com");

  const hasNoPhoto = !firestorePhotoURL;

  // Only attempt migration if:
  // - we don't already have a Firebase photo
  // - AND we haven't marked migration as failed
  if (!hasFirebasePhoto && !photoMigrationFailed) {
    // Prefer the existing Firestore Google URL if it exists, otherwise Auth's photoURL.
    const sourceGoogleUrl =
      (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

    if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
      console.log(
        "Attempting photo migration for existing user. Reason:",
        hasNoPhoto ? "no photo" : "google URL stored"
      );

      const firebasePhotoURL = await migratePhotoToFirebaseStorage(
        user.uid,
        sourceGoogleUrl
      );

      if (firebasePhotoURL) {
        updates.photoURL = firebasePhotoURL;
        updates.photoMigrationFailed = false;
      } else {
        // Migration failed (e.g., 429); don't keep trying forever.
        updates.photoURL = null;
        updates.photoMigrationFailed = true;
      }
    }
  }

  // If we still have a googleusercontent.com URL after all of that, clear it.
  if (hasGooglePhoto && !updates.photoURL) {
    updates.photoURL = null;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }
}

/**
 * Google sign-in.
 * - Ensures a user doc exists.
 * - Tries to migrate profile photo to Firebase Storage (once).
 * - Google users are automatically verified (no email verification needed)
 * - Returns metadata so we know if user is NEW and whether they already have a handle.
 */
export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  console.log("=== Google Sign-In ===");
  console.log("User ID:", user.uid);
  console.log("Google Photo URL (Auth):", user.photoURL);

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let hasHandle = false;
  let createdDoc = false;

  if (!snap.exists()) {
    // First time we've ever seen this user in Firestore
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(
      user.uid,
      user.photoURL
    );

    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: firebasePhotoURL ?? null,
      photoMigrationFailed: firebasePhotoURL === null,
      emailVerified: true, // 👈 Google users are pre-verified
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    createdDoc = true;
    console.log("✓ New user document created");
  } else {
    const data = snap.data() as any;
    hasHandle = !!data.handle;

    const updates: Record<string, any> = {};
    if (!data.email && user.email) updates.email = user.email;
    if (!data.username && user.displayName) updates.username = user.displayName;

    // 👈 Google users should always be verified
    if (!data.emailVerified) {
      updates.emailVerified = true;
    }

    const firestorePhotoURL: string | null = data.photoURL ?? null;
    const photoMigrationFailed: boolean = !!data.photoMigrationFailed;

    const hasFirebasePhoto =
      typeof firestorePhotoURL === "string" &&
      firestorePhotoURL.includes("firebasestorage.googleapis.com");

    const hasGooglePhoto =
      typeof firestorePhotoURL === "string" &&
      firestorePhotoURL.includes("googleusercontent.com");

    const hasNoPhoto = !firestorePhotoURL;

    if (!hasFirebasePhoto && !photoMigrationFailed) {
      const sourceGoogleUrl =
        (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

      if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
        console.log(
          "Attempting photo migration on sign-in. Reason:",
          hasNoPhoto ? "no photo" : "google URL stored"
        );

        const firebasePhotoURL = await migratePhotoToFirebaseStorage(
          user.uid,
          sourceGoogleUrl
        );

        if (firebasePhotoURL) {
          updates.photoURL = firebasePhotoURL;
          updates.photoMigrationFailed = false;
        } else {
          updates.photoURL = null;
          updates.photoMigrationFailed = true;
        }
      }
    }

    if (hasGooglePhoto && !updates.photoURL) {
      updates.photoURL = null;
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
      console.log("✓ User document updated");
    }
  }

  const info = getAdditionalUserInfo(result);
  const isNewUserFromAuth = info?.isNewUser ?? false;

  return {
    user,
    isNewUser: isNewUserFromAuth || createdDoc,
    hasHandle,
  };
}

/**
 * Email sign-up:
 * - Creates Firebase Auth user
 * - Creates a Firestore user doc with emailVerified: false
 * - Username is set from the form
 * - Handle will be chosen in /onboarding/handle
 * 
 * 🚨 IMPORTANT: This does NOT send verification emails!
 * The calling code (register page) should send verification + welcome emails via Resend API routes.
 */
export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  username: string
) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName: username });

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    email,
    username,
    handle: null,
    photoURL: null,
    photoMigrationFailed: false,
    emailVerified: false, // 👈 Start as unverified - Resend will handle verification
    publishedIdeaIds: [],
    createdAt: serverTimestamp(),
  });

  console.log("✓ User created in Firebase Auth and Firestore");
  console.log("⚠️ Verification emails should be sent by calling code via Resend API");

  return cred;
}

/**
 * Email sign-in:
 * - Signs in with Firebase Auth
 * - Ensures the profile exists
 * - Returns the full UserCredential so the UI can check emailVerified status in Firestore
 */
export async function emailSignIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}