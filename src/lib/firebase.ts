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
  UserCredential,
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

// ---- MOBILE DETECTION ----
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

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
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ---- PHOTO HELPERS ----
async function deleteAllUserPhotos(uid: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const userPhotoDir = ref(storage, `profile-photos/${uid}`);
    const listResult = await listAll(userPhotoDir);
    if (listResult.items.length > 0) {
      await Promise.all(listResult.items.map((itemRef) => deleteObject(itemRef)));
    }
  } catch (err) { console.log("Non-critical photo delete error:", err); }
}

function buildHighResGoogleUrl(googlePhotoURL: string): string {
  let url = googlePhotoURL;
  if (/=s\d+-c(?:$|\?)/.test(url)) return url.replace(/=s\d+-c/, "=s400-c");
  if (/(\?|&)sz=\d+/.test(url)) return url.replace(/(\?|&)sz=\d+/, "$1sz=400");
  return url;
}

async function migratePhotoToFirebaseStorage(uid: string, googlePhotoURL: string | null): Promise<string | null> {
  if (!googlePhotoURL || googlePhotoURL.includes("firebasestorage.googleapis.com")) return googlePhotoURL;
  if (!googlePhotoURL.includes("googleusercontent.com")) return null;
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, `profile-photos/${uid}/profile.jpg`);
    const response = await fetch(buildHighResGoogleUrl(googlePhotoURL));
    if (!response.ok) return null;
    const blob = await response.blob();
    await deleteAllUserPhotos(uid);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
  } catch { return null; }
}

// ---- CRITICAL EXPORTS ----
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
  // Backfill logic...
  const data = snap.data();
  const updates: any = {};
  if (!data.emailVerified && data.emailVerified !== false) updates.emailVerified = false;
  if (Object.keys(updates).length > 0) await updateDoc(userRef, updates);
}

async function handlePostSignIn(result: UserCredential) {
  const user = result.user;
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  
  let hasHandle = false;
  let createdDoc = false;

  if (!snap.exists()) {
    const photo = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: photo,
      photoMigrationFailed: photo === null,
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
    createdDoc = true;
  } else {
    hasHandle = !!snap.data().handle;
    await updateDoc(userRef, { emailVerified: true });
  }
  return { user, isNewUser: createdDoc || getAdditionalUserInfo(result)?.isNewUser, hasHandle };
}

export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();
  if (isMobileDevice()) {
    // Redirect logic for mobile
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return handlePostSignIn(result);
}

export async function checkGoogleRedirectResult() {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  if (result) return handlePostSignIn(result);
  return null;
}

export async function emailSignUpAndCreateProfile(email: string, password: string, username: string) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(getFirebaseDb(), "users", cred.user.uid), {
    email, username, handle: null, photoURL: null, 
    emailVerified: false, publishedIdeaIds: [], createdAt: serverTimestamp()
  });
  return cred;
}

export async function emailSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await ensureUserProfile(cred.user);
  return cred;
}