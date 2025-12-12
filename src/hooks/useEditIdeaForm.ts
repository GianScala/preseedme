import { useState, useEffect } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Idea } from "@/types";

export interface IdeaFormData {
  title: string;
  oneLiner: string;
  description: string;
  websiteUrl: string;
  sectors: string[];
  targetAudiences: string[];
  targetDemographics: string[];
  demoVideoUrl: string;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  foundedYear: string;
  totalRevenueSinceInception: string;
  monthlyRecurringRevenue: string;
  userCount: string;
  revenueModels: string[];
  targetMarket: string[];
  teamBackground: string;
  teamWhyYouWillWin: string;
  industryInsights: string;
  valuePropositionDetail: string;
  isFundraising: boolean;
  fundraisingGoal: string;
  fundraisingRaisedSoFar: string;
  fundraisingMinCheckSize: string;
  deliverablesOverview: string;
  deliverablesMilestones: string;
  saving: boolean;
  error: string;
}

export function useEditIdeaForm(ideaId: string | undefined, user: any) {
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
    targetMarket: [],
    teamBackground: "",
    teamWhyYouWillWin: "",
    industryInsights: "",
    valuePropositionDetail: "",
    isFundraising: false,
    fundraisingGoal: "",
    fundraisingRaisedSoFar: "",
    fundraisingMinCheckSize: "",
    deliverablesOverview: "",
    deliverablesMilestones: "",
    saving: false,
    error: "",
  });

  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notOwner, setNotOwner] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("core");

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

        if (data.founderId !== user.uid) {
          setNotOwner(true);
          return;
        }

        let targetMarketArray: string[] = [];
        if (data.targetMarket) {
          if (Array.isArray(data.targetMarket)) {
            targetMarketArray = data.targetMarket as any;
          } else if (typeof data.targetMarket === "string" && data.targetMarket.trim()) {
            targetMarketArray = [data.targetMarket.trim()];
          }
        }

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
          totalRevenueSinceInception: data.totalRevenueSinceInception ? String(data.totalRevenueSinceInception) : "",
          monthlyRecurringRevenue: data.monthlyRecurringRevenue ? String(data.monthlyRecurringRevenue) : "",
          userCount: data.userCount ? String(data.userCount) : "",
          revenueModels: (data as any).revenueModels ?? [],
          targetMarket: targetMarketArray,
          teamBackground: data.teamBackground ?? "",
          teamWhyYouWillWin: data.teamWhyYouWillWin ?? "",
          industryInsights: data.industryInsights ?? "",
          valuePropositionDetail: data.valuePropositionDetail ?? "",
          isFundraising: Boolean(data.isFundraising),
          fundraisingGoal: data.fundraisingGoal ? String(data.fundraisingGoal) : "",
          fundraisingRaisedSoFar: data.fundraisingRaisedSoFar ? String(data.fundraisingRaisedSoFar) : "",
          fundraisingMinCheckSize: data.fundraisingMinCheckSize ? String(data.fundraisingMinCheckSize) : "",
          deliverablesOverview: data.deliverablesOverview ?? "",
          deliverablesMilestones: data.deliverablesMilestones ?? "",
          saving: false,
          error: "",
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

  return {
    formData,
    updateFormData,
    openSection,
    setOpenSection,
    loading,
    error,
    setError,
    notOwner,
    existingThumbnailUrl,
  };
}