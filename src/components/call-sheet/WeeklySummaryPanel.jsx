import React from 'react';
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeeklySummaryPanel({ stats, items, playMap, practicedMap, onClose }) {
  const unpracticedItems = items.filter(i => !practicedMap[i.play_id] || practicedMap[i.play_id].length === 0);

  return (
    <div className="w-64 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-display font-bold text-sm">Weekly Overlap</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Big number */}
        <div className="text-center py-3">
          <div className={cn("text-4xl font-display font-bold",
            stats.pct >= 80 ? "text-emerald-600" : stats.pct >= 50 ? "text-amber-600" : "text-red-600")}>
            {stats.pct}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">of call sheet plays were practiced</p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Practiced', val: stats.totalPracticed, color: 'text-emerald-600' },
            { label: 'On Sheet', val: stats.totalOnSheet, color: 'text-foreground' },
            { label: 'Overlap', val: stats.overlap, color: 'text-emerald-600' },
            { label: 'Unrepped', val: stats.unpracticed, color: 'text-red-600' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <div className={cn("text-xl font-bold font-display", color)}>{val}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Unrepped plays list */}
        {unpracticedItems.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" /> Not Practiced This Week
            </p>
            <div className="space-y-1">
              {unpracticedItems.slice(0, 12).map(item => {
                const play = playMap[item.play_id];
                if (!play) return null;
                return (
                  <div key={item.id} className="flex items-center gap-1.5 bg-red-500/5 rounded px-2 py-1.5">
                    <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="text-xs truncate">{play.play_name}</span>
                  </div>
                );
              })}
              {unpracticedItems.length > 12 && (
                <p className="text-[10px] text-muted-foreground text-center">+{unpracticedItems.length - 12} more</p>
              )}
            </div>
          </div>
        )}

        {stats.pct === 100 && (
          <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              All call sheet plays were practiced this week!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}