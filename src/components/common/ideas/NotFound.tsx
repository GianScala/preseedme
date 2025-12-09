// src/components/common/NotFound.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-neutral-100 mb-2">
        Idea Not Found
      </h2>
      <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto">
        This idea may have been deleted or doesn't exist. Let's get you back to exploring other ideas.
      </p>
      
      <Link
        href="/ideas"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Ideas
      </Link>
    </div>
  );
}