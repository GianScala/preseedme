// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
      db = initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch (error) {
      db = getFirestore(app);
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

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

async function deleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const userPhotoDir = ref(storage, `profile-photos/${uid}`);
    const listResult = await listAll(userPhotoDir);
    if (listResult.items.length > 0) {
      await Promise.all(listResult.items.map((itemRef) => deleteObject(itemRef)));
    }
  } catch (err) {
    // Non-critical
  }
}

function buildHighResGoogleUrl(googlePhotoURL: string): string {
  if (/=s\d+-c(?:$|\?)/.test(googlePhotoURL)) {
    return googlePhotoURL.replace(/=s\d+-c/, "=s400-c");
  }
  if (/(\?|&)sz=\d+/.test(googlePhotoURL)) {
    return googlePhotoURL.replace(/(\?|&)sz=\d+/, "$1sz=400");
  }
  return googlePhotoURL;
}

async function migratePhotoToFirebaseStorage(
  uid: string,
  googlePhotoURL: string | null
): Promise<string | null> {
  if (!googlePhotoURL) return null;
  if (googlePhotoURL.includes("firebasestorage.googleapis.com")) return googlePhotoURL;
  if (!googlePhotoURL.includes("googleusercontent.com")) return null;

  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, `profile-photos/${uid}/profile.jpg`);
    const response = await fetch(buildHighResGoogleUrl(googlePhotoURL));
    if (!response.ok) return null;

    const blob = await response.blob();
    await deleteAllUserPhotos(uid);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000",
    });
    return await getDownloadURL(storageRef);
  } catch (error) {
    return null;
  }
}

function migratePhotoInBackground(uid: string, photoURL: string | null) {
  if (!photoURL) return;
  migratePhotoToFirebaseStorage(uid, photoURL)
    .then(async (url) => {
      const userRef = doc(getFirebaseDb(), "users", uid);
      if (url) {
        await updateDoc(userRef, { photoURL: url, photoMigrationFailed: false });
      } else {
        await updateDoc(userRef, { photoMigrationFailed: true });
      }
    })
    .catch(() => {});
}

/**
 * Process Google user and create/update Firestore doc
 */
export async function processGoogleUser(user: User): Promise<{ isNewUser: boolean; hasHandle: boolean }> {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: null,
      photoMigrationFailed: false,
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    migratePhotoInBackground(user.uid, user.photoURL);
    return { isNewUser: true, hasHandle: false };
  }

  const data = snap.data() as any;
  const updates: Record<string, any> = {};
  if (!data.email && user.email) updates.email = user.email;
  if (!data.username && user.displayName) updates.username = user.displayName;
  if (!data.emailVerified) updates.emailVerified = true;

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }

  if (!data.photoURL && !data.photoMigrationFailed) {
    migratePhotoInBackground(user.uid, user.photoURL);
  }

  return { isNewUser: false, hasHandle: !!data.handle };
}

/**
 * Google sign-in - redirect on mobile, popup on desktop
 * Returns null on mobile (page redirects)
 */
export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();

  if (isMobile()) {
    // Mobile: redirect flow (instant, no popup issues)
    await signInWithRedirect(auth, googleProvider);
    return null; // Page redirects, won't reach here
  }

  // Desktop: popup flow
  const result = await signInWithPopup(auth, googleProvider);
  const { isNewUser, hasHandle } = await processGoogleUser(result.user);
  const info = getAdditionalUserInfo(result);

  return {
    user: result.user,
    isNewUser: info?.isNewUser ?? isNewUser,
    hasHandle,
  };
}

/**
 * Check for redirect result on page load (for mobile flow)
 */
export async function checkGoogleRedirectResult(): Promise<{
  user: User;
  isNewUser: boolean;
  hasHandle: boolean;
} | null> {
  const auth = getFirebaseAuth();
  
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const { isNewUser, hasHandle } = await processGoogleUser(result.user);
    const info = getAdditionalUserInfo(result);

    return {
      user: result.user,
      isNewUser: info?.isNewUser ?? isNewUser,
      hasHandle,
    };
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
}

export async function ensureUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: null,
      photoMigrationFailed: false,
      emailVerified: false,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    migratePhotoInBackground(user.uid, user.photoURL);
    return;
  }

  const data = snap.data() as any;
  const updates: Record<string, any> = {};
  if (!data.email && user.email) updates.email = user.email;
  if (!data.username && user.displayName) updates.username = user.displayName;
  if (data.emailVerified === undefined) updates.emailVerified = false;

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }

  if (!data.photoURL && !data.photoMigrationFailed) {
    migratePhotoInBackground(user.uid, user.photoURL);
  }
}

export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  username: string
) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });

  await setDoc(doc(db, "users", cred.user.uid), {
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

export async function emailSignIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}