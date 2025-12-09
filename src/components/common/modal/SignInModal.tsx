// src/components/common/modal/SignInModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { X, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // <--- La chiave magica

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // 1. Aspettiamo che il componente sia montato nel browser (necessario per document.body)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Blocchiamo lo scroll quando il modale è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Se non è aperto o non siamo ancora nel browser, non renderizzare nulla
  if (!isOpen || !mounted) return null;

  const handleSignIn = () => {
    onClose();
    router.push("/auth");
  };

  // 3. Creiamo il contenuto del modale
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop scuro */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card del Modale */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-sm overflow-hidden rounded-2xl 
          border border-white/10 bg-neutral-900/95 backdrop-blur-xl 
          p-6 shadow-2xl shadow-black/80 
          animate-in zoom-in-95 duration-200
        "
      >
        {/* Tasto Chiudi */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icona */}
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/10 mx-auto">
          <LogIn className="h-6 w-6 text-[var(--brand)]" />
        </div>

        {/* Testo */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-white">
            Sign in required
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            Join our community to like ideas, track projects, and connect with founders.
          </p>
        </div>

        {/* Bottoni */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/5 py-3 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // 4. PORTAL: Iniettiamo il modale direttamente nel <body>
  // Questo risolve tutti i problemi di z-index e posizionamento.
  return createPortal(modalContent, document.body);
}