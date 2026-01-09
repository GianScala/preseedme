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
  const [isRedirectChecking, setIsRedirectChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const checkInit = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // 1. MOBILE REDIRECT HANDLER: Runs first on page load
  useEffect(() => {
    if (checkInit.current) return;
    checkInit.current = true;

    async function handleRedirect() {
      try {
        const result = await checkGoogleRedirectResult();
        if (result) {
          router.replace(result.isNewUser || !result.hasHandle ? "/onboarding/handle" : "/");
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setError("Sign-in failed. Please try again.");
      } finally {
        setIsRedirectChecking(false);
      }
    }
    handleRedirect();
  }, [router]);

  // 2. Standard session check
  useEffect(() => {
    if (!authLoading && !isRedirectChecking && user) {
      router.replace("/");
    }
  }, [user, authLoading, isRedirectChecking, router]);

  const handleGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInWithGoogleAndCreateProfile();
      // On desktop (popup), result exists immediately. On mobile (redirect), page reloads.
      if (result) {
        router.replace(result.isNewUser || !result.hasHandle ? "/onboarding/handle" : "/");
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
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
      const userDoc = await getDoc(doc(getFirebaseDb(), "users", cred.user.uid));
      if (userDoc.exists() && !userDoc.data().emailVerified) {
        setError("Please verify your email first.");
        await signOut(getFirebaseAuth());
        setSubmitting(false);
        return;
      }
    } catch (err: any) {
      setError("Incorrect email or password.");
      setSubmitting(false);
    }
  };

  if (authLoading || isRedirectChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-ping" />
          <span className="text-xs text-neutral-400 font-medium">Authenticating...</span>
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
        <p className="text-lg text-neutral-400">Join the community of builders and early backers.</p>
      </section>

      <section className="w-full max-w-[92%] sm:max-w-md">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <GoogleIcon />
            {submitting ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">
            <div className="h-px flex-1 bg-white/5" />
            <span>OR EMAIL</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none transition-colors" 
                placeholder="founder@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="text-xs font-medium text-red-400 bg-red-400/10 p-4 rounded-2xl border border-red-400/20">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[var(--brand)] py-4 text-sm font-bold text-black shadow-lg shadow-[var(--brand)]/20 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-500">
            No account? <button onClick={() => router.push("/auth/register")} className="text-white font-bold hover:text-[var(--brand)] transition-colors">Create one</button>
          </p>
        </div>
      </section>
    </div>
  );
}