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
import { toNumberOrUndefined } from "@/lib/utils";
import { IdeaFormData } from "@/hooks/useNewIdeaForm";

interface SubmitResult {
  success: boolean;
  ideaId?: string;
  error?: string;
}

export async function submitIdea(
  formData: IdeaFormData,
  user: any,
  profile: any
): Promise<SubmitResult> {
  if (!formData.title.trim() || !formData.oneLiner.trim()) {
    formData.error = "Please provide at least a title and a one-liner.";
    return { success: false, error: formData.error };
  }

  formData.saving = true;
  formData.error = "";

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
      updatedAt: serverTimestamp(), // ✅ Added
    };

    if (formData.websiteUrl.trim())
      data.websiteUrl = formData.websiteUrl.trim();
    if (formData.demoVideoUrl.trim())
      data.demoVideoUrl = formData.demoVideoUrl.trim();

    if (formData.sectors.length) data.sectors = formData.sectors;
    if (formData.targetAudiences.length)
      data.targetAudiences = formData.targetAudiences;
    if (formData.targetDemographics.length)
      data.targetDemographics = formData.targetDemographics;
    if (formData.revenueModels.length)
      data.revenueModels = formData.revenueModels;
    if (formData.targetMarket.length)
      data.targetMarket = formData.targetMarket;

    const foundedYearNum = toNumberOrUndefined(formData.foundedYear);
    const totalRevenueNum = toNumberOrUndefined(formData.totalRevenueSinceInception);
    const mrrNum = toNumberOrUndefined(formData.monthlyRecurringRevenue);
    const userCountNum = toNumberOrUndefined(formData.userCount);

    if (foundedYearNum !== undefined) data.foundedYear = foundedYearNum;
    if (totalRevenueNum !== undefined)
      data.totalRevenueSinceInception = totalRevenueNum;
    if (mrrNum !== undefined) data.monthlyRecurringRevenue = mrrNum;
    if (userCountNum !== undefined) data.userCount = userCountNum;

    if (formData.teamBackground.trim())
      data.teamBackground = formData.teamBackground.trim();
    if (formData.teamWhyYouWillWin.trim())
      data.teamWhyYouWillWin = formData.teamWhyYouWillWin.trim();
    if (formData.industryInsights.trim())
      data.industryInsights = formData.industryInsights.trim();
    if (formData.valuePropositionDetail.trim())
      data.valuePropositionDetail = formData.valuePropositionDetail.trim();

    const fundraisingGoalNum = toNumberOrUndefined(formData.fundraisingGoal);
    const fundraisingRaisedNum = toNumberOrUndefined(formData.fundraisingRaisedSoFar);
    const fundraisingMinCheckNum = toNumberOrUndefined(formData.fundraisingMinCheckSize);

    if (formData.isFundraising) {
      data.isFundraising = true;
      if (fundraisingGoalNum !== undefined)
        data.fundraisingGoal = fundraisingGoalNum;
      if (fundraisingRaisedNum !== undefined)
        data.fundraisingRaisedSoFar = fundraisingRaisedNum;
      if (fundraisingMinCheckNum !== undefined)
        data.fundraisingMinCheckSize = fundraisingMinCheckNum;
    }

    // ✅ Updated deliverables section
    if (formData.deliverablesOverview.trim()) {
      data.deliverablesOverview = formData.deliverablesOverview.trim();
    }
    if (formData.deliverables.length > 0) {
      data.deliverables = formData.deliverables;
      data.deliverablesUpdatedAt = Date.now();
    }
    // Backwards compatibility
    if (formData.deliverablesMilestones.trim()) {
      data.deliverablesMilestones = formData.deliverablesMilestones.trim();
    }

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

    const docRef = await addDoc(ideasRef, data);

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      publishedIdeaIds: arrayUnion(docRef.id),
    });

    formData.saving = false;
    return { success: true, ideaId: docRef.id };
  } catch (err: any) {
    console.error(err);
    formData.saving = false;
    formData.error = err.message ?? "Failed to publish your idea.";
    return { success: false, error: formData.error };
  }
}