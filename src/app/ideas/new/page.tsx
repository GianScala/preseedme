// app/ideas/new/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CorePitchSection from "@/components/create/CorePitchSection";
import ProductAudienceSection from "@/components/create/ProductAudienceSection";
import DemoVisualsSection from "@/components/create/DemoVisualsSection";
import BusinessSnapshotSection from "@/components/create/BusinessSnapshotSection";
import WhyWinFormSection from "@/components/create/WhyWinFormSection";
import FundraisingFormSection from "@/components/create/FundraisingFormSection";
import DeliverablesFormSection from "@/components/create/DeliverablesFormSection";
import SuccessModal from "@/components/modals/SuccessModal";
import { useNewIdeaForm } from "@/hooks/useNewIdeaForm";
import { submitIdea } from "./utils/submitIdea";

export default function NewIdeaPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { formData, updateFormData, openSection, setOpenSection } =
    useNewIdeaForm();

  // ✅ Protection Layer 1: Ref to prevent double submissions
  const isSubmittingRef = useRef(false);

  // ✅ Protection Layer 2: Unique submission ID generated once
  const submissionIdRef = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  );

  // ✅ Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/ideas/new");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Protection Layer 3: Guard against duplicate submissions
    if (isSubmittingRef.current || formData.saving) {
      console.warn(
        "⚠️ Submission already in progress, ignoring duplicate click"
      );
      return;
    }

    if (!user || !profile) {
      updateFormData({
        error: "User not authenticated. Please sign in.",
      });
      return;
    }

    // ✅ Protection Layer 4: Set flag IMMEDIATELY (before any async operations)
    isSubmittingRef.current = true;

    // Update form state
    updateFormData({ error: "", saving: true });

    try {
      // ✅ Protection Layer 5: Submit with idempotency key
      const result = await submitIdea(
        formData,
        user,
        profile,
        submissionIdRef.current
      );

      if (result.success) {
        // ✅ Show success modal
        setShowSuccessModal(true);
        // Note: Don't reset isSubmittingRef - we're done with this form
      } else {
        // Reset flag so user can retry
        isSubmittingRef.current = false;
        updateFormData({
          error:
            result.error || "Failed to publish idea. Please try again.",
          saving: false,
        });
        setOpenSection("core");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error: any) {
      // Reset flag on exception
      isSubmittingRef.current = false;
      updateFormData({
        error:
          error?.message ||
          "An unexpected error occurred. Please try again.",
        saving: false,
      });
      console.error("💥 Submission error:", error);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Redirect to ideas page
    router.push("/ideas");
  };

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-neutral-400 font-medium">
            {loading ? "Loading..." : "Redirecting to sign in…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-16">
        <header className="space-y-3">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Share Your Idea
            </h1>
            <p className="text-sm text-neutral-400">
              Create your pitch in{" "}
              <span className="text-brand font-semibold">~5 minutes</span>
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <CorePitchSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "core"}
            onToggle={() =>
              setOpenSection(openSection === "core" ? null : "core")
            }
          />

          <ProductAudienceSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "product"}
            onToggle={() =>
              setOpenSection(openSection === "product" ? null : "product")
            }
          />

          <DemoVisualsSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "demo"}
            onToggle={() =>
              setOpenSection(openSection === "demo" ? null : "demo")
            }
          />

          <BusinessSnapshotSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "business"}
            onToggle={() =>
              setOpenSection(openSection === "business" ? null : "business")
            }
          />

          <WhyWinFormSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "why-win"}
            onToggle={() =>
              setOpenSection(openSection === "why-win" ? null : "why-win")
            }
          />

          <FundraisingFormSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "fundraising"}
            onToggle={() =>
              setOpenSection(
                openSection === "fundraising" ? null : "fundraising"
              )
            }
          />

          <DeliverablesFormSection
            formData={formData}
            updateFormData={updateFormData}
            isOpen={openSection === "deliverables"}
            onToggle={() =>
              setOpenSection(
                openSection === "deliverables" ? null : "deliverables"
              )
            }
          />

          <div className="flex flex-wrap items-center gap-3 pt-6">
            <button
              type="submit"
              // ✅ Protection Layer 6: Disable based on BOTH ref AND state
              disabled={formData.saving || isSubmittingRef.current}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-black text-sm font-bold hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formData.saving || isSubmittingRef.current ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center gap-2">Publish Idea</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              disabled={formData.saving || isSubmittingRef.current}
              className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 text-sm font-semibold hover:bg-neutral-900 hover:border-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {formData.error && (
            <div className="flex items-start gap-3 text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-4 py-3.5 animate-in fade-in slide-in-from-top-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold mb-1">Error</p>
                <p>{formData.error}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ✅ Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
      />
    </>
  );
}