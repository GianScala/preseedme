// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
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
      console.log("✓ Firestore initialized with memory-only cache (no persistence)");
    } catch (error) {
      db = getFirestore(app);
      console.log("✓ Using existing Firestore instance");
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

// ── Google Provider ─────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

// ── REDIRECT FLOW FUNCTIONS ─────────────────────────────────────

// Call this when user clicks the Google button
export async function startGoogleSignInRedirect(): Promise<void> {
  googleProvider.setCustomParameters({
    prompt: "select_account", // helps with UX (account chooser)
  });
  await signInWithRedirect(getFirebaseAuth(), googleProvider);
}

// Call this on page load (especially after redirect lands)
export async function processGoogleRedirectResult(): Promise<{
  user: User | null;
  isNewUser: boolean;
  hasHandle: boolean;
} | null> {
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result?.user) {
      return null; // not a redirect sign-in
    }

    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    // Run profile creation / update logic
    const profileResult = await createOrUpdateGoogleUserProfile(user);

    return {
      user,
      isNewUser: additionalInfo?.isNewUser ?? profileResult.isNewUser,
      hasHandle: profileResult.hasHandle,
    };
  } catch (error) {
    console.error("Error processing Google redirect:", error);
    return null;
  }
}

// ── Profile creation/update (moved out of sign-in function) ─────
async function createOrUpdateGoogleUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let isNewUser = false;
  let hasHandle = false;

  if (!snap.exists()) {
    // New user
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
      emailVerified: true, // Google users are auto-verified
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });

    isNewUser = true;
    console.log("✓ New Google user document created");
  } else {
    // Existing user - update missing fields + photo migration
    const data = snap.data() as any;
    hasHandle = !!data.handle;

    const updates: Record<string, any> = {};

    if (!data.email && user.email) updates.email = user.email;
    if (!data.username && user.displayName) updates.username = user.displayName;
    if (!data.emailVerified) updates.emailVerified = true;

    // Photo migration for existing users (your original logic)
    const firestorePhotoURL = data.photoURL ?? null;
    const photoMigrationFailed = !!data.photoMigrationFailed;
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
        console.log(
          "Attempting photo migration on sign-in. Reason:",
          !firestorePhotoURL ? "no photo" : "google URL stored"
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

    // Clean up any remaining googleusercontent URLs
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

// ── Your existing helper functions (unchanged) ──────────────────

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

  if (!hasFirebasePhoto && !photoMigrationFailed) {
    const sourceGoogleUrl =
      (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;
    if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
      console.log(
        "Attempting photo migration for existing user. Reason:",
        !firestorePhotoURL ? "no photo" : "google URL stored"
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
  }
}

// ── Email functions (unchanged) ─────────────────────────────────

export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  username: string
): Promise<UserCredential> {
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
  console.log("⚠️ Verification emails should be sent by calling code via Resend API");

  return cred;
}

export async function emailSignIn(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}