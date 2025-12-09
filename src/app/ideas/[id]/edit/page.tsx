// src/app/ideas/[id]/edit/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Idea } from "@/types";

import CorePitchSection from "@/components/create/CorePitchSection";
import ProductAudienceSection from "@/components/create/ProductAudienceSection";
import DemoVisualsSection from "@/components/create/DemoVisualsSection";
import BusinessSnapshotSection from "@/components/create/BusinessSnapshotSection";
import WhyWinFormSection from "@/components/create/WhyWinFormSection";
import FundraisingFormSection from "@/components/create/FundraisingFormSection";
import type { IdeaFormData } from "@/app/ideas/new/page";
import { toNumberOrUndefined } from "@/lib/utils";

export default function EditIdeaPage() {
  const params = useParams<{ id: string }>();
  const ideaId = params?.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<IdeaFormData>({
    title: "",
    oneLiner: "",
    description: "",
    websiteUrl: "",
    sectors: [],
    targetAudiences: [],
    targetDemographics: [],
    demoVideoUrl: "",
    thumbnailFile: null,
    thumbnailPreview: null,
    foundedYear: "",
    totalRevenueSinceInception: "",
    monthlyRecurringRevenue: "",
    userCount: "",
    revenueModels: [],
    targetMarket: [], // ← CHANGED: Now an array!
    teamBackground: "",
    teamWhyYouWillWin: "",
    industryInsights: "",
    valuePropositionDetail: "",
    isFundraising: false,
    fundraisingGoal: "",
    fundraisingRaisedSoFar: "",
    fundraisingMinCheckSize: "",
  });

  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notOwner, setNotOwner] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("core");

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Load idea data
  useEffect(() => {
    const loadIdea = async () => {
      if (!ideaId || !user) return;

      setLoading(true);
      try {
        const db = getFirebaseDb();
        const ideaRef = doc(db, "ideas", ideaId);
        const snap = await getDoc(ideaRef);

        if (!snap.exists()) {
          setError("Idea not found.");
          return;
        }

        const data = { id: snap.id, ...(snap.data() as any) } as Idea;

        // Owner check
        if (data.founderId !== user.uid) {
          setNotOwner(true);
          return;
        }

        // ← MIGRATION LOGIC: Convert string targetMarket to array
        let targetMarketArray: string[] = [];
        if (data.targetMarket) {
          if (Array.isArray(data.targetMarket)) {
            targetMarketArray = data.targetMarket;
          } else if (typeof data.targetMarket === 'string' && data.targetMarket.trim()) {
            // Migrate old string format to array
            targetMarketArray = [data.targetMarket.trim()];
          }
        }

        // Pre-fill form data
        const loadedData: IdeaFormData = {
          title: data.title ?? "",
          oneLiner: data.oneLiner ?? "",
          description: data.description ?? "",
          websiteUrl: data.websiteUrl ?? "",
          sectors: (data as any).sectors ?? [],
          targetAudiences: (data as any).targetAudiences ?? [],
          targetDemographics: (data as any).targetDemographics ?? [],
          demoVideoUrl: data.demoVideoUrl ?? "",
          thumbnailFile: null,
          thumbnailPreview: data.thumbnailUrl ?? null,
          foundedYear: data.foundedYear ? String(data.foundedYear) : "",
          totalRevenueSinceInception: data.totalRevenueSinceInception
            ? String(data.totalRevenueSinceInception)
            : "",
          monthlyRecurringRevenue: data.monthlyRecurringRevenue
            ? String(data.monthlyRecurringRevenue)
            : "",
          userCount: data.userCount ? String(data.userCount) : "",
          revenueModels: (data as any).revenueModels ?? [],
          targetMarket: targetMarketArray, // ← CHANGED: Now uses the migrated array
          teamBackground: data.teamBackground ?? "",
          teamWhyYouWillWin: data.teamWhyYouWillWin ?? "",
          industryInsights: data.industryInsights ?? "",
          valuePropositionDetail: data.valuePropositionDetail ?? "",
          isFundraising: Boolean(data.isFundraising),
          fundraisingGoal: data.fundraisingGoal ? String(data.fundraisingGoal) : "",
          fundraisingRaisedSoFar: data.fundraisingRaisedSoFar
            ? String(data.fundraisingRaisedSoFar)
            : "",
          fundraisingMinCheckSize: data.fundraisingMinCheckSize
            ? String(data.fundraisingMinCheckSize)
            : "",
        };

        setFormData(loadedData);
        if (data.thumbnailUrl) {
          setExistingThumbnailUrl(data.thumbnailUrl);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load idea.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadIdea();
    }
  }, [ideaId, user]);

  const updateFormData = (updates: Partial<IdeaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Check if sections have data (for empty warnings)
  const isCoreEmpty = !formData.title.trim() && !formData.oneLiner.trim() && !formData.description.trim();
  
  const isProductEmpty = !formData.websiteUrl.trim() && 
                         formData.sectors.length === 0 && 
                         formData.targetAudiences.length === 0 && 
                         formData.targetDemographics.length === 0;
  
  const isDemoEmpty = !formData.demoVideoUrl.trim() && !formData.thumbnailPreview;
  
  const isBusinessEmpty = !formData.foundedYear.trim() && 
                          !formData.totalRevenueSinceInception.trim() && 
                          !formData.monthlyRecurringRevenue.trim() && 
                          !formData.userCount.trim() && 
                          formData.revenueModels.length === 0 && 
                          formData.targetMarket.length === 0; // ← CHANGED: Check array length
  
  const isWhyWinEmpty = !formData.teamBackground.trim() && 
                        !formData.teamWhyYouWillWin.trim() && 
                        !formData.industryInsights.trim() && 
                        !formData.valuePropositionDetail.trim();
  
  const isFundraisingEmpty = !formData.isFundraising;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !ideaId || saving) return;

    if (!formData.title.trim() || !formData.oneLiner.trim()) {
      setError("Please provide at least a title and a one-liner.");
      setOpenSection("core");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setError("");

    try {
      const db = getFirebaseDb();
      const ideaRef = doc(db, "ideas", ideaId);

      const data: any = {
        title: formData.title.trim(),
        oneLiner: formData.oneLiner.trim(),
        description: formData.description.trim(),
        websiteUrl: formData.websiteUrl.trim() || null,
        demoVideoUrl: formData.demoVideoUrl.trim() || null,
        targetMarket: formData.targetMarket.length ? formData.targetMarket : null, // ← CHANGED: Save as array
        sectors: formData.sectors.length ? formData.sectors : null,
        targetAudiences: formData.targetAudiences.length ? formData.targetAudiences : null,
        targetDemographics: formData.targetDemographics.length ? formData.targetDemographics : null,
        revenueModels: formData.revenueModels.length ? formData.revenueModels : null,
        teamBackground: formData.teamBackground.trim() || null,
        teamWhyYouWillWin: formData.teamWhyYouWillWin.trim() || null,
        industryInsights: formData.industryInsights.trim() || null,
        valuePropositionDetail: formData.valuePropositionDetail.trim() || null,
      };

      // Numbers
      const foundedYearNum = toNumberOrUndefined(formData.foundedYear);
      const totalRevenueNum = toNumberOrUndefined(formData.totalRevenueSinceInception);
      const mrrNum = toNumberOrUndefined(formData.monthlyRecurringRevenue);
      const userCountNum = toNumberOrUndefined(formData.userCount);

      data.foundedYear = foundedYearNum !== undefined ? foundedYearNum : null;
      data.totalRevenueSinceInception = totalRevenueNum !== undefined ? totalRevenueNum : null;
      data.monthlyRecurringRevenue = mrrNum !== undefined ? mrrNum : null;
      data.userCount = userCountNum !== undefined ? userCountNum : null;

      // Fundraising
      const fundraisingGoalNum = toNumberOrUndefined(formData.fundraisingGoal);
      const fundraisingRaisedNum = toNumberOrUndefined(formData.fundraisingRaisedSoFar);
      const fundraisingMinCheckNum = toNumberOrUndefined(formData.fundraisingMinCheckSize);

      if (formData.isFundraising) {
        data.isFundraising = true;
        data.fundraisingGoal = fundraisingGoalNum !== undefined ? fundraisingGoalNum : null;
        data.fundraisingRaisedSoFar = fundraisingRaisedNum !== undefined ? fundraisingRaisedNum : null;
        data.fundraisingMinCheckSize = fundraisingMinCheckNum !== undefined ? fundraisingMinCheckNum : null;
      } else {
        data.isFundraising = false;
        data.fundraisingGoal = null;
        data.fundraisingRaisedSoFar = null;
        data.fundraisingMinCheckSize = null;
      }

      // Thumbnail upload if new file selected
      if (formData.thumbnailFile) {
        const storage = getFirebaseStorage();
        const storageRef = ref(
          storage,
          `idea-thumbnails/${user.uid}/${Date.now()}-${formData.thumbnailFile.name}`
        );
        await uploadBytes(storageRef, formData.thumbnailFile);
        const downloadUrl = await getDownloadURL(storageRef);
        data.thumbnailUrl = downloadUrl;
      }

      await updateDoc(ideaRef, data);
      router.push(`/ideas/${ideaId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to update idea.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-neutral-400 font-medium">Loading idea...</span>
        </div>
      </div>
    );
  }

  if (notOwner) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-neutral-400 mb-8">
          Only the founder who published this idea can edit it.
        </p>
        <button
          onClick={() => router.push("/ideas")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-sm font-medium"
        >
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
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Your Idea</h1>
              <p className="text-sm text-neutral-400">
                Update your pitch, metrics, and details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-300">
            Your changes will be saved and immediately visible to everyone viewing your idea.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-4 py-3.5 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <CorePitchSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "core"}
          onToggle={() => setOpenSection(openSection === "core" ? null : "core")}
          showEmptyWarning={isCoreEmpty}
        />

        <ProductAudienceSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "product"}
          onToggle={() => setOpenSection(openSection === "product" ? null : "product")}
          showEmptyWarning={isProductEmpty}
        />

        <DemoVisualsSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "demo"}
          onToggle={() => setOpenSection(openSection === "demo" ? null : "demo")}
          showEmptyWarning={isDemoEmpty}
        />

        <BusinessSnapshotSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "business"}
          onToggle={() => setOpenSection(openSection === "business" ? null : "business")}
          showEmptyWarning={isBusinessEmpty}
        />

        <WhyWinFormSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "why-win"}
          onToggle={() => setOpenSection(openSection === "why-win" ? null : "why-win")}
          showEmptyWarning={isWhyWinEmpty}
        />

        <FundraisingFormSection
          formData={formData}
          updateFormData={updateFormData}
          isOpen={openSection === "fundraising"}
          onToggle={() => setOpenSection(openSection === "fundraising" ? null : "fundraising")}
          showEmptyWarning={isFundraisingEmpty}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Changes...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/ideas/${ideaId}`)}
            className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 text-sm font-semibold hover:bg-neutral-900 hover:border-neutral-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}