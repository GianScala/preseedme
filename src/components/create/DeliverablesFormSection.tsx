// src/components/create/DeliverablesFormSection.tsx
"use client";

import { useState, useCallback } from "react";
import { IdeaFormData } from "@/hooks/useNewIdeaForm";
import SectionWrapper from "./SectionWrapper";
import FormTextarea from "./FormTextarea";
import { Target, Plus, X, Check } from "lucide-react";

// --- Types ---
interface Deliverable {
  id: string;
  text: string;
  progress: number;
  createdAt: number;
}

interface DeliverablesFormSectionProps {
  formData: IdeaFormData;
  updateFormData: (updates: Partial<IdeaFormData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  showEmptyWarning?: boolean;
}

// --- Sub-Component: Individual Deliverable Item ---
const DeliverableItem = ({
  item,
  onUpdate,
  onRemove,
}: {
  item: Deliverable;
  onUpdate: (updates: Partial<Deliverable>) => void;
  onRemove: () => void;
}) => {
  const isComplete = item.progress === 100;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-lg">
      <div className="px-3 py-1 sm:p-4 space-y-4">
        
        {/* Row 1: Text Input & Delete */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-neutral-600 focus:outline-none border-b border-transparent focus:border-brand/50 transition-colors pb-1"
              placeholder="Describe this milestone..."
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 -mr-2 -mt-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            title="Remove milestone"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Progress Controls */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-mono font-bold ${
                isComplete ? "text-green-400" : "text-brand"
              }`}
            >
              {item.progress}%
            </span>
          </div>

          {/* Custom Range Slider */}
          <div className="relative h-4 flex items-center">
            {/* Visual Track Background */}
            <div className="absolute inset-0 h-1 my-auto bg-neutral-800 rounded-full overflow-hidden pointer-events-none">
              <div
                className={`h-full transition-all duration-200 ease-out ${
                  isComplete
                    ? "bg-gradient-to-r from-green-600 to-green-400"
                    : "bg-gradient-to-r from-brand-dark to-brand"
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>

            {/* Actual Range Input (Invisible but interactive) */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={item.progress}
              onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Progress slider"
            />
            
            {/* Visual Thumb (Follows the value) */}
            <div 
              className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-neutral-900 pointer-events-none transition-all duration-200 ease-out"
              style={{ left: `calc(${item.progress}% - 10px)` }} 
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onUpdate({ progress: val })}
                className={`flex-1 min-w-[3rem] py-1.5 text-[10px] sm:text-xs font-medium rounded-md border transition-all ${
                  item.progress === val
                    ? isComplete && val === 100 
                      ? "bg-green-500/20 border-green-500/50 text-green-400" 
                      : "bg-brand/20 border-brand/50 text-brand-light"
                    : "bg-neutral-800/50 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
              >
                {val === 100 ? (
                  <div className="flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </div>
                ) : (
                  `${val}%`
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Decorative Left Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
        isComplete ? 'bg-green-500' : 'bg-transparent group-hover:bg-brand/50'
      }`} />
    </div>
  );
};

// --- Main Component ---
export default function DeliverablesFormSection({
  formData,
  updateFormData,
  isOpen,
  onToggle,
  showEmptyWarning = false,
}: DeliverablesFormSectionProps) {
  const [newDeliverableText, setNewDeliverableText] = useState("");
  
  const deliverables = (formData.deliverables || []) as Deliverable[];
  
  const isComplete = !!(
    formData.deliverablesOverview?.trim() && 
    deliverables.length > 0
  );

  const addDeliverable = useCallback(() => {
    if (!newDeliverableText.trim()) return;
    
    const newDeliverable: Deliverable = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newDeliverableText.trim(),
      progress: 0,
      createdAt: Date.now(),
    };
    
    updateFormData({
      deliverables: [...deliverables, newDeliverable],
    });
    setNewDeliverableText("");
  }, [deliverables, newDeliverableText, updateFormData]);

  const updateDeliverable = useCallback((id: string, updates: Partial<Deliverable>) => {
    updateFormData({
      deliverables: deliverables.map(d => 
        d.id === id ? { ...d, ...updates } : d
      ),
    });
  }, [deliverables, updateFormData]);

  const removeDeliverable = useCallback((id: string) => {
    updateFormData({
      deliverables: deliverables.filter(d => d.id !== id),
    });
  }, [deliverables, updateFormData]);

  return (
    <SectionWrapper
      number={7}
      title="Deliverables & Milestones"
      description="Define the key outcomes you will execute."
      isOpen={isOpen}
      onToggle={onToggle}
      isComplete={isComplete}
      showEmptyWarning={showEmptyWarning}
      icon={<Target className="w-5 h-5" strokeWidth={1.5} />}
    >
      <div className="space-y-6 sm:space-y-8">
        
        {/* Overview Textarea  */}
        <div className="space-y-3">
           <FormTextarea
            label="Execution Overview"
            value={formData.deliverablesOverview}
            onChange={(value) => updateFormData({ deliverablesOverview: value })}
            placeholder="What key objectives will this funding achieve? (e.g., Launch mobile app v1, acquire first 1k users, secure 3 enterprise pilots...)"
            rows={3}
            helpText="Connect your ask to concrete, shippable outcomes."
          />
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Deliverables List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-neutral-200">
              Key Milestones ({deliverables.length})
            </label>
            {deliverables.length > 0 && (
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                {Math.round(deliverables.reduce((acc, curr) => acc + curr.progress, 0) / deliverables.length)}% Avg Progress
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <DeliverableItem
                key={deliverable.id}
                item={deliverable}
                onUpdate={(updates) => updateDeliverable(deliverable.id, updates)}
                onRemove={() => removeDeliverable(deliverable.id)}
              />
            ))}
          </div>

          {/* Add New Input */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newDeliverableText}
                  onChange={(e) => setNewDeliverableText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDeliverable();
                    }
                  }}
                  placeholder="E.g., Complete backend migration..."
                  className="w-full pl-4 pr-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm"
                />
              </div>
              
              <button
                type="button"
                onClick={addDeliverable}
                disabled={!newDeliverableText.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/10 hover:shadow-brand/20 active:scale-95"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add Milestone</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500 px-1">
              Break your plan into 2-5 verifiable milestones.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}