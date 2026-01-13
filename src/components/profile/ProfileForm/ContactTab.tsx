import { Phone, MapPin } from "lucide-react";
import { MailIcon } from "@/components/icons/MailIcon";
import SectionCard from "../shared/SectionCard";
import IconInput from "../shared/IconInput";
import { ProfileFormData } from "@/app/(app)/profile/utils/types";

type ContactTabProps = {
  formData: ProfileFormData;
  onChange: (field: keyof ProfileFormData, value: string) => void;
};

export default function ContactTab({ formData, onChange }: ContactTabProps) {
  return (
    <SectionCard title="Contact Info">
      <div className="grid gap-4 md:grid-cols-2">
        <IconInput
          label="Email"
          icon={MailIcon}
          value={formData.email || ""}
          onChange={(v) => onChange("email", v)}
          placeholder="you@example.com"
        />
        <IconInput
          label="Phone"
          icon={Phone}
          value={formData.preferredPhoneNumber || ""}
          onChange={(v) => onChange("preferredPhoneNumber", v)}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <details className="mt-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
        <summary className="cursor-pointer py-2 px-3 text-xs uppercase tracking-wide text-neutral-400 select-none">
         More
        </summary>
        <div className="p-3 pt-1">
          <IconInput
            label="Address"
            icon={MapPin}
            value={formData.address || ""}
            onChange={(v) => onChange("address", v)}
            placeholder="Full business address"
          />
        </div>
      </details>
    </SectionCard>
  );
}