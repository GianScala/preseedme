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

    if (!response.ok) return null;

    const blob = await response.blob();
    await deleteAllUserPhotos(uid);

    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000",
    });

    return await getDownloadURL(storageRef);
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

  if (!data.email && user.email) updates.email = user.email;
  if (!data.username && user.displayName) updates.username = user.displayName;
  if (data.emailVerified === undefined) updates.emailVerified = false;

  const firestorePhotoURL: string | null = data.photoURL ?? null;
  const photoMigrationFailed: boolean = !!data.photoMigrationFailed;

  const hasFirebasePhoto =
    typeof firestorePhotoURL === "string" &&
    firestorePhotoURL.includes("firebasestorage.googleapis.com");

  const hasGooglePhoto =
    typeof firestorePhotoURL === "string" &&
    firestorePhotoURL.includes("googleusercontent.com");

  if (!hasFirebasePhoto && !photoMigrationFailed) {
    const sourceGoogleUrl = (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

    if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
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

  if (hasGooglePhoto && !updates.photoURL) updates.photoURL = null;

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }
}

/**
 * Google sign-in using popup (works on mobile too - opens in new tab)
 */
export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let hasHandle = false;
  let createdDoc = false;

  if (!snap.exists()) {
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);

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
  } else {
    const data = snap.data() as any;
    hasHandle = !!data.handle;

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
      const sourceGoogleUrl = (hasGooglePhoto ? firestorePhotoURL : null) ?? user.photoURL;

      if (sourceGoogleUrl && sourceGoogleUrl.includes("googleusercontent.com")) {
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

    if (hasGooglePhoto && !updates.photoURL) updates.photoURL = null;

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  }

  const info = getAdditionalUserInfo(result);

  return {
    user,
    isNewUser: info?.isNewUser ?? createdDoc,
    hasHandle,
  };
}

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

  return cred;
}

export async function emailSignIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
}