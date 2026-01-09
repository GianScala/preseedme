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

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.31 13.02 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.59-.14-3.12-.39-4.55H24v9.02h12.94c-.56 2.86-2.27 5.29-4.81 6.92l7.78 6.04C44.33 38.51 46.98 32.02 46.98 24.55z" />
    <path fill="#FBBC05" d="M10.54 28.58A14.44 14.44 0 0 1 9.76 24c0-1.59.27-3.13.76-4.58l-7.98-6.2A23.88 23.88 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.98-6.2z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.78-6.04C30.28 37.66 27.39 38.5 24 38.5c-6.3 0-11.69-3.52-14.46-8.72l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const redirectChecked = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Google Redirect Result
  useEffect(() => {
    if (redirectChecked.current) return;
    redirectChecked.current = true;

    const handleRedirect = async () => {
      try {
        const result = await checkGoogleRedirectResult();
        if (result) {
          const { isNewUser, hasHandle } = result;
          router.replace(isNewUser || !hasHandle ? "/onboarding/handle" : "/");
        }
      } catch (err: any) {
        console.error("Redirect error:", err);
        setError(err?.message ?? "Failed to complete Google sign-in.");
      } finally {
        setCheckingRedirect(false);
      }
    };

    handleRedirect();
  }, [router]);

  // Handle standard session redirect
  useEffect(() => {
    if (!authLoading && !checkingRedirect && user) {
      router.replace("/");
    }
  }, [user, authLoading, checkingRedirect, router]);

  const handleGoogle = async () => {
    if (submitting || checkingRedirect) return;
    try {
      setSubmitting(true);
      setError(null);
      const result = await signInWithGoogleAndCreateProfile();
      
      if (result) { // Desktop Flow
        const { isNewUser, hasHandle } = result;
        router.replace(isNewUser || !hasHandle ? "/onboarding/handle" : "/");
      }
      // On mobile, result is null and page redirects
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !email.trim() || password.length < 6) return;

    try {
      setSubmitting(true);
      setError(null);
      const cred = await emailSignIn(email.trim(), password);
      
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));

      if (userDoc.exists() && !userDoc.data().emailVerified) {
        setError("Please verify your email first.");
        await signOut(getFirebaseAuth());
        setSubmitting(false);
        return;
      }
      router.replace("/");
    } catch (err: any) {
      setError("Invalid email or password.");
      setSubmitting(false);
    }
  };

  if (authLoading || checkingRedirect || (user && mounted)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <p className="text-sm text-neutral-400 font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center gap-12 lg:flex-row py-10 transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
      
      {/* Branding Section */}
      <section className="w-full max-w-md space-y-6 text-center lg:text-left px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-3 py-1 text-xs font-bold text-[var(--brand)] uppercase">
          <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
          Join the community
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
          Where ideas get <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">funded first.</span>
        </h1>
        <p className="text-lg text-neutral-400 max-w-sm mx-auto lg:mx-0">No pitch decks, just progress.</p>
      </section>

      {/* Auth Card */}
      <section className="w-full max-w-[90%] sm:max-w-md">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center">Welcome Back</h2>
          
          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
          >
            <GoogleIcon />
            {submitting ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
            <div className="h-px flex-1 bg-white/5" />
            <span>Or email</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-base text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold text-neutral-400">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-base text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all outline-none"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--brand)] py-4 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            New here? <button onClick={() => router.push("/auth/register")} className="text-white font-bold hover:underline">Create account</button>
          </p>
        </div>
      </section>
    </div>
  );
}