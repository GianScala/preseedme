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

  useEffect(() => { setMounted(true); }, []);

  // 1. Handling the Google Redirect Result on Mobile
  useEffect(() => {
    if (redirectChecked.current) return;
    redirectChecked.current = true;

    const checkRedirect = async () => {
      try {
        const result = await checkGoogleRedirectResult();
        if (result) {
          const { isNewUser, hasHandle } = result;
          router.replace(isNewUser || !hasHandle ? "/onboarding/handle" : "/");
        }
      } catch (err: any) {
        setError(err?.message || "Google auth failed.");
      } finally {
        setCheckingRedirect(false);
      }
    };
    checkRedirect();
  }, [router]);

  // 2. Redirect if user already logged in
  useEffect(() => {
    if (!authLoading && !checkingRedirect && user) {
      router.replace("/");
    }
  }, [user, authLoading, checkingRedirect, router]);

  const handleGoogle = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      const result = await signInWithGoogleAndCreateProfile();
      // On desktop, result is returned immediately
      if (result) {
        router.replace(result.isNewUser || !result.hasHandle ? "/onboarding/handle" : "/");
      }
      // On mobile, the page redirects away, result is null.
    } catch (err: any) {
      setError(err?.message || "Failed to sign in.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    try {
      setSubmitting(true);
      const cred = await emailSignIn(email.trim(), password);
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', cred.user.uid));
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

  if (authLoading || checkingRedirect) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <span className="text-sm text-neutral-400">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center gap-12 lg:flex-row py-10 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      
      <section className="w-full max-w-md space-y-6 text-center lg:text-left px-6">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Where ideas get <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">funded first.</span>
        </h1>
        <p className="text-lg text-neutral-400">Find early backers. No pitch decks, just progress.</p>
      </section>

      <section className="w-full max-w-sm sm:max-w-md px-4">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 sm:p-8 shadow-2xl">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-60"
          >
            <GoogleIcon />
            {submitting ? "Wait..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
            <div className="h-px flex-1 bg-white/5" />
            <span>Or Email</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none" 
                placeholder="founder@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-[var(--brand)] py-4 text-sm font-bold text-black active:scale-95 transition-transform"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          
          <p className="mt-6 text-center text-xs text-neutral-400">
            Don't have an account? <button onClick={() => router.push("/auth/register")} className="font-bold text-white underline underline-offset-4">Create account</button>
          </p>
        </div>
      </section>
    </div>
  );
}