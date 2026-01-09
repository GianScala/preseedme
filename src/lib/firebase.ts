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

// Constants
const GOOGLE_PROVIDER = new GoogleAuthProvider();
GOOGLE_PROVIDER.setCustomParameters({ prompt: "select_account" });

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

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
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseStorage() {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

/**
 * Migration Logic for Profile Photos
 */
async function migratePhotoToFirebaseStorage(uid: string, googlePhotoURL: string | null): Promise<string | null> {
  if (!googlePhotoURL || googlePhotoURL.includes("firebasestorage.googleapis.com")) return googlePhotoURL;
  if (!googlePhotoURL.includes("googleusercontent.com")) return null;

  try {
    const storageInstance = getFirebaseStorage();
    const storageRef = ref(storageInstance, `profile-photos/${uid}/profile.jpg`);
    
    // Attempt to get high-res version
    const highResUrl = googlePhotoURL.replace(/=s\d+-c/, "=s400-c").replace(/(\?|&)sz=\d+/, "$1sz=400");
    const response = await fetch(highResUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Photo migration failed:", error);
    return null;
  }
}

/**
 * Shared logic for processing a user after sign-in
 */
async function processGoogleSignInResult(result: UserCredential) {
  const { user } = result;
  const dbInstance = getFirebaseDb();
  const userRef = doc(dbInstance, "users", user.uid);
  const snap = await getDoc(userRef);

  let hasHandle = false;
  let isNewUser = false;

  if (!snap.exists()) {
    isNewUser = true;
    const firebasePhotoURL = await migratePhotoToFirebaseStorage(user.uid, user.photoURL);
    await setDoc(userRef, {
      email: user.email ?? "",
      username: user.displayName ?? "",
      handle: null,
      photoURL: firebasePhotoURL,
      emailVerified: true,
      publishedIdeaIds: [],
      createdAt: serverTimestamp(),
    });
  } else {
    const data = snap.data();
    hasHandle = !!data?.handle;
    // Update verification status if it changed
    if (!data?.emailVerified) {
      await updateDoc(userRef, { emailVerified: true });
    }
  }

  const additionalInfo = getAdditionalUserInfo(result);
  return {
    user,
    isNewUser: isNewUser || (additionalInfo?.isNewUser ?? false),
    hasHandle,
  };
}

export async function signInWithGoogleAndCreateProfile() {
  const authInstance = getFirebaseAuth();
  if (isMobileDevice()) {
    // Redirect flow for mobile
    await signInWithRedirect(authInstance, GOOGLE_PROVIDER);
    return null;
  }
  // Popup flow for desktop
  const result = await signInWithPopup(authInstance, GOOGLE_PROVIDER);
  return processGoogleSignInResult(result);
}

export async function checkGoogleRedirectResult() {
  const authInstance = getFirebaseAuth();
  try {
    const result = await getRedirectResult(authInstance);
    if (result) return processGoogleSignInResult(result);
    return null;
  } catch (error) {
    throw error;
  }
}

export async function emailSignIn(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(authInstance, email, password);
  return cred;
}