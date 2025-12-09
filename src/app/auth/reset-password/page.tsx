"use client";

import React, { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

/**
 * Wrapper component required by Next.js so that
 * useSearchParams() is inside a <Suspense> boundary.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-400">Loading reset page...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function validateToken() {
    const tokenParam = searchParams.get("token");
    const uidParam = searchParams.get("uid");

    console.log("🔍 Validating reset token...");

    if (!tokenParam || !uidParam) {
      setError("Invalid reset link - missing parameters");
      setValidating(false);
      return;
    }

    try {
      const db = getFirebaseDb();
      const resetDoc = await getDoc(doc(db, "passwordResets", uidParam));

      if (!resetDoc.exists()) {
        setError("Reset link not found");
        setValidating(false);
        return;
      }

      const data = resetDoc.data();

      if (data.used) {
        setError("This reset link has already been used");
        setValidating(false);
        return;
      }

      const expiresAt = data.expiresAt.toDate();
      if (new Date() > expiresAt) {
        setError("Reset link has expired (valid for 1 hour)");
        setValidating(false);
        return;
      }

      if (data.token !== tokenParam) {
        setError("Invalid reset token");
        setValidating(false);
        return;
      }

      setUserEmail(data.email);
      setUserId(uidParam);
      setToken(tokenParam);
      setIsValid(true);
      setValidating(false);
      console.log("✅ Token validated successfully");
    } catch (err) {
      console.error("❌ Validation error:", err);
      setError("Failed to validate reset link");
      setValidating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !isValid) return;

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords don't match.");
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log("🔐 Resetting password for:", userEmail);

      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId,
          newPassword: password,
        }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Mark token as used
      const db = getFirebaseDb();
      await updateDoc(doc(db, "passwordResets", userId), {
        used: true,
        usedAt: new Date(),
      });

      console.log("✅ Password reset successfully!");
      alert(
        "✅ Password reset successfully! You can now sign in with your new password."
      );
      router.push("/auth");
    } catch (err: any) {
      console.error("❌ Reset error:", err);
      setError(
        err.message || "Failed to reset password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-neutral-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-black">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center text-3xl text-white">
              ✕
            </div>
            <h1 className="text-2xl font-bold text-red-500 mb-2">
              Invalid Link
            </h1>
            <p className="text-neutral-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/forgot-password")}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-black py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to sign in
          </Link>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Set New Password</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Enter a new password for <br />
              <span className="text-white font-medium">{userEmail}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input with Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 ml-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    // eye-off
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    // eye
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input with Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    // eye-off
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    // eye
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text.black shadow-[0_0_20px_rgba(33,221,192,0.15)] hover:shadow-[0_0_25px_rgba(33,221,192,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
