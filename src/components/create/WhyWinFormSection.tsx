// src/components/create/WhyWinFormSection.tsx
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormTextarea from "./FormTextarea";

interface WhyWinFormSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function WhyWinFormSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: WhyWinFormSectionProps) {
  // Check if ALL fields are complete
  const isComplete = !!(
    formData.teamBackground &&
    formData.teamBackground.trim() !== "" &&
    formData.teamWhyYouWillWin &&
    formData.teamWhyYouWillWin.trim() !== "" &&
    formData.industryInsights &&
    formData.industryInsights.trim() !== "" &&
    formData.valuePropositionDetail &&
    formData.valuePropositionDetail.trim() !== ""
  );

  return (
    <SectionWrapper
      number={5}
      title="Why You'll Win"
      description="Your secret sauce—what makes this a winning bet"
      isOpen={isOpen}
      onToggle={onToggle}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      }
      isComplete={isComplete}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-5">
        {/* Team Background - REQUIRED */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label={
              <span>
                Team Background <span className="text-red-400">*</span>
              </span>
            }
            value={formData.teamBackground}
            onChange={(value) => updateFormData({ teamBackground: value })}
            placeholder="Who's on the team? Highlight relevant experience, past wins, or unique skills that make you credible."
            rows={4}
            helpText="Investors back people. Show why your team is the right one."
          />
        </div>

        {/* Competitive Advantage - REQUIRED */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label={
              <span>
                Competitive Advantage <span className="text-red-400">*</span>
              </span>
            }
            value={formData.teamWhyYouWillWin}
            onChange={(value) => updateFormData({ teamWhyYouWillWin: value })}
            placeholder="Why are you uniquely positioned to dominate this market? Think: distribution, speed, network effects, or insider knowledge."
            rows={4}
            helpText="What's your unfair advantage over competitors?"
          />
        </div>

        {/* Market Insights - REQUIRED */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label={
              <span>
                Market Insights <span className="text-red-400">*</span>
              </span>
            }
            value={formData.industryInsights}
            onChange={(value) => updateFormData({ industryInsights: value })}
            placeholder="What non-obvious insight do you have about this problem or market? Share data, examples, or stories that prove you understand the space."
            rows={4}
            helpText="The more concrete and specific, the better"
          />
        </div>

        {/* Value Proposition (Detailed) - REQUIRED */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label={
              <span>
                Value Proposition (Detailed) <span className="text-red-400">*</span>
              </span>
            }
            value={formData.valuePropositionDetail}
            onChange={(value) => updateFormData({ valuePropositionDetail: value })}
            placeholder="Explain in concrete terms how your product creates value. How does it save time, make money, or solve a painful problem for users?"
            rows={4}
            helpText="Go deeper than your one-liner—be specific about the value"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}