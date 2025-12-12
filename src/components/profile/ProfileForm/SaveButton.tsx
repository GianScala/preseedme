import { Save, Loader2 } from "lucide-react";

type SaveButtonProps = {
  saving: boolean;
  hasChanges: boolean;
};

export default function SaveButton({ saving, hasChanges }: SaveButtonProps) {
  return (
    <div className="sticky bottom-4 z-10 pt-2 bg-gradient-to-t from-neutral-950/80 via-neutral-950/60 to-transparent">
      <button
        type="submit"
        disabled={saving || !hasChanges}
        className="w-full shadow-lg shadow-brand/10 bg-brand text-black font-bold py-2 rounded-lg hover:bg-brand-light transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {saving ? "Saving Changes..." : "Save Profile"}
      </button>
    </div>
  );
}