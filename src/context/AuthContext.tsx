// src/context/AuthContext.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseDb,
  ensureUserProfile,
  checkGoogleRedirectResult,
} from "@/lib/firebase";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // For mobile redirect flow
  redirectResult: { isNewUser: boolean; hasHandle: boolean } | null;
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
    const snap = await getDoc(doc(db, "users", firebaseUser.uid));

    if (snap.exists()) {
      setProfile({ id: firebaseUser.uid, ...(snap.data() as any) });
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    let mounted = true;

    // Check for redirect result FIRST (for mobile Google sign-in)
    checkGoogleRedirectResult()
      .then((result) => {
        if (result && mounted) {
          console.log("✅ Mobile redirect sign-in completed");
          setRedirectResult({ isNewUser: result.isNewUser, hasHandle: result.hasHandle });
        }
      })
      .catch((err) => {
        console.error("Redirect check error:", err);
      });

    // Set up auth state listener
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await loadUserProfile(user);
  };

  const signOutUser = async () => {
    await signOut(getFirebaseAuth());
    setProfile(null);
    setUser(null);
  };

  const clearRedirectResult = () => setRedirectResult(null);

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