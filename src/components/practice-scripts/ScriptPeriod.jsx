import React, { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Clock, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const PERIOD_TYPES = [
  ['install',       'Install'],
  ['indy',          'Individual'],
  ['group',         'Group'],
  ['team',          'Team'],
  ['team_run',      'Team Run'],
  ['team_pass',     'Team Pass'],
  ['red_zone',      'Red Zone'],
  ['two_minute',    '2-Minute'],
  ['goal_line',     'Goal Line'],
  ['special_teams', 'Special Teams'],
  ['walk_through',  'Walk-Through'],
  ['rep',           'Play Rep'],
  ['custom',        'Custom'],
];

const TYPE_COLORS = {
  install:       'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
  team_run:      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  team_pass:     'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
  team:          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  red_zone:      'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20',
  two_minute:    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  goal_line:     'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20',
  special_teams: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20',
  walk_through:  'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  rep:           'bg-secondary text-muted-foreground border-border',
  indy:          'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  group:         'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20',
};

// Inline editable duration — click to edit, blur/enter to confirm
function DurationBadge({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef();

  const start = (e) => {
    e.stopPropagation();
    setDraft(String(value || ''));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        onClick={e => e.stopPropagation()}
        className="w-10 text-center text-xs font-mono bg-secondary border border-primary rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <button
      onClick={start}
      title="Click to edit duration"
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded px-1.5 py-0.5 transition-colors"
    >
      <Clock className="h-3 w-3" />
      <span className="font-mono font-medium">{value || '—'}m</span>
    </button>
  );
}

export default function ScriptPeriod({ item, index, onUpdate, onDelete, onAddPlay }) {
  const [expanded, setExpanded] = useState(false);
  const u = (k, v) => onUpdate({ ...item, [k]: v });

  const typeColor = TYPE_COLORS[item.period_type] || TYPE_COLORS.rep;
  const periodLabel = PERIOD_TYPES.find(([v]) => v === item.period_type)?.[1] || 'Custom';
  const isRep = item.period_type === 'rep';

  return (
    <Draggable draggableId={String(item.id || item._tempId)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "border rounded-xl overflow-hidden transition-shadow bg-card print:border-gray-300",
            expanded ? "border-primary/30 ring-1 ring-primary/10" : "border-border",
            snapshot.isDragging && "shadow-lg ring-1 ring-primary/20 opacity-95"
          )}
        >
          {/* Row header */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
            onClick={() => setExpanded(v => !v)}
          >
            {/* Drag handle */}
            <div
              {...provided.dragHandleProps}
              onClick={e => e.stopPropagation()}
              className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-secondary transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </div>

            {/* Row number */}
            <span className="text-[10px] font-mono text-muted-foreground/50 w-4 shrink-0 select-none">{index + 1}</span>

            {/* Type badge */}
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border capitalize shrink-0 hidden sm:inline-flex", typeColor)}>
              {periodLabel}
            </span>

            {/* Name */}
            <span className="flex-1 text-sm font-medium truncate">
              {item.period_name || <span className="text-muted-foreground/50">Unnamed Period</span>}
            </span>

            {/* Coaching note preview */}
            {!expanded && item.coaching_note && (
              <span className="text-[11px] text-muted-foreground italic truncate max-w-[140px] hidden lg:block">
                {item.coaching_note}
              </span>
            )}

            {/* Start time */}
            {item.start_time_label && (
              <span className="text-[11px] font-mono text-muted-foreground/60 hidden md:block shrink-0">
                @{item.start_time_label}
              </span>
            )}

            {/* Inline duration edit */}
            <div onClick={e => e.stopPropagation()}>
              <DurationBadge value={item.duration_minutes} onChange={v => u('duration_minutes', v)} />
            </div>

            {/* Expand toggle */}
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            }
          </div>

          {/* Expanded edit form */}
          {expanded && (
            <div className="border-t border-border bg-secondary/10 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Period Name</label>
                  <Input
                    value={item.period_name || ''}
                    onChange={e => u('period_name', e.target.value)}
                    placeholder="e.g. Team Run Period 1"
                    className="bg-card border-border h-9 text-sm"
                    autoFocus
                  />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Duration (min)</label>
                  <Input
                    type="number" min={1} max={120}
                    value={item.duration_minutes || ''}
                    onChange={e => u('duration_minutes', Number(e.target.value))}
                    placeholder="10"
                    className="bg-card border-border h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Start Time</label>
                  <Input
                    value={item.start_time_label || ''}
                    onChange={e => u('start_time_label', e.target.value)}
                    placeholder=":15 or 5:00"
                    className="bg-card border-border h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Coaching Note</label>
                <Textarea
                  value={item.coaching_note || ''}
                  onChange={e => u('coaching_note', e.target.value)}
                  placeholder="e.g. Emphasize mesh point timing, no penalties"
                  className="bg-card border-border text-sm resize-none min-h-[60px]"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {!isRep && (
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-7" onClick={onAddPlay}>
                    <Plus className="h-3.5 w-3.5" /> Add Play Rep
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  className="gap-1.5 rounded-lg text-xs h-7 text-destructive hover:text-destructive ml-auto"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}