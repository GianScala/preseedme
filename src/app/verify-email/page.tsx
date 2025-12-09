"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#21DDC0] border-t-transparent rounded-full animate-spin" />
              <h1 className="text-2xl font-bold mb-4 text-white">
                Loading verification page...
              </h1>
              <p className="text-neutral-400">
                Please wait while we prepare your verification.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailPageInner />
    </Suspense>
  );
}

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function verifyEmail() {
    const token = searchParams.get("token");
    const uid = searchParams.get("uid");

    if (!token || !uid) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    try {
      const db = getFirebaseDb();
      const verificationDoc = await getDoc(
        doc(db, "emailVerifications", uid)
      );

      if (!verificationDoc.exists()) {
        setStatus("error");
        setMessage("Verification link not found");
        return;
      }

      const data = verificationDoc.data();

      // Already verified
      if (data.verified) {
        setStatus("success");
        setMessage("Email already verified! Redirecting...");
        setTimeout(() => router.push("/auth"), 2000);
        return;
      }

      // Expired
      const expiresAt = data.expiresAt.toDate();
      if (new Date() > expiresAt) {
        setStatus("error");
        setMessage("Verification link expired. Please request a new one.");
        return;
      }

      // Token mismatch
      if (data.token !== token) {
        setStatus("error");
        setMessage("Invalid verification token");
        return;
      }

      // Mark verification document as verified
      await updateDoc(doc(db, "emailVerifications", uid), {
        verified: true,
        verifiedAt: new Date(),
      });

      // Mark user as verified
      await updateDoc(doc(db, "users", uid), {
        emailVerified: true,
      });

      setStatus("success");
      setMessage("Email verified successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/auth"), 3000);
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Failed to verify email. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center">
        <div
          className={`p-8 rounded-2xl border ${
            status === "loading"
              ? "border-white/10 bg-white/5"
              : status === "success"
              ? "border-[#21DDC0]/30 bg-[#21DDC0]/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          {status === "loading" && (
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#21DDC0] border-t-transparent rounded-full animate-spin" />
          )}

          {status === "success" && (
            <div className="w-16 h-16 mx-auto mb-6 bg-[#21DDC0] rounded-full flex items-center justify-center text-3xl text-black">
              ✓
            </div>
          )}

          {status === "error" && (
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center text-3xl text.white">
              ✕
            </div>
          )}

          <h1
            className={`text-2xl font-bold mb-4 ${
              status === "success"
                ? "text-[#21DDC0]"
                : status === "error"
                ? "text-red-500"
                : "text-white"
            }`}
          >
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h1>

          <p className="text-neutral-400">{message}</p>

          {status === "error" && (
            <button
              onClick={() => router.push("/auth")}
              className="mt-6 px-6 py-2 rounded-lg bg-white/10 hover:bg.white/20 text-white transition-colors"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
