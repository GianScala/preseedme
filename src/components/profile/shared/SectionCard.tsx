import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`bg-neutral-900/30 p-4 md:p-5 rounded-2xl border border-neutral-800 space-y-4 ${className}`}
    >
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}