// src/app/onboarding/handle/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  claimHandleForUser, 
  sanitizeHandle, 
  generateDefaultHandle,
  isHandleAvailable 
} from "@/lib/handles";

export default function HandleOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [previewHandle, setPreviewHandle] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth");
        return;
      }

      const loadUser = async () => {
        setLoading(true);
        try {
          const db = getFirebaseDb();
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            setLoading(false);
            return;
          }

          const data = snap.data();
          if (data.username) setUsername(data.username);

          // Redirect if handle already exists (handle is permanent)
          if (data.handle) {
            router.replace("/profile");
            return;
          }
        } catch (err) {
          console.error("Error loading user:", err);
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    }
  }, [authLoading, user, router]);

  // Live preview and availability check
  useEffect(() => {
    const sanitized = sanitizeHandle(handle);
    setPreviewHandle(sanitized);

    if (!sanitized || sanitized.length < 3) {
      setIsAvailable(null);
      return;
    }

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const available = await isHandleAvailable(sanitized);
        setIsAvailable(available);
      } catch (err) {
        console.error("Error checking availability:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [handle]);

  const handleSkip = async () => {
    if (!user || saving) return;

    setSaving(true);
    setError("");

    try {
      const defaultHandle = generateDefaultHandle(username, user.uid);
      const finalUsername = username.trim() || "User";
      
      await claimHandleForUser(user.uid, finalUsername, defaultHandle);
      router.replace("/profile");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to set up profile");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    if (!username.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!handle.trim()) {
      setError("Please enter a handle.");
      return;
    }

    if (previewHandle.length < 3) {
      setError("Handle must be at least 3 characters.");
      return;
    }

    if (isAvailable === false) {
      setError("This handle is already taken.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await claimHandleForUser(user.uid, username, handle);
      router.replace("/profile");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to claim handle");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400">
        <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
        <span className="text-sm">Preparing your profile...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-800 px-3 py-1 text-[11px] font-medium text-neutral-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              Complete Your Profile
            </div>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold">
            Choose your handle
          </h1>
          <p className="text-sm text-neutral-400">
            This is how people will mention you on PreseedMe.{" "}
            <span className="text-red-300 font-medium">
              Your handle is permanent and cannot be changed later.
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-200">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-lg px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-sm focus:border-brand focus:ring-2 focus:ring-[var(--brand)]/20 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          {/* Handle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-200">
              Handle <span className="text-red-400">*</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-neutral-500">@</span>
              <input
                className="flex-1 rounded-lg px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-sm focus:border-brand focus:ring-2 focus:ring-[var(--brand)]/20 outline-none transition-all"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your_handle"
                required
              />
            </div>

            {previewHandle && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {checkingAvailability ? (
                    <span className="text-neutral-500">
                      <span className="inline-block w-3 h-3 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin mr-1" />
                      Checking availability...
                    </span>
                  ) : isAvailable === true ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      @{previewHandle} is available
                    </span>
                  ) : isAvailable === false ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      @{previewHandle} is taken
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || checkingAvailability || isAvailable === false}
            className="w-full px-6 py-2.5 rounded-lg bg-brand text-black text-sm font-semibold hover:bg-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 4px 14px 0 rgb(var(--brand) / 20%)" }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>

          <p className="text-[11px] text-neutral-500 text-center">
            Clicking "Skip" will create you default handle based on your name{" "}
          </p>
        </form>
      </div>
    </div>
  );
}
