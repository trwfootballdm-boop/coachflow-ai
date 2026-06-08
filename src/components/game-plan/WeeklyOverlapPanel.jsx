import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, BarChart2 } from "lucide-react";

export default function WeeklyOverlapPanel({ callSheetItems, scriptItems }) {
  const playIdsOnCallSheet = new Set(callSheetItems.map(i => i.play_id).filter(Boolean));
  const playIdsPracticed = new Set(scriptItems.map(i => i.play_id).filter(Boolean));

  const total = playIdsOnCallSheet.size;
  const practiced = [...playIdsOnCallSheet].filter(id => playIdsPracticed.has(id)).length;
  const unpracticed = total - practiced;
  const pct = total > 0 ? Math.round((practiced / total) * 100) : 0;

  const statClass = "flex flex-col gap-0.5";

  return (
    <div className="border border-border rounded-lg p-3 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-display font-bold">Weekly Prep Overlap</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={statClass}>
          <span className="text-base font-display font-bold">{total}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">On Sheet</span>
        </div>
        <div className={statClass}>
          <span className="text-base font-display font-bold text-emerald-600 dark:text-emerald-400">{practiced}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Practiced</span>
        </div>
        <div className={statClass}>
          <span className={cn("text-base font-display font-bold", unpracticed > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{unpracticed}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Not Prepped</span>
        </div>
      </div>

      <div className={cn("flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded-md justify-center",
        pct >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
        pct >= 50 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
        "bg-red-500/10 text-red-700 dark:text-red-400"
      )}>
        {pct >= 80 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {pct}% of call sheet practiced
      </div>
    </div>
  );
}