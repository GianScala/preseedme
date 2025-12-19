// src/components/common/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center py-56">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-1 border-neutral-800" />
            <div className="absolute inset-0 w-8 h-8 rounded-full border-1 border-brand border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-neutral-400 font-medium">Loading idea...</span>
        </div>
      </div>
    );
  }