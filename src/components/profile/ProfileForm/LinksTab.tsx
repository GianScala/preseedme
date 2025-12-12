import { Globe, Linkedin, Github } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import SectionCard from "../shared/SectionCard";
import IconInput from "../shared/IconInput";
import { ProfileFormData } from "@/app/profile/utils/types";

type LinksTabProps = {
  formData: ProfileFormData;
  onChange: (field: keyof ProfileFormData, value: string) => void;
};

export default function LinksTab({ formData, onChange }: LinksTabProps) {
  return (
    <SectionCard
      title="Socials"
      description="Share where people can find you"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <IconInput
          icon={XIcon}
          value={formData.xUrl || ""}
          onChange={(v) => onChange("xUrl", v)}
          placeholder="GmScala or x.com/GmScala"
        />
        <IconInput
          icon={Linkedin}
          value={formData.linkedinUrl || ""}
          onChange={(v) => onChange("linkedinUrl", v)}
          placeholder="yourname or linkedin.com/in/yourname"
        />
        <IconInput
          icon={Github}
          value={formData.githubUrl || ""}
          onChange={(v) => onChange("githubUrl", v)}
          placeholder="yourname or github.com/yourname"
        />
        <IconInput
          icon={Globe}
          value={formData.websiteUrl || ""}
          onChange={(v) => onChange("websiteUrl", v)}
          placeholder="yourstartup.com"
        />
      </div>
    </SectionCard>
  );
}