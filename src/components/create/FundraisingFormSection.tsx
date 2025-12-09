// src/components/create/FundraisingFormSection.tsx
import { IdeaFormData } from "@/app/ideas/new/page";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";

const FUNDRAISING_GOAL_OPTIONS = [500, 1000, 2500, 5000, 10000, 15000, 25000];

interface FundraisingFormSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function FundraisingFormSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: FundraisingFormSectionProps) {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <SectionWrapper
      number={6}
      title="Fundraising"
      description="Let angels and supporters know what you're raising"
      isOpen={isOpen}
      onToggle={onToggle}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      isComplete={formData.isFundraising}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-6">
        {/* Fundraising Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-800 bg-neutral-950/50">
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-200 mb-1">
              Currently Fundraising?
            </p>
            <p className="text-xs text-neutral-500">
              Toggle on to show fundraising details on your idea page
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateFormData({ isFundraising: !formData.isFundraising })}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-all
              ${formData.isFundraising ? 'bg-emerald-500' : 'bg-neutral-700'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
                ${formData.isFundraising ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {formData.isFundraising && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
            {/* Fundraising Goal */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-neutral-200">
                Fundraising Goal (USD)
              </label>
              
              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2">
                {FUNDRAISING_GOAL_OPTIONS.map((amount) => {
                  const value = String(amount);
                  const active = formData.fundraisingGoal === value;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => updateFormData({ fundraisingGoal: value })}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                        ${active
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600'
                        }
                      `}
                    >
                      {formatCurrency(amount)}
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Amount Input */}
              <FormInput
                label="Or enter custom amount"
                type="number"
                value={formData.fundraisingGoal}
                onChange={(value) => updateFormData({ fundraisingGoal: value })}
                placeholder="e.g., 3500"
                helpText="Typical range for early-stage: $500–$25,000"
                min={0}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Raised So Far & Min Check */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Raised So Far (USD)"
                type="number"
                value={formData.fundraisingRaisedSoFar}
                onChange={(value) => updateFormData({ fundraisingRaisedSoFar: value })}
                placeholder="e.g., 1000"
                helpText="Include commitments and grants"
                min={0}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <FormInput
                label="Minimum Check Size (USD)"
                type="number"
                value={formData.fundraisingMinCheckSize}
                onChange={(value) => updateFormData({ fundraisingMinCheckSize: value })}
                placeholder="e.g., 500"
                helpText="Helps angels know if they fit"
                min={0}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            </div>

            {/* Fundraising Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-700/40 bg-emerald-950/20">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-emerald-300 font-medium mb-1">Fundraising Visibility</p>
                <p className="text-emerald-200/80">
                  Your fundraising details will be prominently displayed on your idea page with a progress bar and funding goal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}