// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  signInWithPopup,
  signInWithRedirect,
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
  initializeFirestore,
  memoryLocalCache,
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

    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
      });
      console.log("✓ Firestore initialized with memory-only cache (no persistence)");
    } catch (error) {
      db = getFirestore(app);
      console.log("✓ Using existing Firestore instance");
    }
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
 * Detect if we're on a mobile device
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Key for tracking redirect state in sessionStorage
const GOOGLE_REDIRECT_KEY = "google_auth_redirect_pending";

/**
 * Mark that we're about to redirect for Google auth
 */
export function setGoogleRedirectPending() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(GOOGLE_REDIRECT_KEY, "true");
    console.log("📱 Marked Google redirect as pending");
  }
}

/**
 * Check if we have a pending Google redirect
 */
export function isGoogleRedirectPending(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GOOGLE_REDIRECT_KEY) === "true";
}

/**
 * Clear the Google redirect pending flag
 */
export function clearGoogleRedirectPending() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
    console.log("📱 Cleared Google redirect pending flag");
  }
}

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
 * Try to upgrade Google avatar URL to a higher-resolution variant
 */
function buildHighResGoogleUrl(googlePhotoURL: string): string {
  let url = googlePhotoURL;

  if (/=s\d+-c(?:$|\?)/.test(url)) {
    url = url.replace(/=s\d+-c/, "=s400-c");
    return url;
  }

  if (/(\?|&)sz=\d+/.test(url)) {
    url = url.replace(/(\?|&)sz=\d+/, "$1sz=400");
    return url;
  }

  return url;
}

/**
 * Download Google profile photo and upload to Firebase Storage.
 */
async function migratePhotoToFirebaseStorage(
  uid: string,
  googlePhotoURL: string | null
): Promise<string | null> {
  if (!googlePhotoURL) return null;

  if (googlePhotoURL.includes("firebasestorage.googleapis.com")) {
    console.log("Photo already in Firebase Storage, skipping migration");
    return googlePhotoURL;
  }

  if (!googlePhotoURL.includes("googleusercontent.com")) {
    console.log("Photo is not from Google, skipping migration");
    return null;
  }

  try {
    const storage = getFirebaseStorage();
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
      return null;
    }

    const blob = await response.blob();
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
    return null;
  }
}

/**
 * Ensure a basic user document exists.
 */
export async function ensureUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);

    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: firebasePhotoURL ?? null,
      photoMigrationFailed: firebasePhotoURL === null,
      emailVerified: false,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as any;
  const updates: Record<string, any> = {};

  if (!data.email && user.email) {
    updates.email = user.email;
  }
  if (!data.username && user.displayName) {
    updates.username = user.displayName;
  }

  if (data.emailVerified === undefined) {
    updates.emailVerified = false;
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
    const sourceGoogleUrl = (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

    if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
      console.log(
        "Attempting photo migration for existing user. Reason:",
        hasNoPhoto ? "no photo" : "google URL stored"
      );

      const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, sourceGoogleUrl);

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
  }
}

/**
 * Process Google user after sign-in (works for both popup and redirect)
 * Called from AuthContext when handling redirect result
 */
export async function processGoogleUser(user: User): Promise<{
  isNewUser: boolean;
  hasHandle: boolean;
}> {
  const db = getFirebaseDb();

  console.log("=== Processing Google User ===");
  console.log("User ID:", user.uid);
  console.log("Google Photo URL (Auth):", user.photoURL);

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let hasHandle = false;
  let isNewUser = false;

  if (!snap.exists()) {
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);

    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: firebasePhotoURL ?? null,
      photoMigrationFailed: firebasePhotoURL === null,
      emailVerified: true, // Google users are pre-verified
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    isNewUser = true;
    console.log("✓ New user document created");
  } else {
    const data = snap.data() as any;
    hasHandle = !!data.handle;

    const updates: Record<string, any> = {};
    if (!data.email && user.email) updates.email = user.email;
    if (!data.username && user.displayName) updates.username = user.displayName;

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
      const sourceGoogleUrl = (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

      if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
        console.log(
          "Attempting photo migration on sign-in. Reason:",
          hasNoPhoto ? "no photo" : "google URL stored"
        );

        const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, sourceGoogleUrl);

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

  return { isNewUser, hasHandle };
}

/**
 * Google sign-in - uses redirect on mobile, popup on desktop
 */
export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();

  // Mobile: use redirect flow
  if (isMobile()) {
    console.log("📱 Mobile detected - using redirect flow");
    setGoogleRedirectPending();
    await signInWithRedirect(auth, googleProvider);
    // Page will redirect - this code won't continue
    return null;
  }

  // Desktop: use popup flow
  console.log("🖥️ Desktop detected - using popup flow");
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const { isNewUser, hasHandle } = await processGoogleUser(user);

  const info = getAdditionalUserInfo(result);
  const isNewUserFromAuth = info?.isNewUser ?? false;

  return {
    user,
    isNewUser: isNewUserFromAuth || isNewUser,
    hasHandle,
  };
}

/**
 * Email sign-up
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
    emailVerified: false,
    publishedIdeaIds: [],
    createdAt: serverTimestamp(),
  });

  console.log("✓ User created in Firebase Auth and Firestore");

  return cred;
}

/**
 * Email sign-in
 */
export async function emailSignIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}