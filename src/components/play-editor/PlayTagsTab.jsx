import React from 'react';
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_GROUPS = [
  {
    key: 'down_distance_tags', label: 'Down & Distance',
    description: 'Which down and distance situations does this play work best in?',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    options: ['1st-10', '2nd-short', '2nd-medium', '2nd-long', '3rd-short', '3rd-medium', '3rd-long', '4th-short', 'Goal-to-go', '2pt'],
  },
  {
    key: 'field_zone_tags', label: 'Field Zone',
    description: 'Where on the field is this play designed to run?',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    options: ['backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line', 'any'],
  },
  {
    key: 'opponent_front_tags', label: 'Best vs. Front',
    description: 'Which defensive fronts does this play attack?',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    options: ['4-3', '3-4', 'Bear', 'Odd', 'Even', '4-2-5', '3-3-5', '6-2', '5-3', '4-4', '6-1'],
  },
  {
    key: 'coverage_tags', label: 'Best vs. Coverage',
    description: 'Which coverages is this play designed to beat?',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    options: ['Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man', 'Cover 3', 'Cover 4', 'Quarters', 'Man', 'Zone', 'Press'],
  },
  {
    key: 'hash_tags', label: 'Hash Preference',
    description: 'Which hash works best for this play?',
    color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    options: ['left', 'right', 'middle', 'any'],
  },
];

const SITUATION_PRESETS = [
  { label: 'Opener', tags: { field_zone_tags: ['own_territory'], down_distance_tags: ['1st-10'] } },
  { label: 'Red Zone', tags: { field_zone_tags: ['red_zone'] } },
  { label: 'Goal Line', tags: { field_zone_tags: ['goal_line'], down_distance_tags: ['Goal-to-go'] } },
  { label: '3rd & Short', tags: { down_distance_tags: ['3rd-short', '4th-short'] } },
  { label: '2-Minute', tags: { down_distance_tags: ['2nd-medium', '2nd-long', '3rd-short', '3rd-medium'] } },
  { label: '2pt Play', tags: { down_distance_tags: ['2pt'] } },
];

function TagGroup({ group, play, onChange }) {
  const current = play[group.key] || [];
  const toggle = (opt) => {
    const next = current.includes(opt) ? current.filter(t => t !== opt) : [...current, opt];
    onChange({ ...play, [group.key]: next });
  };

  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{group.label}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{group.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {group.options.map(opt => {
          const active = current.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                active
                  ? cn(group.color, "border-current")
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {opt.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
      {current.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {current.map(t => (
            <Badge key={t} variant="secondary" className={cn("text-xs gap-1 pr-1 border", group.color)}>
              {t.replace(/_/g, ' ')}
              <button onClick={() => toggle(t)} className="hover:text-destructive ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlayTagsTab({ play, onChange }) {
  const applyPreset = (preset) => {
    const updated = { ...play };
    Object.entries(preset.tags).forEach(([key, vals]) => {
      const existing = updated[key] || [];
      updated[key] = [...new Set([...existing, ...vals])];
    });
    onChange(updated);
  };

  return (
    <div className="space-y-8">
      {/* Situation Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Presets</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex flex-wrap gap-2">
          {SITUATION_PRESETS.map(preset => (
            <button key={preset.label} onClick={() => applyPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all font-medium">
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag groups */}
      {TAG_GROUPS.map(group => (
        <div key={group.key}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-border" />
          </div>
          <TagGroup group={group} play={play} onChange={onChange} />
        </div>
      ))}

      {/* Summary */}
      <div className="bg-secondary/30 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Tag Summary</p>
        <div className="flex flex-wrap gap-2">
          {TAG_GROUPS.flatMap(g => (play[g.key] || []).map(t => (
            <Badge key={`${g.key}-${t}`} variant="secondary" className={cn("text-[10px]", g.color)}>
              {t.replace(/_/g, ' ')}
            </Badge>
          )))}
          {TAG_GROUPS.every(g => !(play[g.key] || []).length) && (
            <p className="text-xs text-muted-foreground">No tags set yet. Tags help with filtering and AI game planning.</p>
          )}
        </div>
      </div>
    </div>
  );
}