import { ComponentType, ReactNode } from "react";

type IconInputProps = {
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  prefix?: ReactNode;
};

export default function IconInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  prefix,
}: IconInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <div
        className={`relative ${
          readOnly ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {Icon && (
          <Icon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
        )}
        {prefix && !Icon && (
          <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value || ""}
          readOnly={readOnly}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          className={`w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 ${
            Icon || prefix ? "pl-10" : "pl-3"
          } pr-4 text-base md:text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}