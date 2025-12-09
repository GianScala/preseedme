// src/components/create/TagSelector.tsx
interface TagSelectorProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    helpText?: string;
    colorScheme?: 'brand' | 'purple' | 'blue' | 'green';
    maxSelections?: number;
  }
  
  export default function TagSelector({
    label,
    options,
    selected = [], // Default to empty array
    onChange,
    helpText,
    colorScheme = 'brand',
    maxSelections,
  }: TagSelectorProps) {
    // Ensure selected is always an array
    const selectedArray = Array.isArray(selected) ? selected : [];
  
    const toggleOption = (option: string) => {
      if (selectedArray.includes(option)) {
        // Remove option
        onChange(selectedArray.filter((s) => s !== option));
      } else {
        // Add option (check max limit)
        if (maxSelections && selectedArray.length >= maxSelections) {
          return; // Don't add if max reached
        }
        onChange([...selectedArray, option]);
      }
    };
  
    const colorStyles = {
      brand: {
        active: 'bg-brand/10 border-brand text-brand ring-brand/20',
        inactive:
          'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300',
      },
      purple: {
        active: 'bg-purple-500/10 border-purple-500 text-purple-400 ring-purple-500/20',
        inactive:
          'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300',
      },
      blue: {
        active: 'bg-blue-500/10 border-blue-500 text-blue-400 ring-blue-500/20',
        inactive:
          'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300',
      },
      green: {
        active: 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-emerald-500/20',
        inactive:
          'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300',
      },
    };
  
    const colors = colorStyles[colorScheme];
    const isMaxReached = maxSelections && selectedArray.length >= maxSelections;
  
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-neutral-200">
            {label}
          </label>
          {maxSelections && (
            <span className="text-xs text-neutral-500">
              {selectedArray.length}/{maxSelections}
            </span>
          )}
        </div>
  
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = selectedArray.includes(option);
            const isDisabled = !isActive && isMaxReached;
  
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                disabled={isDisabled}
                className={`
                  px-3.5 py-2 rounded-lg text-sm font-medium border transition-all
                  focus:outline-none focus:ring-2
                  ${isActive ? colors.active : colors.inactive}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  active:scale-95
                `}
              >
                {isActive && (
                  <span className="inline-block mr-1.5 text-current">✓</span>
                )}
                {option}
              </button>
            );
          })}
        </div>
  
        {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
  
        {isMaxReached && (
          <p className="text-xs text-amber-500/80">
            Maximum {maxSelections} selection{maxSelections > 1 ? 's' : ''}{' '}
            reached
          </p>
        )}
      </div>
    );
  }