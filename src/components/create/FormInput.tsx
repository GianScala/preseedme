// src/components/create/FormInput.tsx
import React from "react";

interface FormInputProps {
  label: string | React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "url" | "email";
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  helpText?: string;
  showCounter?: boolean;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  maxLength,
  min,
  max,
  helpText,
  showCounter = false,
  icon,
}: FormInputProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="block text-xs sm:text-sm font-semibold text-neutral-200">
        {typeof label === "string" ? (
          <>
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </>
        ) : (
          label
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-200">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          className={`
            w-full rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 bg-neutral-900/40 border border-neutral-800
            text-[16px] text-neutral-100 placeholder:text-neutral-500
            focus:border-brand focus:ring-1 focus:ring-brand/10 outline-none
            transition-all
            ${icon ? "pl-9 sm:pl-10" : ""}
          `}
        />
      </div>

      {(helpText || showCounter) && (
        <div className="flex justify-between items-start gap-2 text-[11px] sm:text-xs">
          <p className="text-neutral-500 flex-1">{helpText}</p>
          {showCounter && maxLength && (
            <span
              className={`font-medium flex-shrink-0 ${
                value.length > maxLength * 0.9
                  ? "text-yellow-400"
                  : "text-neutral-500"
              }`}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}