// src/components/create/BusinessSnapshotSection.tsx
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";
import TagSelector from "./TagSelector";

const REVENUE_MODEL_OPTIONS = [
  "Subscription",
  "One-time payment",
  "Freemium",
  "Commission",
  "Usage-based",
  "Advertising",
  "Marketplace fees",
  "Tiered pricing",
  "Transaction fees",
  "Hybrid model",
];

const TARGET_MARKET_OPTIONS = [
  "B2C",
  "B2B",
  "Consumers",
  "SMBs",
  "Local businesses",
  "Enterprise",
  "Developers",
  "Education",
  "Non-profits",
  "Creators",
  "Students",
];

interface BusinessSnapshotSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function BusinessSnapshotSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: BusinessSnapshotSectionProps) {
  // Smart helper to show relevant fields based on data
  const hasRevenue =
    (formData.totalRevenueSinceInception &&
      Number(formData.totalRevenueSinceInception) > 0) ||
    (formData.monthlyRecurringRevenue && Number(formData.monthlyRecurringRevenue) > 0);

  return (
    <SectionWrapper
      number={4}
      title="Business Snapshot"
      description="Quick metrics that matter"
      isOpen={isOpen}
      onToggle={onToggle}
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
      isComplete={false}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-5">
        {/* Stage & Timeline */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Founded"
            type="number"
            value={formData.foundedYear}
            onChange={(value) => updateFormData({ foundedYear: value })}
            placeholder="2024"
            helpText="Year started"
            min={1990}
            max={new Date().getFullYear()}
          />

          <FormInput
            label="Users"
            type="number"
            value={formData.userCount}
            onChange={(value) => updateFormData({ userCount: value })}
            placeholder="0"
            helpText="Total users/customers"
            min={0}
            icon={
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Revenue Metrics - Conditional Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-300">
              Revenue{" "}
              <span className="text-neutral-500 font-normal">(optional)</span>
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label={hasRevenue ? "Total Revenue" : "Revenue to Date"}
              type="number"
              value={formData.totalRevenueSinceInception}
              onChange={(value) =>
                updateFormData({ totalRevenueSinceInception: value })
              }
              placeholder="0"
              helpText="All-time USD"
              min={0}
              icon={
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />

            <FormInput
              label="MRR"
              type="number"
              value={formData.monthlyRecurringRevenue}
              onChange={(value) =>
                updateFormData({ monthlyRecurringRevenue: value })
              }
              placeholder="0"
              helpText="Monthly recurring"
              min={0}
              icon={
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800/50" />

        {/* Business Model */}
        <TagSelector
          label="Target Market"
          options={TARGET_MARKET_OPTIONS}
          selected={Array.isArray(formData.targetMarket) ? formData.targetMarket : []}
          onChange={(targetMarket) => updateFormData({ targetMarket })}
          helpText="Primary audience"
          colorScheme="blue"
        />

        <TagSelector
          label="Revenue Model"
          options={REVENUE_MODEL_OPTIONS}
          selected={formData.revenueModels || []}
          onChange={(revenueModels) => updateFormData({ revenueModels })}
          helpText="How you monetize"
          colorScheme="green"
        />

        {/* Smart Tip - Context Aware */}
        {!hasRevenue && (
          <div className="flex gap-3 p-3.5 rounded-lg border border-blue-900/30 bg-blue-950/20">
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
            <p className="text-sm text-blue-200/90">
              Pre-revenue? No problem. Focus on user count, growth rate, or
              engagement metrics instead.
            </p>
          </div>
        )}

        {hasRevenue && (
          <div className="flex gap-3 p-3.5 rounded-lg border border-green-900/30 bg-green-950/20">
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-green-200/90">
              Revenue traction helps! Consider adding growth rate or unit
              economics if available.
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}