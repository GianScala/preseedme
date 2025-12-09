// src/app/ideas/new/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import CorePitchSection from "@/components/create/CorePitchSection";
import ProductAudienceSection from "@/components/create/ProductAudienceSection";
import DemoVisualsSection from "@/components/create/DemoVisualsSection";
import BusinessSnapshotSection from "@/components/create/BusinessSnapshotSection";
import WhyWinFormSection from "@/components/create/WhyWinFormSection";
import FundraisingFormSection from "@/components/create/FundraisingFormSection";
import { toNumberOrUndefined } from "@/lib/utils";

export interface IdeaFormData {
  // Core
  title: string;
  oneLiner: string;
  description: string;

  // Product & Audience
  websiteUrl: string;
  sectors: string[];
  targetAudiences: string[];
  targetDemographics: string[];

  // Demo & Visuals
  demoVideoUrl: string;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;

  // Business
  foundedYear: string;
  totalRevenueSinceInception: string;
  monthlyRecurringRevenue: string;
  userCount: string;
  revenueModels: string[];
  targetMarket: string[]; // ← CHANGED: Now an array!

  // Why Win
  teamBackground: string;
  teamWhyYouWillWin: string;
  industryInsights: string;
  valuePropositionDetail: string;

  // Fundraising
  isFundraising: boolean;
  fundraisingGoal: string;
  fundraisingRaisedSoFar: string;
  fundraisingMinCheckSize: string;
}

export default function NewIdeaPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Accordion states
  const [openSection, setOpenSection] = useState<string | null>("core");

  // Redirect if not authenticated (after auth state is known)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/ideas/new");
    }
  }, [loading, user, router]);

  const updateFormData = (updates: Partial<IdeaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

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
      const ideasRef = collection(db, "ideas");

      const data: any = {
        title: formData.title.trim(),
        oneLiner: formData.oneLiner.trim(),
        description: formData.description.trim(),
        founderId: user.uid,
        founderHandle: profile.handle,
        founderUsername: profile.username,
        createdAt: serverTimestamp(),
      };

      // Optional links
      if (formData.websiteUrl.trim())
        data.websiteUrl = formData.websiteUrl.trim();
      if (formData.demoVideoUrl.trim())
        data.demoVideoUrl = formData.demoVideoUrl.trim();

      // Arrays
      if (formData.sectors.length) data.sectors = formData.sectors;
      if (formData.targetAudiences.length)
        data.targetAudiences = formData.targetAudiences;
      if (formData.targetDemographics.length)
        data.targetDemographics = formData.targetDemographics;
      if (formData.revenueModels.length)
        data.revenueModels = formData.revenueModels;
      if (formData.targetMarket.length) // ← CHANGED: Check array length
        data.targetMarket = formData.targetMarket;

      // Numeric fields
      const foundedYearNum = toNumberOrUndefined(formData.foundedYear);
      const totalRevenueNum = toNumberOrUndefined(
        formData.totalRevenueSinceInception
      );
      const mrrNum = toNumberOrUndefined(formData.monthlyRecurringRevenue);
      const userCountNum = toNumberOrUndefined(formData.userCount);

      if (foundedYearNum !== undefined) data.foundedYear = foundedYearNum;
      if (totalRevenueNum !== undefined)
        data.totalRevenueSinceInception = totalRevenueNum;
      if (mrrNum !== undefined) data.monthlyRecurringRevenue = mrrNum;
      if (userCountNum !== undefined) data.userCount = userCountNum;

      // Why you'll win
      if (formData.teamBackground.trim())
        data.teamBackground = formData.teamBackground.trim();
      if (formData.teamWhyYouWillWin.trim())
        data.teamWhyYouWillWin = formData.teamWhyYouWillWin.trim();
      if (formData.industryInsights.trim())
        data.industryInsights = formData.industryInsights.trim();
      if (formData.valuePropositionDetail.trim())
        data.valuePropositionDetail = formData.valuePropositionDetail.trim();

      // Fundraising
      const fundraisingGoalNum = toNumberOrUndefined(
        formData.fundraisingGoal
      );
      const fundraisingRaisedNum = toNumberOrUndefined(
        formData.fundraisingRaisedSoFar
      );
      const fundraisingMinCheckNum = toNumberOrUndefined(
        formData.fundraisingMinCheckSize
      );

      if (formData.isFundraising) {
        data.isFundraising = true;
        if (fundraisingGoalNum !== undefined)
          data.fundraisingGoal = fundraisingGoalNum;
        if (fundraisingRaisedNum !== undefined)
          data.fundraisingRaisedSoFar = fundraisingRaisedNum;
        if (fundraisingMinCheckNum !== undefined)
          data.fundraisingMinCheckSize = fundraisingMinCheckNum;
      }

      // Thumbnail upload
      if (formData.thumbnailFile) {
        const storage = getFirebaseStorage();
        const storageRef = ref(
          storage,
          `idea-thumbnails/${user.uid}/${Date.now()}-${
            formData.thumbnailFile.name
          }`
        );
        await uploadBytes(storageRef, formData.thumbnailFile);
        const downloadUrl = await getDownloadURL(storageRef);
        data.thumbnailUrl = downloadUrl;
      }

      // Create idea
      const docRef = await addDoc(ideasRef, data);

      // Attach idea to user
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        publishedIdeaIds: arrayUnion(docRef.id),
      });

      router.push(`/ideas/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to publish your idea.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // While auth is loading OR user/profile missing, don't render the form
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Share Your Idea
            </h1>
            <p className="text-sm text-neutral-400">
              Create your pitch in{" "}
              <span className="text-brand font-semibold">~5 minutes</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-300">
            Your idea will be publicly visible. Investors and supporters can
            discover and contact you.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
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
              <p>{error}</p>
            </div>
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-black text-sm font-bold hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
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
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Publish Idea
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 text-sm font-semibold hover:bg-neutral-900 hover:border-neutral-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}