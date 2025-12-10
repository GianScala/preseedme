// src/components/create/WhyWinFormSection.tsx
import { IdeaFormData } from "@/app/ideas/new/page";
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
      isComplete={false}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-5">
        {/* Team Background */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label="Team Background"
            value={formData.teamBackground}
            onChange={(value) => updateFormData({ teamBackground: value })}
            placeholder="Who's on the team? Highlight relevant experience, past wins, or unique skills that make you credible."
            rows={4}
            helpText="Investors back people. Show why your team is the right one."
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Competitive Advantage */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label="Competitive Advantage"
            value={formData.teamWhyYouWillWin}
            onChange={(value) => updateFormData({ teamWhyYouWillWin: value })}
            placeholder="Why are you uniquely positioned to dominate this market? Think: distribution, speed, network effects, or insider knowledge."
            rows={4}
            helpText="What's your unfair advantage over competitors?"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          />
        </div>

        {/* Market Insights */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label="Market Insights"
            value={formData.industryInsights}
            onChange={(value) => updateFormData({ industryInsights: value })}
            placeholder="What non-obvious insight do you have about this problem or market? Share data, examples, or stories that prove you understand the space."
            rows={4}
            helpText="The more concrete and specific, the better"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
          />
        </div>

        {/* Value Proposition (Detailed) */}
        <div className="max-h-64 overflow-y-auto">
          <FormTextarea
            label="Value Proposition (Detailed)"
            value={formData.valuePropositionDetail}
            onChange={(value) => updateFormData({ valuePropositionDetail: value })}
            placeholder="Explain in concrete terms how your product creates value. How does it save time, make money, or solve a painful problem for users?"
            rows={4}
            helpText="Go deeper than your one-liner—be specific about the value"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
