"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CorePitchSection from "@/components/create/CorePitchSection";
import ProductAudienceSection from "@/components/create/ProductAudienceSection";
import DemoVisualsSection from "@/components/create/DemoVisualsSection";
import BusinessSnapshotSection from "@/components/create/BusinessSnapshotSection";
import WhyWinFormSection from "@/components/create/WhyWinFormSection";
import FundraisingFormSection from "@/components/create/FundraisingFormSection";
import DeliverablesFormSection from "@/components/create/DeliverablesFormSection";
import { useEditIdeaForm } from "@/hooks/useEditIdeaForm";
import { updateIdea } from "./utils/updateIdea";
import LoadingSpinner from "@/components/common/ideas/LoadingSpinner";


export default function EditIdeaPage() {
  const params = useParams<{ id: string }>();
  const ideaId = params?.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    formData,
    updateFormData,
    openSection,
    setOpenSection,
    loading,
    notOwner,
    error,
    setError,
    existingThumbnailUrl,
  } = useEditIdeaForm(ideaId, user);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ideaId || formData.saving) return;

    const result = await updateIdea(formData, user, ideaId, existingThumbnailUrl, setError);

    if (result.success) {
      router.push(`/ideas/${ideaId}`);
    } else {
      setOpenSection("core");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isCoreEmpty = !formData.title.trim() && !formData.oneLiner.trim() && !formData.description.trim();
  const isProductEmpty = !formData.websiteUrl.trim() && formData.sectors.length === 0 && formData.targetAudiences.length === 0 && formData.targetDemographics.length === 0;
  const isDemoEmpty = !formData.demoVideoUrl.trim() && !formData.thumbnailPreview;
  const isBusinessEmpty = !formData.foundedYear.trim() && !formData.totalRevenueSinceInception.trim() && !formData.monthlyRecurringRevenue.trim() && !formData.userCount.trim() && formData.revenueModels.length === 0 && formData.targetMarket.length === 0;
  const isWhyWinEmpty = !formData.teamBackground.trim() && !formData.teamWhyYouWillWin.trim() && !formData.industryInsights.trim() && !formData.valuePropositionDetail.trim();
  const isFundraisingEmpty = !formData.isFundraising;
  const isDeliverablesEmpty = !formData.deliverablesOverview.trim() && !formData.deliverablesMilestones.trim();

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (notOwner) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Access Denied</h2>
        <p className="text-sm text-neutral-400 mb-8">Only the founder who published this idea can edit it.</p>
        <button onClick={() => router.push("/ideas")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Ideas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="space-y-3">
        {/* DESKTOP GO BACK */}
        <div className="hidden sm:flex justify-end">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* MOBILE: CENTERED TITLE + CIRCULAR BACK BUTTON */}
        <div className="flex items-start gap-2 sm:hidden">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Edit Your Idea</h1>
            <p className="text-sm text-neutral-400">Update your pitch, metrics, and details</p>
          </div>

          <button
            onClick={() => router.back()}
            className="flex-shrink-0 w-9 h-9 rounded-full border border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 transition-all flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* DESKTOP TITLE */}
        <div className="hidden sm:block">
          <h1 className="text-3xl font-bold tracking-tight">Edit Your Idea</h1>
          <p className="text-sm text-neutral-400">Update your pitch, metrics, and details</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <CorePitchSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "core"} onToggle={() => setOpenSection(openSection === "core" ? null : "core")} showEmptyWarning={isCoreEmpty} />
        <ProductAudienceSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "product"} onToggle={() => setOpenSection(openSection === "product" ? null : "product")} showEmptyWarning={isProductEmpty} />
        <DemoVisualsSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "demo"} onToggle={() => setOpenSection(openSection === "demo" ? null : "demo")} showEmptyWarning={isDemoEmpty} />
        <BusinessSnapshotSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "business"} onToggle={() => setOpenSection(openSection === "business" ? null : "business")} showEmptyWarning={isBusinessEmpty} />
        <WhyWinFormSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "why-win"} onToggle={() => setOpenSection(openSection === "why-win" ? null : "why-win")} showEmptyWarning={isWhyWinEmpty} />
        <FundraisingFormSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "fundraising"} onToggle={() => setOpenSection(openSection === "fundraising" ? null : "fundraising")} showEmptyWarning={isFundraisingEmpty} />
        <DeliverablesFormSection formData={formData} updateFormData={updateFormData} isOpen={openSection === "deliverables"} onToggle={() => setOpenSection(openSection === "deliverables" ? null : "deliverables")} showEmptyWarning={isDeliverablesEmpty} />

        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button type="submit" disabled={formData.saving} className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-black text-sm font-bold hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {formData.saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>

          <button type="button" onClick={() => router.push(`/ideas/${ideaId}`)} className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 text-sm font-semibold hover:bg-neutral-900 hover:border-neutral-600 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}