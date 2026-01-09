"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  emailSignIn,
  signInWithGoogleAndCreateProfile,
  checkGoogleRedirectResult,
  getFirebaseAuth,
  getFirebaseDb,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const redirectChecked = useRef(false);

  // 1. CATCH REDIRECT ON LOAD (Essential for Mobile)
  useEffect(() => {
    if (redirectChecked.current) return;
    redirectChecked.current = true;

    async function handleRedirect() {
      try {
        const result = await checkGoogleRedirectResult();
        if (result) {
          router.replace(result.isNewUser || !result.hasHandle ? "/onboarding/handle" : "/");
        }
      } catch (err: any) {
        console.error("Redirect logic error:", err);
      } finally {
        setCheckingRedirect(false);
      }
    }
    handleRedirect();
  }, [router]);

  // 2. LOGGED IN CHECK
  useEffect(() => {
    if (!authLoading && !checkingRedirect && user) {
      router.replace("/");
    }
  }, [user, authLoading, checkingRedirect, router]);

  const handleGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await signInWithGoogleAndCreateProfile();
      // On desktop, result is immediate. On mobile, we redirect away.
      if (result) {
        router.replace(result.isNewUser || !result.hasHandle ? "/onboarding/handle" : "/");
      }
    } catch (err: any) {
      setError("Google sign-in failed.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const cred = await emailSignIn(email, password);
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', cred.user.uid));
      if (userDoc.exists() && !userDoc.data().emailVerified) {
        setError("Check your email to verify your account.");
        await signOut(getFirebaseAuth());
        setSubmitting(false);
        return;
      }
      router.replace("/");
    } catch (err: any) {
      setError("Wrong email or password.");
      setSubmitting(false);
    }
  };

  if (authLoading || checkingRedirect) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <p className="text-sm text-neutral-400 font-medium tracking-wide">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-neutral-400">Join the movement of early builders.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest py-2">
            <div className="h-px flex-1 bg-white/10" />
            <span>OR EMAIL</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none" 
              placeholder="founder@example.com"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {error && <div className="text-xs text-red-400 font-medium px-2">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[var(--brand)] py-4 text-sm font-bold text-black shadow-lg shadow-[var(--brand)]/20 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}