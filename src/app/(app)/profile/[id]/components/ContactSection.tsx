import { Mail, Phone, MapPin } from "lucide-react";
import { ContactItem } from "../utils/socialHelpers";
import RestrictedSection from "./RestrictedSection";

type ContactSectionProps = {
  email?: string;
  phone?: string;
  address?: string;
  isAuthenticated: boolean;
  onAuthTrigger: () => void;
};

export default function ContactSection({
  email,
  phone,
  address,
  isAuthenticated,
  onAuthTrigger,
}: ContactSectionProps) {
  if (!email && !phone && !address) return null;

  return (
    <RestrictedSection
      className="rounded-xl border border-neutral-800 bg-neutral-900/30"
      isAuthenticated={isAuthenticated}
      onAuthTrigger={onAuthTrigger}
    >
      <section className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white mb-3">
          Contact Details
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {email && <ContactItem icon={Mail} label="Email" value={email} />}
          {phone && <ContactItem icon={Phone} label="Phone" value={phone} />}
          {address && (
            <ContactItem icon={MapPin} label="Office" value={address} />
          )}
        </div>
      </section>
    </RestrictedSection>
  );
}