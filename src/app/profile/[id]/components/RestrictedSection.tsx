import { ReactNode } from "react";
import { Lock } from "lucide-react";

type RestrictedSectionProps = {
  children: ReactNode;
  className?: string;
  hideOverlay?: boolean;
  isAuthenticated: boolean;
  onAuthTrigger: () => void;
};

export default function RestrictedSection({
  children,
  className = "",
  hideOverlay = false,
  isAuthenticated,
  onAuthTrigger,
}: RestrictedSectionProps) {
  if (isAuthenticated) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      onClick={onAuthTrigger}
      className={`relative group cursor-pointer overflow-hidden rounded-xl ${className}`}
    >
      <div
        className={`blur-md select-none pointer-events-none grayscale transition-all duration-500 ${
          hideOverlay ? "opacity-40" : "opacity-60"
        }`}
      >
        {children}
      </div>

      {!hideOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl transform transition-transform group-hover:scale-105">
            <Lock className="w-3 h-3 text-brand" />
            <span className="text-[10px] font-bold text-white tracking-wide">
              Login to view
            </span>
          </div>
        </div>
      )}
    </div>
  );
}