import { TrashIcon } from "@/components/icons/TrashIcon";
import { SignoutIcon } from "@/components/icons/SignOutIcon";
import SectionCard from "../shared/SectionCard";

type AccountSectionProps = {
  onDeleteClick: () => void;
  onSignOut: () => void;
};

export default function AccountSection({
  onDeleteClick,
  onSignOut,
}: AccountSectionProps) {
  return (
    <SectionCard
      title="Account"
      description="Manage your account access"
      className="mt-6"
    >
      <div className="flex flex-col gap-3">
        <button
          onClick={onSignOut}
          className="w-full py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <SignoutIcon className="w-4 h-4" /> Sign Out
        </button>

        <button
          onClick={onDeleteClick}
          className="w-full py-2.5 px-4 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 text-red-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <TrashIcon className="w-4 h-4" /> Delete Account
        </button>
      </div>
    </SectionCard>
  );
}