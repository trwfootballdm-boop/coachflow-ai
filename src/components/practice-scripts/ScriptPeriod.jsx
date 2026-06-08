import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronUp, ChevronDown, GripVertical, Clock, Plus, ChevronRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIOD_TYPES = [
  ['install', 'Install'],
  ['indy', 'Individual (Indy)'],
  ['group', 'Group'],
  ['team', 'Team'],
  ['team_run', 'Team Run'],
  ['team_pass', 'Team Pass'],
  ['red_zone', 'Red Zone'],
  ['two_minute', '2-Minute'],
  ['goal_line', 'Goal Line'],
  ['special_teams', 'Special Teams'],
  ['walk_through', 'Walk-Through'],
  ['rep', 'Play Rep'],
  ['custom', 'Custom'],
];

const TYPE_COLORS = {
  install: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  team_run: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  team_pass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  team: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  red_zone: 'bg-red-500/10 text-red-700 dark:text-red-400',
  two_minute: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  goal_line: 'bg-red-500/10 text-red-700 dark:text-red-400',
  special_teams: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  walk_through: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  rep: 'bg-secondary text-muted-foreground',
  indy: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  group: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
};

export default function ScriptPeriod({ item, index, onUpdate, onDelete, onMoveUp, onMoveDown, onAddPlay, onPushToGamePlan }) {
  const [expanded, setExpanded] = useState(false);
  const u = (k, v) => onUpdate({ ...item, [k]: v });

  const typeColor = TYPE_COLORS[item.period_type] || 'bg-secondary text-muted-foreground';
  const periodLabel = PERIOD_TYPES.find(([v]) => v === item.period_type)?.[1] || item.period_type;

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden transition-all bg-card",
      expanded && "ring-1 ring-primary/20")}>

      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />

        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md capitalize shrink-0", typeColor)}>
          {periodLabel}
        </span>

        <span className="flex-1 text-sm font-medium truncate">
          {item.period_name || 'Unnamed Period'}
        </span>

        {item.duration_minutes > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />{item.duration_minutes}m
          </span>
        )}

        {item.start_time_label && (
          <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{item.start_time_label}</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors">
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </div>

      {/* Expanded edit */}
      {expanded && (
        <div className="border-t border-border bg-secondary/10 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Period Name</label>
              <Input value={item.period_name || ''} onChange={e => u('period_name', e.target.value)}
                placeholder="e.g. Team Run Period 1, Red Zone Script"
                className="bg-card border-border h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Period Type</label>
              <Select value={item.period_type || 'team'} onValueChange={v => u('period_type', v)}>
                <SelectTrigger className="bg-card border-border h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Duration (min)</label>
              <Input type="number" min={1} value={item.duration_minutes || ''} onChange={e => u('duration_minutes', Number(e.target.value))}
                placeholder="10" className="bg-card border-border h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Start Time</label>
              <Input value={item.start_time_label || ''} onChange={e => u('start_time_label', e.target.value)}
                placeholder="e.g. :15, 5:00" className="bg-card border-border h-9 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Coaching Note</label>
            <Input value={item.coaching_note || ''} onChange={e => u('coaching_note', e.target.value)}
              placeholder="e.g. Emphasize mesh point timing, no penalties"
              className="bg-card border-border h-9 text-sm" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-7" onClick={onAddPlay}>
              <Plus className="h-3.5 w-3.5" /> Add Play to Period
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-xs h-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Remove Period
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}