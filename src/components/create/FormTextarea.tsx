// src/components/create/FormTextarea.tsx
interface FormTextareaProps {
    label: string;
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
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="
            w-full rounded-xl px-4 py-3 bg-neutral-900 border-2 border-neutral-800 
            text-sm text-neutral-100 placeholder:text-neutral-500
            focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none 
            transition-all resize-y min-h-[100px]
          "
        />
  
        {helpText && (
          <p className="text-xs text-neutral-500">{helpText}</p>
        )}
      </div>
    );
  }