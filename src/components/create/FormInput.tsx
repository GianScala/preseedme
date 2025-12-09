// src/components/create/FormInput.tsx
interface FormInputProps {
    label: string;
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
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-neutral-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
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
              w-full rounded-xl px-4 py-2.5 bg-neutral-900 border-2 border-neutral-800 
              text-sm text-neutral-100 placeholder:text-neutral-500
              focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none 
              transition-all
              ${icon ? 'pl-10' : ''}
            `}
          />
        </div>
  
        {(helpText || showCounter) && (
          <div className="flex justify-between items-start gap-2 text-xs">
            <p className="text-neutral-500 flex-1">{helpText}</p>
            {showCounter && maxLength && (
              <span className={`font-medium flex-shrink-0 ${
                value.length > maxLength * 0.9 ? 'text-yellow-400' : 'text-neutral-500'
              }`}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }