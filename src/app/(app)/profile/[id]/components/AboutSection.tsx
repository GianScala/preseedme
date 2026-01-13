import RestrictedSection from "./RestrictedSection";

type AboutSectionProps = {
  bio: string;
  isAuthenticated: boolean;
  onAuthTrigger: () => void;
};

export default function AboutSection({
  bio,
  isAuthenticated,
  onAuthTrigger,
}: AboutSectionProps) {
  return (
    <RestrictedSection
      className="rounded-xl border border-neutral-800 bg-neutral-900/30"
      isAuthenticated={isAuthenticated}
      onAuthTrigger={onAuthTrigger}
    >
      <section className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white mb-2">About</h3>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {bio}
        </p>
      </section>
    </RestrictedSection>
  );
}