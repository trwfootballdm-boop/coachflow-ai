import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useTerminology } from "@/lib/useTerminology";

const SectionLabel = ({ children }) => (
  <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mt-5 mb-2 border-b border-border pb-1">
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const TagInput = ({ value = [], onChange, placeholder, suggestions = [] }) => {
  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (!value.includes(tag)) onChange([...value, tag]);
      e.target.value = '';
    }
  };
  const addSuggestion = (s) => {
    if (!value.includes(s)) onChange([...value, s]);
  };
  const remove = (t) => onChange(value.filter(v => v !== t));

  return (
    <div className="space-y-1.5">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.filter(s => !value.includes(s)).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addSuggestion(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
            >
              +{s}
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1">
              {tag}
              <button type="button" onClick={() => remove(tag)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input onKeyDown={addTag} placeholder={placeholder} className="bg-secondary/50 border-0 h-8 text-sm" />
    </div>
  );
};

const sel = (field, options, play, update, placeholder = 'Select...') => (
  <Select value={play[field] || ''} onValueChange={(v) => update(field, v)}>
    <SelectTrigger className="bg-secondary/50 border-0 h-9">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(([val, label]) => (
        <SelectItem key={val} value={val}>{label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Free-text input that offers Terminology-driven suggestion chips below it.
const SuggestField = ({ value, onChange, placeholder, suggestions = [] }) => {
  const filtered = (suggestions || []).filter(
    (s) => s && s.toLowerCase() !== String(value || '').toLowerCase()
  );
  return (
    <div className="space-y-1">
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-secondary/50 border-0 h-9"
      />
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filtered.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PlayDetailsForm({ play, onChange }) {
  const update = (field, value) => onChange({ ...play, [field]: value });
  const { values: term } = useTerminology();

  const coverageSuggestions =
    term.defensive_call.length > 0
      ? term.defensive_call
      : ['Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man', 'Cover 3', 'Cover 4', 'Quarters', 'Man', 'Zone'];

  return (
    <div className="space-y-3 text-sm">
      {/* Identity */}
      <SectionLabel>Identity</SectionLabel>
      <Field label="Play Name">
        <Input value={play.name || ''} onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Inside Zone Left" className="bg-secondary/50 border-0" />
      </Field>
      <Field label="Short Name">
        <Input value={play.short_name || ''} onChange={(e) => update('short_name', e.target.value)}
          placeholder="e.g. IZL, 36" className="bg-secondary/50 border-0" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Side">{sel('side', [['offense','Offense'],['defense','Defense'],['special_teams','Special Teams']], play, update)}</Field>
        <Field label="Run/Pass">{sel('run_pass', [['run','Run'],['pass','Pass'],['rpo','RPO'],['special_teams','Special Teams']], play, update)}</Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Play Type">{sel('play_type', [['run','Run'],['pass','Pass'],['screen','Screen'],['play_action','Play Action'],['rpo','RPO'],['trick','Trick'],['special_teams','Special Teams']], play, update)}</Field>
        <Field label="Play Family">
          <Input value={play.play_family || ''} onChange={(e) => update('play_family', e.target.value)}
            placeholder="e.g. Zone, Power, Mesh" className="bg-secondary/50 border-0" />
        </Field>
      </div>

      {/* Formation */}
      <SectionLabel>Formation & Personnel</SectionLabel>
      <Field label="Formation">
        <SuggestField
          value={play.formation}
          onChange={(v) => update('formation', v)}
          placeholder="e.g. Shotgun Trips Right"
          suggestions={term.formation_tag}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Personnel">{sel('personnel', [['10','10'],['11','11'],['12','12'],['13','13'],['20','20'],['21','21'],['22','22'],['23','23']], play, update)}</Field>
        <Field label="Strength">{sel('strength', [['any','Any'],['right','Right'],['left','Left'],['field','Field'],['boundary','Boundary']], play, update, 'Any')}</Field>
      </div>
      <Field label="Motion">
        <SuggestField
          value={play.motion}
          onChange={(v) => update('motion', v)}
          placeholder="e.g. Jet, Orbit, Shift"
          suggestions={term.motion}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Direction">{sel('direction', [['any','Any'],['left','Left'],['right','Right'],['middle','Middle']], play, update, 'Any')}</Field>
      </div>
      <Field label="Concept">
        <SuggestField
          value={play.concept}
          onChange={(v) => update('concept', v)}
          placeholder="e.g. Inside Zone, Curl Flat"
          suggestions={term.concept}
        />
      </Field>

      {/* Situational Tags */}
      <SectionLabel>Situational Tags</SectionLabel>
      <Field label="Down & Distance">
        <TagInput value={play.down_distance_tags || []} onChange={(v) => update('down_distance_tags', v)}
          placeholder="Type and press Enter"
          suggestions={['1st-10', '2nd-short', '2nd-medium', '2nd-long', '3rd-short', '3rd-medium', '3rd-long', '4th-short', 'Goal-to-go', '2pt']}
        />
      </Field>
      <Field label="Field Zone">
        <TagInput value={play.field_zone_tags || []} onChange={(v) => update('field_zone_tags', v)}
          suggestions={['backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line', 'any']}
        />
      </Field>
      <Field label="Hash">
        <TagInput value={play.hash_tags || []} onChange={(v) => update('hash_tags', v)}
          suggestions={['left', 'middle', 'right', 'any']}
        />
      </Field>

      {/* Opponent Tags */}
      <SectionLabel>Opponent Matchup Tags</SectionLabel>
      <Field label="vs. Front">
        <TagInput value={play.opponent_front_tags || []} onChange={(v) => update('opponent_front_tags', v)}
          placeholder="e.g. 4-3, 3-4, Bear, Odd"
          suggestions={['4-3', '3-4', 'Bear', 'Odd', 'Even', '4-2-5', '3-3-5', '6-2']}
        />
      </Field>
      <Field label="vs. Coverage">
        <TagInput value={play.coverage_tags || []} onChange={(v) => update('coverage_tags', v)}
          placeholder="e.g. Cover 2, Man, Quarters"
          suggestions={coverageSuggestions}
        />
      </Field>

      {/* Install & Risk */}
      <SectionLabel>Install & Difficulty</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Install Week">
          <Input type="number" value={play.install_week || ''} onChange={(e) => update('install_week', Number(e.target.value))}
            placeholder="e.g. 1" className="bg-secondary/50 border-0" />
        </Field>
        <Field label="Install Day">
          <Input type="number" value={play.install_day || ''} onChange={(e) => update('install_day', Number(e.target.value))}
            placeholder="1–5" className="bg-secondary/50 border-0" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Age / Level">{sel('age_level_difficulty', [['youth','Youth'],['middle_school','Middle School'],['high_school','High School'],['college','College'],['pro','Pro']], play, update)}</Field>
        <Field label="Risk Level">{sel('risk_level', [['low','Low'],['medium','Medium'],['high','High']], play, update, 'Medium')}</Field>
      </div>

      {/* Custom Tags */}
      <SectionLabel>Custom Tags</SectionLabel>
      <Field label="Tags">
        <TagInput value={play.tags || []} onChange={(v) => update('tags', v)} placeholder="Any custom tag, press Enter" />
      </Field>

      {/* Coaching Notes */}
      <SectionLabel>Coaching Notes</SectionLabel>
      <Field label="Coaching Points">
        <Textarea value={play.coaching_points || ''} onChange={(e) => update('coaching_points', e.target.value)}
          placeholder="Key points for players…" rows={3} className="bg-secondary/50 border-0 text-sm resize-none" />
      </Field>
      <Field label="Notes">
        <Textarea value={play.notes || ''} onChange={(e) => update('notes', e.target.value)}
          placeholder="General notes…" rows={2} className="bg-secondary/50 border-0 text-sm resize-none" />
      </Field>

      {/* Flags */}
      <SectionLabel>Flags</SectionLabel>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Favorite</Label>
        <Switch checked={play.is_favorite || false} onCheckedChange={(v) => update('is_favorite', v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Active in Playbook</Label>
        <Switch checked={play.is_active !== false} onCheckedChange={(v) => update('is_active', v)} />
      </div>
    </div>
  );
}