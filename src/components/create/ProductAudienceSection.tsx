// src/components/create/ProductAudienceSection.tsx
import { IdeaFormData } from "@/app/ideas/new/page";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";
import TagSelector from "./TagSelector";

const SECTOR_OPTIONS = [
    "AI/ML",
    "SaaS",
    "Fintech",
    "HealthTech",
    "Climate Tech",
    "Cybersecurity",
    "DevTools",
    "E-commerce",
    "Marketplace",
    "EdTech",
    "B2B",
    "B2C",
    "Others",
  ];
  
  const TARGET_AUDIENCE_OPTIONS = [
    "Developers",
    "SMBs (Small & Medium Business)",
    "Enterprises",
    "Startups",
    "Solo founders/Indie hackers",
    "Creators/Influencers",
    "Healthcare providers",
    "Financial institutions",
    "Consumers",
    "Others",
  ];
  
  const TARGET_DEMOGRAPHIC_OPTIONS = [
    "US",
    "Canada",
    "Europe",
    "UK",
    "Asia-Pacific",
    "India",
    "Global",
    "Latin America",
    "Middle East",
  ];

interface ProductAudienceSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function ProductAudienceSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: ProductAudienceSectionProps) {
  return (
    <SectionWrapper
      number={2}
      title="Product & Audience"
      description="Who you're building for and what sector you're in"
      isOpen={isOpen}
      onToggle={onToggle}
      icon={
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
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
      isComplete={!!(formData.sectors.length || formData.targetAudiences.length)}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Website / Landing Page */}
        <FormInput
          label="Website / Landing Page"
          value={formData.websiteUrl}
          onChange={(value) => updateFormData({ websiteUrl: value })}
          placeholder="https://yourstartup.com"
          helpText="Link to your product, waitlist, or landing page (optional)"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          }
        />

        {/* Sectors + Target Audience (responsive grid) */}
        <div className="grid gap-5 md:grid-cols-2">
          <TagSelector
            label="Sectors"
            options={SECTOR_OPTIONS}
            selected={formData.sectors}
            onChange={(sectors) => updateFormData({ sectors })}
            helpText="Choose one or more. Helps investors find relevant ideas."
            colorScheme="brand"
          />

          <TagSelector
            label="Target Audience"
            options={TARGET_AUDIENCE_OPTIONS}
            selected={formData.targetAudiences}
            onChange={(targetAudiences) =>
              updateFormData({ targetAudiences })
            }
            helpText="Who are you building this for?"
            colorScheme="purple"
          />
        </div>

        {/* Geographic Focus full-width */}
        <TagSelector
          label="Geographic Focus"
          options={TARGET_DEMOGRAPHIC_OPTIONS}
          selected={formData.targetDemographics}
          onChange={(targetDemographics) =>
            updateFormData({ targetDemographics })
          }
          helpText="Optional, but helpful if you're targeting specific regions"
          colorScheme="blue"
        />
      </div>
    </SectionWrapper>
  );
}
