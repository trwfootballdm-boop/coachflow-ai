import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function WeeklySummaryPanel({ practicedPlayIds = [], callSheetPlayIds = [] }) {
  const total_practiced = practicedPlayIds.length;
  const total_on_sheet = callSheetPlayIds.length;
  const overlap = callSheetPlayIds.filter(id => practicedPlayIds.includes(id)).length;
  const unprepped = total_on_sheet - overlap;
  const pct = total_on_sheet > 0 ? Math.round((overlap / total_on_sheet) * 100) : 0;

  const row = (label, value, variant = 'default') => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold font-mono ${
        variant === 'warn' ? 'text-amber-500' :
        variant === 'good' ? 'text-emerald-500' :
        'text-foreground'
      }`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weekly Prep</h4>
      </div>
      {row('Practiced this week', total_practiced)}
      {row('On call sheet', total_on_sheet)}
      {row('Overlap (practiced + on sheet)', overlap, 'good')}
      {row('Not practiced (on sheet)', unprepped, unprepped > 0 ? 'warn' : 'good')}
      <div className="pt-2 border-t border-border mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground">Prep coverage</span>
          <span className={`text-xs font-bold font-mono ${pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {unprepped > 0 && (
          <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" />
            {unprepped} call sheet play{unprepped > 1 ? 's' : ''} not repped this week
          </p>
        )}
        {pct === 100 && total_on_sheet > 0 && (
          <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-2">
            <CheckCircle2 className="h-3 w-3" />
            All call sheet plays practiced
          </p>
        )}
      </div>
    </div>
  );
}