"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { 
  getFirebaseAuth, 
  signInWithGoogle, 
  handleUserSetup, 
  emailSignIn,
  isMobile 
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // CRITICAL: Catch the redirect result when the page loads
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        
        if (result) {
          // We just returned from Google successfully
          const { isNewUser, hasHandle } = await handleUserSetup(result);
          router.replace(isNewUser || !hasHandle ? "/onboarding/handle" : "/");
        } else {
          // No redirect found, check if user is already logged in normally
          if (!authLoading && user) {
            router.replace("/");
          } else {
            setIsProcessing(false);
          }
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setError("Mobile sign-in failed. Please try again.");
        setIsProcessing(false);
      }
    };

    checkRedirect();
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      // If mobile, this will trigger a page redirect away from your site
      await signInWithGoogle();
      // On Desktop, it continues here:
      if (!isMobile()) {
        router.replace("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await emailSignIn(email, password);
      router.replace("/");
    } catch (err: any) {
      setError("Invalid email or password.");
      setIsProcessing(false);
    }
  };

  if (isProcessing || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent mx-auto" />
          <p className="text-neutral-400 text-sm animate-pulse">Connecting to Google...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 text-sm font-bold text-black transition-transform active:scale-95"
        >
          Continue with Google
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-neutral-500">Or email</span></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-4 text-base text-white focus:border-[var(--brand)] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button className="w-full rounded-xl bg-[var(--brand)] py-4 text-sm font-bold text-black">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}