// src/components/create/DeliverablesFormSection.tsx
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import { Target } from "lucide-react"; // nice “goal / outcomes” icon

interface DeliverablesFormSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function DeliverablesFormSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: DeliverablesFormSectionProps) {
  // Mark complete when both fields have content
  const isComplete = !!(
    formData.deliverablesOverview?.trim() &&
    formData.deliverablesMilestones?.trim()
  );

  return (
    <SectionWrapper
      number={7} // 👈 adjust if your numbering is different
      title="Deliverables & Milestones"
      description="Explain what you’ll deliver with this round and how progress will be tracked."
      isOpen={isOpen}
      onToggle={onToggle}
      isComplete={isComplete}
      showEmptyWarning={showEmptyWarning}
      icon={<Target className="w-6 h-6" strokeWidth={1.5} />}
    >
      <div className="space-y-6">
        {/* Row 1: Overview – tied to funding ask */}
        <FormTextarea
          label="Deliverables overview"
          value={formData.deliverablesOverview}
          onChange={(value) => updateFormData({ deliverablesOverview: value })}
          placeholder="What do you expect to deliver with this funding? (e.g. ship v1, reach X MRR, onboard Y customers...)"
          rows={4}
          helpText="Connect your funding ask to concrete outcomes: shipped features, growth goals, or other clear results."
        />

        {/* Row 2: Milestones */}
        <FormTextarea
          label="Milestones & timeline"
          value={formData.deliverablesMilestones}
          onChange={(value) =>
            updateFormData({ deliverablesMilestones: value })
          }
          placeholder={`Break it into 2–5 milestones, with rough timing. For example:
- Month 1–2: Closed beta, 10 design partners
- Month 3–4: Public launch, 1,000 signups
- Month 5–6: $10k MRR, expand to EU`}
          rows={5}
          helpText="Investors love to see a simple plan they can track against. Think in phases with clear, measurable checkpoints."
        />
      </div>
    </SectionWrapper>
  );
}
