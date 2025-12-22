// src/components/create/FormTextarea.tsx
import React from "react";

interface FormTextareaProps {
  label: string | React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  helpText?: string;
  icon?: React.ReactNode;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  helpText,
  icon,
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
        {icon && <span className="text-neutral-400">{icon}</span>}
        {typeof label === "string" ? (
          <>
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </>
        ) : (
          label
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full rounded-xl px-4 py-3 bg-neutral-900/40 border border-neutral-800
          text-[16px] text-neutral-100 placeholder:text-neutral-500
          focus:border-brand focus:ring-1 focus:ring-brand/10 outline-none
          transition-all resize-y min-h-[100px] max-h-[300px]
        "
      />
      {helpText && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}