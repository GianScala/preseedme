// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, ensureUserProfile } from "@/lib/firebase";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    try {
      const db = getFirebaseDb();
      await ensureUserProfile(firebaseUser);
      
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const profileData = {
          id: firebaseUser.uid,
          ...(snap.data() as any),
        };
        console.log("Profile loaded, photoURL:", profileData.photoURL);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔔 Auth state changed:", firebaseUser?.uid ?? "null");
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      
      // Mark loading as complete after first auth check
      if (!initialAuthCheckDone) {
        setInitialAuthCheckDone(true);
      }
      setLoading(false);
    });

    // Timeout fallback in case onAuthStateChanged never fires
    const timeout = setTimeout(() => {
      if (!initialAuthCheckDone) {
        console.log("⏰ Auth state timeout - marking as loaded");
        setInitialAuthCheckDone(true);
        setLoading(false);
      }
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [initialAuthCheckDone, loadUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setProfile(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOutUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}