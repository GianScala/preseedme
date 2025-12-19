import { Calendar, Clock, ExternalLink } from "lucide-react";
import { ensureProtocol } from "@/lib/utils";

const getMillis = (ts: any) => ts?.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : null);

export default function IdeaThumbnail({ idea }: { idea: any }) {
  const createdMs = getMillis(idea.createdAt);
  const updatedMs = getMillis(idea.updatedAt);
  
  const formatDate = (ms: number | null) => 
    ms ? new Date(ms).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) : "—";

  const wasUpdated = updatedMs && createdMs && (updatedMs > createdMs + 1000);

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 shadow-lg">
      <img 
        src={idea.thumbnailUrl || "/placeholder-bg.jpg"} 
        alt="" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
      
      {/* Top Left: Website */}
      {idea.websiteUrl && (
        <a href={ensureProtocol(idea.websiteUrl)} target="_blank" className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white hover:bg-brand transition-all">
          <ExternalLink size={12} /> Website
        </a>
      )}

      {/* Bottom: Date Badges */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-10">
        {/* Created At */}
        <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-full backdrop-blur-md border border-white/10 bg-black/60 text-[10px] font-bold text-neutral-300">
          <Calendar className="w-3 h-3" />
          <span className="uppercase tracking-tight">{formatDate(createdMs)}</span>
        </div>

        {/* Updated At (Optional) */}
        {wasUpdated && (
          <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-full backdrop-blur-md border border-emerald-500/30 bg-black/60 text-[10px] font-bold text-emerald-400">
            <Clock className="w-3 h-3" />
            <span className="uppercase tracking-tight">Upd. {formatDate(updatedMs)}</span>
          </div>
        )}
      </div>
    </div>
  );
}