import React from 'react';
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_GROUPS = [
  {
    key: 'down_distance_tags',
    label: 'Down & Distance',
    description: 'When is this play called based on down and distance?',
    presets: ['1st-10', '2nd-short', '2nd-medium', '2nd-long', '3rd-short', '3rd-medium', '3rd-long', '4th-short', '4th-long', 'Goal-to-go', '2pt'],
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  {
    key: 'field_zone_tags',
    label: 'Field Zone',
    description: 'Which areas of the field is this play designed for?',
    presets: ['backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line', 'any'],
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    key: 'hash_tags',
    label: 'Hash / Field Side',
    description: 'Hash or field position preference',
    presets: ['left_hash', 'right_hash', 'middle', 'field_side', 'boundary_side', 'any'],
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
  {
    key: 'opponent_front_tags',
    label: 'Best vs. Front',
    description: 'Which defensive fronts does this play attack?',
    presets: ['4-3', '3-4', 'Bear', 'Odd', 'Even', '4-2-5', '3-3-5', '6-2', '5-3', '4-4', '6-1'],
    color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  },
  {
    key: 'coverage_tags',
    label: 'Best vs. Coverage',
    description: 'Which coverages does this play exploit?',
    presets: ['Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man', 'Cover 3', 'Cover 4', 'Quarters', 'Man', 'Zone', 'Press'],
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  {
    key: 'tags',
    label: 'Situation / Custom',
    description: 'Game situation tags and custom labels',
    presets: ['opener', 'backed_up', 'two_minute', 'short_yardage', 'must_pass', 'gadget', 'base', 'keep'],
    color: 'bg-secondary text-foreground border-border',
  },
];

function TagGroup({ group, play, onChange }) {
  const current = play[group.key] || [];
  const toggle = (tag) => {
    if (current.includes(tag)) {
      onChange(group.key, current.filter(t => t !== tag));
    } else {
      onChange(group.key, [...current, tag]);
    }
  };
  const remove = (tag) => onChange(group.key, current.filter(t => t !== tag));

  return (
    <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-foreground">{group.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{group.description}</p>
      </div>

      {/* Selected tags */}
      {current.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {current.map(tag => (
            <span key={tag} className={cn(
              "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium",
              group.color
            )}>
              {tag.replace(/_/g, ' ')}
              <button onClick={() => remove(tag)} className="hover:opacity-70 transition-opacity ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {group.presets.filter(p => !current.includes(p)).map(preset => (
          <button key={preset} onClick={() => toggle(preset)}
            className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary/40 hover:text-primary text-muted-foreground transition-all font-medium">
            + {preset.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TagsTab({ play, onChange }) {
  const update = (field, value) => onChange({ ...play, [field]: value });
  const totalTags = TAG_GROUPS.reduce((sum, g) => sum + (play[g.key]?.length || 0), 0);

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h3 className="font-display font-semibold">Situational Tags</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tag this play by situation so it appears in the right game plan and filtering contexts. {totalTags} tags applied.
        </p>
      </div>
      <div className="space-y-3">
        {TAG_GROUPS.map(group => (
          <TagGroup key={group.key} group={group} play={play} onChange={update} />
        ))}
      </div>
    </div>
  );
}