import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toNumberOrUndefined } from "@/lib/utils";
import { IdeaFormData } from "@/hooks/useEditIdeaForm";

interface UpdateResult {
  success: boolean;
  error?: string;
}

export async function updateIdea(
  formData: IdeaFormData,
  user: any,
  ideaId: string,
  existingThumbnailUrl: string | null,
  setError: (error: string) => void
): Promise<UpdateResult> {
  if (!formData.title.trim() || !formData.oneLiner.trim()) {
    const error = "Please provide at least a title and a one-liner.";
    setError(error);
    return { success: false, error };
  }

  formData.saving = true;
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
      targetMarket: formData.targetMarket.length ? formData.targetMarket : null,
      sectors: formData.sectors.length ? formData.sectors : null,
      targetAudiences: formData.targetAudiences.length ? formData.targetAudiences : null,
      targetDemographics: formData.targetDemographics.length ? formData.targetDemographics : null,
      revenueModels: formData.revenueModels.length ? formData.revenueModels : null,
      teamBackground: formData.teamBackground.trim() || null,
      teamWhyYouWillWin: formData.teamWhyYouWillWin.trim() || null,
      industryInsights: formData.industryInsights.trim() || null,
      valuePropositionDetail: formData.valuePropositionDetail.trim() || null,
      deliverablesOverview: formData.deliverablesOverview.trim() || null,
      deliverablesMilestones: formData.deliverablesMilestones.trim() || null,
    };

    const foundedYearNum = toNumberOrUndefined(formData.foundedYear);
    const totalRevenueNum = toNumberOrUndefined(formData.totalRevenueSinceInception);
    const mrrNum = toNumberOrUndefined(formData.monthlyRecurringRevenue);
    const userCountNum = toNumberOrUndefined(formData.userCount);

    data.foundedYear = foundedYearNum !== undefined ? foundedYearNum : null;
    data.totalRevenueSinceInception = totalRevenueNum !== undefined ? totalRevenueNum : null;
    data.monthlyRecurringRevenue = mrrNum !== undefined ? mrrNum : null;
    data.userCount = userCountNum !== undefined ? userCountNum : null;

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

    if (formData.thumbnailFile) {
      const storage = getFirebaseStorage();
      const storageRef = ref(storage, `idea-thumbnails/${user.uid}/${Date.now()}-${formData.thumbnailFile.name}`);
      await uploadBytes(storageRef, formData.thumbnailFile);
      const downloadUrl = await getDownloadURL(storageRef);
      data.thumbnailUrl = downloadUrl;
    } else if (existingThumbnailUrl) {
      data.thumbnailUrl = existingThumbnailUrl;
    }

    await updateDoc(ideaRef, data);
    formData.saving = false;
    return { success: true };
  } catch (err: any) {
    console.error(err);
    formData.saving = false;
    const error = err.message ?? "Failed to update idea.";
    setError(error);
    return { success: false, error };
  }
}