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

// ---- Mobile Detection ----
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
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseDb() {
  if (!db) {
    const app = getFirebaseApp();
    try {
      db = initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch (e) {
      db = getFirestore(app);
    }
  }
  return db;
}

export function getFirebaseStorage() {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ---- Photo Migration Helpers ----
async function migratePhotoToFirebaseStorage(uid: string, googlePhotoURL: string | null): Promise<string | null> {
  if (!googlePhotoURL || googlePhotoURL.includes("firebasestorage.googleapis.com")) return googlePhotoURL;
  try {
    const storageRef = ref(getFirebaseStorage(), `profile-photos/${uid}/profile.jpg`);
    const highResUrl = googlePhotoURL.replace(/=s\d+-c/, "=s400-c").replace(/(\?|&)sz=\d+/, "$1sz=400");
    const response = await fetch(highResUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
  } catch { return null; }
}

// ---- REQUIRED EXPORT: ensureUserProfile ----
export async function ensureUserProfile(user: User) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const photo = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: photo,
      emailVerified: false,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
  }
}

// ---- Google Logic ----
async function processGoogleResult(result: UserCredential) {
  const { user } = result;
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  
  let hasHandle = false;
  let isNewUser = false;

  if (!snap.exists()) {
    isNewUser = true;
    const photo = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: photo,
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
  } else {
    hasHandle = !!snap.data()?.handle;
    await updateDoc(userRef, { emailVerified: true });
  }

  return { user, isNewUser, hasHandle };
}

export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth();
  if (isMobileDevice()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return processGoogleResult(result);
}

export async function checkGoogleRedirectResult() {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  if (result) return processGoogleResult(result);
  return null;
}

// ---- Email Auth Exports ----
export async function emailSignUpAndCreateProfile(email: string, password: string, username: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  
  await setDoc(doc(getFirebaseDb(), "users", cred.user.uid), {
    email,
    username,
    handle: null,
    photoURL: null,
    emailVerified: false,
    publishedIdeaIds: [],
    createdAt: serverTimestamp(),
  });
  return cred;
}

export async function emailSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await ensureUserProfile(cred.user);
  return cred;
}