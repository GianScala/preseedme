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
  UserCredential,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
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
let authInitialized = false;

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

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);
    
    // Set persistence to indexedDB (works better on Safari/iOS)
    if (!authInitialized) {
      authInitialized = true;
      try {
        // Try indexedDB first (better for Safari ITP)
        await setPersistence(auth, indexedDBLocalPersistence);
        console.log("✅ Using indexedDB persistence");
      } catch (e) {
        // Fallback to localStorage
        try {
          await setPersistence(auth, browserLocalPersistence);
          console.log("✅ Using localStorage persistence");
        } catch (e2) {
          console.warn("⚠️ Could not set persistence:", e2);
        }
      }
    }
  }
  return auth;
}

// Synchronous version for contexts that can't await
export function getFirebaseAuthSync(): Auth {
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
        localCache: memoryLocalCache()
      });
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

// ---- Device detection ----
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// ---- helpers ----
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

async function deleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const userPhotoDir = ref(storage, `profile-photos/${uid}`);
    const listResult = await listAll(userPhotoDir);

    if (listResult.items.length > 0) {
      const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.log("Could not delete old photos (non-critical):", err);
  }
}

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

async function migratePhotoToFirebaseStorage(
  uid: string,
  googlePhotoURL: string | null
): Promise<string | null> {
  if (!googlePhotoURL) return null;

  if (googlePhotoURL.includes("firebasestorage.googleapis.com")) {
    return googlePhotoURL;
  }

  if (!googlePhotoURL.includes("googleusercontent.com")) {
    return null;
  }

  try {
    const storage = getFirebaseStorage();
    const storagePath = `profile-photos/${uid}/profile.jpg`;
    const storageRef = ref(storage, storagePath);

    const highResUrl = buildHighResGoogleUrl(googlePhotoURL);
    const response = await fetch(highResUrl);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    await deleteAllUserPhotos(uid);

    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000",
    });

    const firebasePhotoURL = await getDownloadURL(storageRef);
    return firebasePhotoURL;
  } catch (error) {
    console.error("Failed to migrate profile photo:", error);
    return null;
  }
}

export async function ensureUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
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

  if (!hasFirebasePhoto && !photoMigrationFailed) {
    const sourceGoogleUrl =
      (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

    if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
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
  }
}

/**
 * Process Google credential and create/update user profile
 */
export async function processGoogleCredential(result: UserCredential): Promise<{
  user: User;
  isNewUser: boolean;
  hasHandle: boolean;
}> {
  const user = result.user;
  const db = getFirebaseDb();

  console.log("=== Processing Google Sign-In ===");
  console.log("User ID:", user.uid);
  console.log("Email:", user.email);

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let hasHandle = false;
  let createdDoc = false;

  if (!snap.exists()) {
    console.log("Creating new user document...");
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
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    createdDoc = true;
    console.log("✓ New user document created");
  } else {
    const data = snap.data() as any;
    hasHandle = !!data.handle;
    console.log("Existing user, hasHandle:", hasHandle);

    const updates: Record<string, any> = {};
    if (!data.email && user.email) updates.email = user.email;
    if (!data.username && user.displayName) updates.username = user.displayName;
    if (!data.emailVerified) updates.emailVerified = true;

    const firestorePhotoURL: string | null = data.photoURL ?? null;
    const photoMigrationFailed: boolean = !!data.photoMigrationFailed;

    const hasFirebasePhoto =
      typeof firestorePhotoURL === "string" &&
      firestorePhotoURL.includes("firebasestorage.googleapis.com");

    const hasGooglePhoto =
      typeof firestorePhotoURL === "string" &&
      firestorePhotoURL.includes("googleusercontent.com");

    if (!hasFirebasePhoto && !photoMigrationFailed) {
      const sourceGoogleUrl =
        (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

      if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
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
 * Wait for auth state to be confirmed after sign-in
 * This is crucial for mobile Safari where auth state can be flaky
 */
function waitForAuthState(auth: Auth, expectedUid: string, timeoutMs: number = 10000): Promise<User> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Auth state confirmation timed out"));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === expectedUid) {
        clearTimeout(timeout);
        unsubscribe();
        console.log("✅ Auth state confirmed for:", user.email);
        resolve(user);
      }
    });
  });
}

/**
 * Google sign-in with proper mobile handling
 * Waits for auth state to be confirmed before returning
 */
export async function signInWithGoogleAndCreateProfile(): Promise<{
  user: User;
  isNewUser: boolean;
  hasHandle: boolean;
}> {
  const auth = await getFirebaseAuth();

  console.log("🔐 Starting Google sign-in popup...");
  console.log("📱 Is mobile:", isMobile());
  
  // Perform the sign-in
  const result = await signInWithPopup(auth, googleProvider);
  console.log("✅ Popup completed, user:", result.user.email);
  
  // CRITICAL: Wait for onAuthStateChanged to confirm the auth state
  // This ensures the auth state is persisted before we continue
  console.log("⏳ Waiting for auth state confirmation...");
  await waitForAuthState(auth, result.user.uid);
  
  // Now process the credential and create/update profile
  console.log("📝 Processing user profile...");
  const processed = await processGoogleCredential(result);
  
  console.log("✅ Sign-in complete:", {
    isNewUser: processed.isNewUser,
    hasHandle: processed.hasHandle
  });
  
  return processed;
}

/**
 * Email sign-up
 */
export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  username: string
) {
  const auth = await getFirebaseAuth();
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

  return cred;
}

/**
 * Email sign-in
 */
export async function emailSignIn(email: string, password: string) {
  const auth = await getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}