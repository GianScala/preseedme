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
import { 
  getFirebaseAuth, 
  getFirebaseAuthSync,
  getFirebaseDb, 
  ensureUserProfile 
} from "@/lib/firebase";
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
        console.log("✅ Profile loaded:", profileData.email);
        setProfile(profileData);
      } else {
        console.log("⚠️ No profile document found");
        setProfile(null);
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initAuth = async () => {
      try {
        // Initialize auth with persistence FIRST
        const auth = await getFirebaseAuth();
        
        console.log("🔔 Setting up auth state listener...");
        
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("🔔 Auth state changed:", firebaseUser ? firebaseUser.email : "signed out");
          
          setUser(firebaseUser);
          
          if (firebaseUser) {
            await loadUserProfile(firebaseUser);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        });
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        setLoading(false);
      }
    };
    
    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  const signOutUser = useCallback(async () => {
    try {
      const auth = await getFirebaseAuth();
      await signOut(auth);
      setProfile(null);
      setUser(null);
      console.log("✅ Signed out");
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
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