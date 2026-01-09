// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  initializeFirestore,
  memoryLocalCache,
} from "firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const app = getFirebaseApp();
    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
      });
      console.log("Firestore initialized with memory cache");
    } catch {
      db = getFirestore(app);
      console.log("Using existing Firestore instance");
    }
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

// ──────────────────────────────────────────────────────────────
// Google Auth – Redirect (recommended for mobile)
// ──────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogleRedirect(): Promise<void> {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
  await signInWithRedirect(getFirebaseAuth(), googleProvider);
}

export async function handleGoogleRedirectResult(): Promise<{
  user: User;
  isNewUser: boolean;
  hasHandle: boolean;
} | null> {
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result?.user) return null;

    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    const profileResult = await signInWithGoogleAndCreateProfile();

    return {
      user,
      isNewUser: additionalInfo?.isNewUser ?? profileResult.isNewUser,
      hasHandle: profileResult.hasHandle,
    };
  } catch (error) {
    console.error("Google redirect handling error:", error);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Profile & Photo migration logic
// ──────────────────────────────────────────────────────────────

async function deleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const userPhotoDir = ref(storage, `profile-photos/${uid}`);
    const listResult = await listAll(userPhotoDir);
    if (listResult.items.length > 0) {
      console.log(`Deleting ${listResult.items.length} old photos`);
      await Promise.all(listResult.items.map((item) => deleteObject(item)));
    }
  } catch (err) {
    console.log("Non-critical: could not delete old photos", err);
  }
}

function buildHighResGoogleUrl(googlePhotoURL: string): string {
  let url = googlePhotoURL;
  if (/=s\d+-c(?:$|\?)/.test(url)) {
    return url.replace(/=s\d+-c/, "=s400-c");
  }
  if (/(\?|&)sz=\d+/.test(url)) {
    return url.replace(/(\?|&)sz=\d+/, "$1sz=400");
  }
  return url;
}

async function migratePhotoToFirebaseStorage(
  uid: string,
  googlePhotoURL: string | null
): Promise<string | null> {
  if (!googlePhotoURL) return null;
  if (googlePhotoURL.includes("firebasestorage.googleapis.com")) return googlePhotoURL;
  if (!googlePhotoURL.includes("googleusercontent.com")) return null;

  try {
    const highResUrl = buildHighResGoogleUrl(googlePhotoURL);
    const response = await fetch(highResUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, `profile-photos/${uid}/profile.jpg`);

    await deleteAllUserPhotos(uid);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000",
    });

    const url = await getDownloadURL(storageRef);
    console.log("Photo migrated →", url);
    return url;
  } catch (err) {
    console.error("Photo migration failed:", err);
    return null;
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const photoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: photoURL ?? null,
      photoMigrationFailed: photoURL === null,
      emailVerified: user.providerData.some((p) => p.providerId === "google.com"),
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as any;
  const updates: Record<string, any> = {};

  if (!data.email && user.email) updates.email = user.email;
  if (!data.username && user.displayName) updates.username = user.displayName;
  if (data.emailVerified === undefined) updates.emailVerified = true;

  const photoURL = data.photoURL;
  const migrationFailed = !!data.photoMigrationFailed;

  if (
    photoURL &&
    !photoURL.includes("firebasestorage.googleapis.com") &&
    photoURL.includes("googleusercontent.com") &&
    !migrationFailed
  ) {
    const newPhotoURL = await migratePhotoToFirebaseStorage(user.uid, photoURL);
    updates.photoURL = newPhotoURL;
    updates.photoMigrationFailed = newPhotoURL === null;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }
}

export async function signInWithGoogleAndCreateProfile(): Promise<{
  isNewUser: boolean;
  hasHandle: boolean;
}> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("No authenticated user after Google sign-in");

  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let isNewUser = false;
  let hasHandle = false;

  if (!snap.exists()) {
    const photoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: photoURL ?? null,
      photoMigrationFailed: photoURL === null,
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    isNewUser = true;
  } else {
    const data = snap.data() as any;
    hasHandle = !!data.handle;

    const updates: Record<string, any> = {};
    if (!data.email && user.email) updates.email = user.email;
    if (!data.username && user.displayName) updates.username = user.displayName;
    if (!data.emailVerified) updates.emailVerified = true;

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  }

  return { isNewUser, hasHandle };
}

// ──────────────────────────────────────────────────────────────
// Email flows (unchanged)
// ──────────────────────────────────────────────────────────────

export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  username: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName: username });

  const db = getFirebaseDb();
  await setDoc(doc(db, "users", user.uid), {
    email,
    username,
    handle: null,
    photoURL: null,
    photoMigrationFailed: false,
    emailVerified: false,
    publishedIdeaIds: [],
    createdAt: serverTimestamp(),
  });

  return cred;
}

export async function emailSignIn(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}