import { useRef, ChangeEvent } from "react";
import { CameraIcon } from "@/components/icons/CameraIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import SectionCard from "../shared/SectionCard";
import IconInput from "../shared/IconInput";
import { ProfileFormData } from "@/app/(app)/profile/utils/types";

type BasicInfoTabProps = {
  formData: ProfileFormData;
  photoPreview: string;
  onChange: (field: keyof ProfileFormData, value: string) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function BasicInfoTab({
  formData,
  photoPreview,
  onChange,
  onFileSelect,
}: BasicInfoTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <SectionCard>
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="relative group">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-neutral-700 group-hover:border-brand transition-colors"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold border-2 border-neutral-700">
              {formData.username?.[0]?.toUpperCase() || <ProfileIcon />}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-neutral-800 rounded-full border border-neutral-600 hover:bg-brand hover:text-black transition-colors shadow-lg"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            className="hidden"
            accept="image/*"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <p className="text-sm text-neutral-400">
            Update how others see you
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <IconInput
          label="Display Name"
          icon={ProfileIcon}
          value={formData.username || ""}
          onChange={(v) => onChange("username", v)}
          placeholder="Your name"
        />

        <IconInput
          label="Handle"
          prefix="@"
          value={formData.handle || ""}
          onChange={() => {}}
          readOnly
        />
      </div>

      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium text-neutral-300">Bio</label>
        <textarea
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 text-base md:text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all min-h-[90px] max-h-[200px] resize-y"
          placeholder="Tell us about yourself..."
        />
        <div className="flex justify-end">
          <span className="text-xs text-neutral-500">
            {(formData.bio || "").length}/500
          </span>
        </div>
      </div>
    </SectionCard>
  );
}