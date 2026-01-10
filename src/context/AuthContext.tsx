// src/context/AuthContext.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User, signOut, getRedirectResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseDb,
  ensureUserProfile,
  processGoogleUser,
  isGoogleRedirectPending,
  clearGoogleRedirectPending,
} from "@/lib/firebase";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // New: for redirect flow
  redirectResult: {
    isNewUser: boolean;
    hasHandle: boolean;
  } | null;
  clearRedirectResult: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectResult, setRedirectResult] = useState<{
    isNewUser: boolean;
    hasHandle: boolean;
  } | null>(null);

  const loadUserProfile = async (firebaseUser: User) => {
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
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubscribed = false;

    const initAuth = async () => {
      console.log("🔐 AuthContext: Initializing...");

      // STEP 1: Check for Google redirect result FIRST (before onAuthStateChanged)
      // This is critical for mobile where redirect auth is used
      if (isGoogleRedirectPending()) {
        console.log("📱 AuthContext: Google redirect was pending, checking result...");
        
        try {
          const result = await getRedirectResult(auth);
          
          if (result && result.user) {
            console.log("✅ AuthContext: Got redirect result!", result.user.uid);
            clearGoogleRedirectPending();

            // Process the Google user (create/update Firestore doc)
            const { isNewUser, hasHandle } = await processGoogleUser(result.user);
            
            // Set user state immediately
            if (!unsubscribed) {
              setUser(result.user);
              await loadUserProfile(result.user);
              setRedirectResult({ isNewUser, hasHandle });
              setLoading(false);
            }
            
            // Don't continue to onAuthStateChanged setup - we're done
            // But we still need to set up the listener for future changes
            const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
              if (unsubscribed) return;
              
              console.log("🔄 AuthContext: Auth state changed:", firebaseUser?.uid ?? "null");
              setUser(firebaseUser);
              
              if (firebaseUser) {
                await loadUserProfile(firebaseUser);
              } else {
                setProfile(null);
              }
            });
            
            return () => {
              unsubscribed = true;
              unsub();
            };
          } else {
            console.log("⚠️ AuthContext: Redirect was pending but no result");
            clearGoogleRedirectPending();
          }
        } catch (err) {
          console.error("❌ AuthContext: Error getting redirect result:", err);
          clearGoogleRedirectPending();
        }
      }

      // STEP 2: Set up normal auth state listener
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (unsubscribed) return;
        
        console.log("🔄 AuthContext: Auth state changed:", firebaseUser?.uid ?? "null");
        setUser(firebaseUser);

        if (firebaseUser) {
          await loadUserProfile(firebaseUser);
        } else {
          setProfile(null);
        }

        setLoading(false);
      });

      return () => {
        unsubscribed = true;
        unsub();
      };
    };

    const cleanupPromise = initAuth();

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  const signOutUser = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  const clearRedirectResult = () => {
    setRedirectResult(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOutUser,
        refreshProfile,
        redirectResult,
        clearRedirectResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}