import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SidebarFundraising({ idea }: { idea: any }) {
  const progress = Math.min(100, Math.round(((idea.fundraisingRaisedSoFar || 0) / (idea.fundraisingGoal || 1)) * 100));

  return (
    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black text-emerald-400 uppercase tracking-widest">
        <span>Fundraising</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-neutral-500">
        <span>{formatCurrency(idea.fundraisingRaisedSoFar || 0)}</span>
        <span className="text-white">Goal: {formatCurrency(idea.fundraisingGoal || 0)}</span>
      </div>
    </div>
  );
}