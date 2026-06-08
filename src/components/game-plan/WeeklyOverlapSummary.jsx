import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, BookOpen, ClipboardList, TrendingUp } from "lucide-react";

export default function WeeklyOverlapSummary({ callSheetItems, practicePlayIds }) {
  const totalOnSheet = callSheetItems.length;
  const totalPracticed = new Set(practicePlayIds).size;
  const practicedOnSheet = callSheetItems.filter(i => practicePlayIds.includes(i.play_id)).length;
  const unpracticedOnSheet = totalOnSheet - practicedOnSheet;
  const overlapPct = totalOnSheet > 0 ? Math.round((practicedOnSheet / totalOnSheet) * 100) : 0;

  const stats = [
    { label: 'Practiced This Week', value: totalPracticed, iconName: 'BookOpen', color: 'text-primary' },
    { label: 'On Call Sheet', value: totalOnSheet, iconName: 'ClipboardList', color: 'text-foreground' },
    { label: 'Overlap', value: practicedOnSheet, iconName: 'CheckCircle2', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Not Practiced', value: unpracticedOnSheet, iconName: 'AlertTriangle', color: unpracticedOnSheet > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground' },
  ];

  const iconMap = { BookOpen, ClipboardList, CheckCircle2, AlertTriangle };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">Weekly Prep Overlap</h3>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn(
            "text-sm font-bold",
            overlapPct >= 80 ? "text-emerald-600 dark:text-emerald-400" :
            overlapPct >= 50 ? "text-amber-600 dark:text-amber-400" :
            "text-destructive"
          )}>{overlapPct}%</span>
        </div>
      </div>

      <div className="h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            overlapPct >= 80 ? "bg-emerald-500" : overlapPct >= 50 ? "bg-amber-500" : "bg-destructive"
          )}
          style={{ width: `${overlapPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, iconName, color }) => {
          const StatIcon = iconMap[iconName];
          return (
            <div key={label} className="flex items-center gap-2">
              <StatIcon className={cn("h-3.5 w-3.5 shrink-0", color)} />
              <div>
                <div className={cn("text-base font-bold leading-none", color)}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {unpracticedOnSheet > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span><b>{unpracticedOnSheet} play{unpracticedOnSheet !== 1 ? 's' : ''}</b> on your call sheet {unpracticedOnSheet !== 1 ? 'were' : 'was'} not practiced this week.</span>
        </div>
      )}
    </div>
  );
}