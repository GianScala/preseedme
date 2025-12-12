// src/components/create/DemoVisualsSection.tsx
import { ChangeEvent } from "react";
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormInput from "./FormInput";

interface DemoVisualsSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

export default function DemoVisualsSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: DemoVisualsSectionProps) {
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      // If no file selected, keep the preview as is (might be existing URL)
      updateFormData({ thumbnailFile: null });
      return;
    }

    // Clean up old blob URL if it exists
    if (formData.thumbnailPreview && formData.thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.thumbnailPreview);
    }

    const url = URL.createObjectURL(file);
    updateFormData({ thumbnailFile: file, thumbnailPreview: url });
  };

  const handleRemoveThumbnail = () => {
    if (formData.thumbnailPreview && formData.thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.thumbnailPreview);
    }
    updateFormData({ thumbnailFile: null, thumbnailPreview: null });
  };

  return (
    <SectionWrapper
      number={3}
      title="Demo & Visuals"
      description="Show, don't just tell—add media to make your idea shine"
      isOpen={isOpen}
      onToggle={onToggle}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      }
      isComplete={!!(formData.demoVideoUrl || formData.thumbnailFile)}
      showEmptyWarning={showEmptyWarning}
    >
      <div className="space-y-6">
        <FormInput
          label="Demo Video URL"
          value={formData.demoVideoUrl}
          onChange={(value) => updateFormData({ demoVideoUrl: value })}
          placeholder="Loom, YouTube, or any video link"
          helpText="A quick walkthrough helps people understand your product instantly"
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          }
        />

        {/* Thumbnail Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-neutral-200">
            Thumbnail Image
          </label>
          
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <label className="cursor-pointer group">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950 group-hover:border-brand group-hover:bg-neutral-900 transition-all">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 group-hover:bg-brand/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {formData.thumbnailFile ? "Change Image" : "Upload Image"}
                  </p>
                  <p className="text-xs text-neutral-500">JPG, PNG • 16:9 ratio</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
              />
            </label>

            {formData.thumbnailPreview && (
              <div className="relative group">
                <div className="w-40 h-24 rounded-xl overflow-hidden border-2 border-neutral-800 bg-neutral-900 shadow-lg">
                  <img
                    src={formData.thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-neutral-500 flex items-start gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            A compelling image makes your idea 3x more clickable in feeds
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}