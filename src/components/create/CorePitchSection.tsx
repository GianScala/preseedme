// src/components/create/CorePitchSection.tsx
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import { Rocket } from "lucide-react";

interface CorePitchSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function CorePitchSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: CorePitchSectionProps) {
  // Logic extracted for cleanliness
  const isComplete = !!(
    formData.title?.trim() && 
    formData.oneLiner?.trim() && 
    formData.description?.trim()
  );

  return (
    <SectionWrapper
      number={1}
      title="The Core Pitch"
      description="Define the essentials that will grab people's attention"
      isOpen={isOpen}
      onToggle={onToggle}
      isComplete={isComplete}
      showEmptyWarning={showEmptyWarning}
      icon={<Rocket className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Row 1: High Priority Inputs */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <FormInput
            label={
              <span>
                Project Name <span className="text-red-400">*</span>
              </span>
            }
            required
            value={formData.title}
            onChange={(value) => updateFormData({ title: value })}
            placeholder="e.g., Nexus AI"
            maxLength={60}
            helpText="Short, punchy, and memorable."
            showCounter
          />
          <FormInput
            label={
              <span>
                One-Liner <span className="text-red-400">*</span>
              </span>
            }
            required
            value={formData.oneLiner}
            onChange={(value) => updateFormData({ oneLiner: value })}
            placeholder="e.g. We are the operating system for modern freight"
            maxLength={150}
            helpText="Your value proposition in a single sentence."
            showCounter
          />
        </div>

        {/* Row 2: Deep Dive */}
        <FormTextarea
          label={
            <span>
              Full Description <span className="text-red-400">*</span>
            </span>
          }
          required
          value={formData.description}
          onChange={(value) => updateFormData({ description: value })}
          placeholder="What is the problem? How do you solve it? Who is it for? Give us the 30-second elevator pitch expanded into a paragraph."
          rows={5}
          helpText="This is the first thing early users and investors read. Be clear, not clever."
        />
      </div>
    </SectionWrapper>
  );
}