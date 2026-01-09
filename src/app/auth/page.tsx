"use client";

import { FormEvent, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  emailSignIn,
  signInWithGoogleAndCreateProfile,
  getGoogleRedirectResult,
  getFirebaseAuth,
  getFirebaseDb,
  isRedirectPending,
  getStoredRedirectResult,
  clearRedirectPending,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.31 13.02 17.7 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.59-.14-3.12-.39-4.55H24v9.02h12.94c-.56 2.86-2.27 5.29-4.81 6.92l7.78 6.04C44.33 38.51 46.98 32.02 46.98 24.55z"
    />
    <path
      fill="#FBBC05"
      d="M10.54 28.58A14.44 14.44 0 0 1 9.76 24c0-1.59.27-3.13.76-4.58l-7.98-6.2A23.88 23.88 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.98-6.2z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.78-6.04C30.28 37.66 27.39 38.5 24 38.5c-6.3 0-11.69-3.52-14.46-8.72l-7.98 6.2C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Track redirect states
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const redirectCheckStarted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation helper to prevent double navigation
  const navigateTo = useCallback((path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    console.log(`🚀 Navigating to: ${path}`);
    router.replace(path);
  }, [router, isNavigating]);

  // Check for Google redirect result on mount (for mobile)
  useEffect(() => {
    // Only run once
    if (redirectCheckStarted.current) return;
    redirectCheckStarted.current = true;

    const checkRedirect = async () => {
      // Check if we're returning from a redirect
      const wasPending = isRedirectPending();
      console.log("🔍 Redirect pending flag:", wasPending);

      // If no redirect was pending, skip the check quickly
      if (!wasPending) {
        console.log("ℹ️ No redirect was pending, skipping redirect check");
        setRedirectChecked(true);
        return;
      }

      // Add timeout so we don't hang forever
      const timeout = setTimeout(() => {
        console.log("⏰ Redirect check timed out");
        clearRedirectPending();
        setRedirectChecked(true);
      }, 10000); // Increased timeout for slower connections

      try {
        console.log("🔍 Checking for redirect result...");
        const result = await getGoogleRedirectResult();
        
        clearTimeout(timeout);
        
        if (result) {
          console.log("✅ Redirect sign-in complete!", {
            isNewUser: result.isNewUser,
            hasHandle: result.hasHandle
          });
          
          const destination = result.isNewUser || !result.hasHandle 
            ? "/onboarding/handle" 
            : "/";
          
          navigateTo(destination);
          return; // Don't set redirectChecked - we're navigating away
        }
        
        console.log("ℹ️ No redirect result (user may have cancelled)");
      } catch (err: any) {
        clearTimeout(timeout);
        console.error("Redirect error:", err);
        
        if (err?.code === "auth/account-exists-with-different-credential") {
          setError("An account already exists with this email using a different sign-in method.");
        } else if (err?.code !== "auth/popup-closed-by-user") {
          setError("Sign in was interrupted. Please try again.");
        }
      }
      
      setRedirectChecked(true);
    };

    checkRedirect();
  }, [navigateTo]);

  // Handle already logged-in users (but NOT if we're processing a redirect)
  useEffect(() => {
    // Don't redirect if:
    // 1. Redirect hasn't been checked yet
    // 2. Auth is still loading
    // 3. No user is logged in
    // 4. We're already navigating somewhere
    if (!redirectChecked || authLoading || !user || isNavigating) {
      return;
    }

    // Check if there's a stored redirect result from processGoogleCredential
    const storedResult = getStoredRedirectResult();
    if (storedResult) {
      console.log("📦 Found stored redirect result:", storedResult);
      const destination = storedResult.isNewUser || !storedResult.hasHandle 
        ? "/onboarding/handle" 
        : "/";
      navigateTo(destination);
      return;
    }

    // User was already logged in before visiting this page
    console.log("👤 User already logged in, redirecting to home");
    navigateTo("/");
  }, [user, authLoading, redirectChecked, isNavigating, navigateTo]);

  const handleGoogle = async () => {
    if (submitting || isNavigating) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await signInWithGoogleAndCreateProfile();
      
      // On mobile, result is null (page redirects to Google)
      if (!result) {
        // Keep loading state - we're redirecting to Google
        console.log("📱 Redirecting to Google...");
        return;
      }
      
      // Desktop popup flow
      console.log("🖥️ Desktop sign-in complete:", {
        isNewUser: result.isNewUser,
        hasHandle: result.hasHandle
      });
      
      const destination = result.isNewUser || !result.hasHandle 
        ? "/onboarding/handle" 
        : "/";
      navigateTo(destination);
    } catch (err: any) {
      const code = err?.code;
      
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setSubmitting(false);
        return;
      }
      
      if (code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Please enable pop-ups or try on mobile.");
      } else if (code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email using a different sign-in method.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err?.message ?? "Failed to sign in with Google.");
      }
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || isNavigating) return;
  
    setError(null);
  
    if (!email.trim()) return setError("Please enter your email.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
  
    try {
      setSubmitting(true);
  
      const cred = await emailSignIn(email.trim(), password);
      const signedInUser = cred.user;
  
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, 'users', signedInUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (!userData.emailVerified) {
          setError("Please verify your email before signing in. Check your inbox!");
          const authInstance = getFirebaseAuth();
          await signOut(authInstance);
          setSubmitting(false);
          return;
        }

        // Check if user has a handle
        const hasHandle = !!userData.handle;
        const destination = !hasHandle ? "/onboarding/handle" : "/";
        navigateTo(destination);
      } else {
        // No user doc, send to onboarding
        navigateTo("/onboarding/handle");
      }
  
      setEmail("");
      setPassword("");
      
    } catch (err: any) {
      const code = err?.code;
  
      if (code === "auth/user-not-found") {
        setError("No account found with that email. Try creating one instead.");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait and try again.");
      } else {
        setError(err?.message ?? "Authentication failed.");
      }
      setSubmitting(false);
    }
  };

  // Determine loading state
  const showLoadingScreen = !redirectChecked || authLoading || (user && !isNavigating);
  
  // Determine loading message
  const getLoadingMessage = () => {
    if (!redirectChecked) {
      if (isRedirectPending()) {
        return "Completing sign in…";
      }
      return "Loading…";
    }
    if (authLoading) return "Checking your session…";
    if (user) return "Redirecting…";
    return "Loading…";
  };

  if (showLoadingScreen) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span>{getLoadingMessage()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center",
        "gap-12 lg:flex-row lg:items-center lg:gap-20",
        "py-10 sm:py-16",
        "transition-all duration-700 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      <section className="w-full max-w-md space-y-6 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-3 py-1 text-[10px] sm:text-xs font-bold text-[var(--brand)] uppercase tracking-wider">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand)]"></span>
          </span>
          Join the community
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Where ideas get <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">funded first.</span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-sm mx-auto lg:mx-0">
          Share your vision. Find early backers. <br className="hidden sm:block" />
          No pitch decks, just progress.
        </p>

        <ul className="hidden sm:block space-y-3 pt-2">
          {[
            "Post ideas in seconds",
            "Connect with micro-investors",
            "Get discovered on the leaderboard"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-neutral-300 justify-center lg:justify-start">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="w-full max-w-sm sm:max-w-md">
        {/* Solid bg on mobile for performance, blur on desktop */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900 sm:bg-white/[0.02] sm:backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Sign in to continue your journey
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:border-white/20 active:scale-[0.98] disabled:opacity-60"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 p-0.5">
              <GoogleIcon />
            </span>
            {submitting ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-widest">
            <div className="h-px flex-1 bg-white/5" />
            <span>Or using email</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 ml-1">
                Email
              </label>
              <input
                type="email"
                placeholder="founder@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-xs font-semibold text-neutral-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-xs text-[var(--brand)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(33,221,192,0.15)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="font-bold text-white hover:text-[var(--brand)] transition-colors underline underline-offset-4"
            >
              Create free account
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}