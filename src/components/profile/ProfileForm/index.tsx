import { FormEvent, ChangeEvent } from "react";
import { ProfileFormData, ProfileTab, StatusState } from "@/app/profile/utils/types";
import BasicInfoTab from "./BasicInfoTab";
import ContactTab from "./ContactTab";
import LinksTab from "./LinksTab";
import SaveButton from "./SaveButton";

type ProfileFormProps = {
  formData: ProfileFormData;
  photoPreview: string;
  profileTab: ProfileTab;
  setProfileTab: (tab: ProfileTab) => void;
  onChange: (field: keyof ProfileFormData, value: string) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  saving: boolean;
  hasChanges: boolean;
  status: StatusState;
};

export default function ProfileForm({
  formData,
  photoPreview,
  profileTab,
  setProfileTab,
  onChange,
  onFileSelect,
  onSubmit,
  saving,
  hasChanges,
  status,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
      {/* Profile sub-tabs */}
      <div className="flex p-1 bg-neutral-900/20 rounded-full border border-neutral-800 text-xs font-medium max-w-md">
        {(["basic", "contact", "links"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setProfileTab(tab)}
            className={`flex-1 py-1.5 rounded-full capitalize transition-all ${
              profileTab === tab
                ? "bg-brand/50 text-white shadow-sm"
                : "text-neutral-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {profileTab === "basic" && (
        <BasicInfoTab
          formData={formData}
          photoPreview={photoPreview}
          onChange={onChange}
          onFileSelect={onFileSelect}
        />
      )}

      {profileTab === "contact" && (
        <ContactTab formData={formData} onChange={onChange} />
      )}

      {profileTab === "links" && (
        <LinksTab formData={formData} onChange={onChange} />
      )}

      {/* Status Message */}
      {status && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
            status.type === "error"
              ? "bg-red-950/50 text-red-300 border border-red-900"
              : "bg-green-950/50 text-green-300 border border-green-900"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Save Button */}
      <SaveButton saving={saving} hasChanges={hasChanges} />
    </form>
  );
}