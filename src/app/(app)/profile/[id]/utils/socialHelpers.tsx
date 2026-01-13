import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export const normalizeUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const SocialLink = ({
  href,
  icon: Icon,
}: {
  href: string;
  icon: IconComponent;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="p-1.5 bg-neutral-800/80 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
  >
    <Icon className="w-3.5 h-3.5" />
  </a>
);

export const ContactItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: IconComponent;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
    <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 mt-0.5">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs text-neutral-200 font-medium break-words leading-relaxed">
        {value}
      </p>
    </div>
  </div>
);

export const getSocialIcon = (platform: string) => {
  switch (platform) {
    case "x":
      return XIcon;
    case "linkedin":
      return Linkedin;
    case "github":
      return Github;
    case "website":
      return Globe;
    default:
      return Globe;
  }
};