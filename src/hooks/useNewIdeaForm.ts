// src/hooks/useNewIdeaForm.ts
import { useState } from "react";

interface Deliverable {
  id: string;
  text: string;
  progress: number;
  createdAt: number;
}

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
  deliverables: Deliverable[]; // ✅ Added
  deliverablesMilestones: string; // Kept for backwards compatibility
  saving: boolean;
  error: string;
}

export function useNewIdeaForm() {
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
    deliverables: [], // ✅ Added
    deliverablesMilestones: "",
    saving: false,
    error: "",
  });

  const [openSection, setOpenSection] = useState<string | null>("core");

  const updateFormData = (updates: Partial<IdeaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
    formData,
    updateFormData,
    openSection,
    setOpenSection,
  };
}