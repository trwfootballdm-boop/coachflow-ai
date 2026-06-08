import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

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
      <Input onKeyDown={addTag} placeholder={placeholder || 'Type and press Enter'} className="bg-secondary/50 border-0" />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.filter(s => !value.includes(s)).map(s => (
            <button key={s} onClick={() => addSuggestion(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
              +{s}
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
              {tag}
              <button onClick={() => remove(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const sel = (field, options, play, update, placeholder = 'Select...') => (
  <Select value={play[field] || ''} onValueChange={(v) => update(field, v)}>
    <SelectTrigger className="bg-secondary/50 border-0">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(([val, label]) => (
        <SelectItem key={val} value={val}>{label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function PlayDetailsForm({ play, onChange }) {
  const update = (field, value) => onChange({ ...play, [field]: value });

  return (
    <div className="space-y-1">

      {/* Identity */}
      <SectionLabel>Identity</SectionLabel>
      <Field label="Play Name">
        <Input value={play.name || ''} onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Inside Zone Left" className="bg-secondary/50 border-0" />
      </Field>
      <Field label="Short Name / Call">
        <Input value={play.short_name || ''} onChange={(e) => update('short_name', e.target.value)}
          placeholder="e.g. IZL, 36" className="bg-secondary/50 border-0" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Side">
          {sel('side', [['offense','Offense'],['defense','Defense'],['special_teams','Special Teams']], play, update)}
        </Field>
        <Field label="Run / Pass">
          {sel('run_pass', [['run','Run'],['pass','Pass'],['rpo','RPO'],['special_teams','Special Teams']], play, update)}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Play Type">
          {sel('play_type', [['run','Run'],['pass','Pass'],['screen','Screen'],['play_action','Play Action'],['rpo','RPO'],['trick','Trick'],['special_teams','Special Teams']], play, update)}
        </Field>
        <Field label="Play Family">
          <Input value={play.play_family || ''} onChange={(e) => update('play_family', e.target.value)}
            placeholder="e.g. Zone, Power, Mesh" className="bg-secondary/50 border-0" />
        </Field>
      </div>

      {/* Formation */}
      <SectionLabel>Formation & Personnel</SectionLabel>
      <Field label="Formation">
        <Input value={play.formation || ''} onChange={(e) => update('formation', e.target.value)}
          placeholder="e.g. Shotgun Trips Right" className="bg-secondary/50 border-0" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Personnel">
          {sel('personnel', [['10','10'],['11','11'],['12','12'],['13','13'],['20','20'],['21','21'],['22','22'],['23','23']], play, update)}
        </Field>
        <Field label="Strength">
          {sel('strength', [['any','Any'],['right','Right'],['left','Left'],['field','Field'],['boundary','Boundary']], play, update, 'Any')}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Motion">
          <Input value={play.motion || ''} onChange={(e) => update('motion', e.target.value)}
            placeholder="e.g. Jet, Orbit, Shift" className="bg-secondary/50 border-0" />
        </Field>
        <Field label="Direction">
          {sel('direction', [['any','Any'],['left','Left'],['right','Right'],['middle','Middle']], play, update, 'Any')}
        </Field>
      </div>
      <Field label="Concept">
        <Input value={play.concept || ''} onChange={(e) => update('concept', e.target.value)}
          placeholder="e.g. Inside Zone, Curl Flat" className="bg-secondary/50 border-0" />
      </Field>

      {/* Situational Tags */}
      <SectionLabel>Situational Tags</SectionLabel>
      <Field label="Down & Distance Tags">
        <TagInput
          value={play.down_distance_tags || []}
          onChange={(v) => update('down_distance_tags', v)}
          placeholder="Type and press Enter"
          suggestions={['1st-10', '2nd-short', '2nd-medium', '2nd-long', '3rd-short', '3rd-medium', '3rd-long', '4th-short', 'Goal-to-go', '2pt']}
        />
      </Field>
      <Field label="Field Zone Tags">
        <TagInput
          value={play.field_zone_tags || []}
          onChange={(v) => update('field_zone_tags', v)}
          suggestions={['backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line', 'any']}
        />
      </Field>
      <Field label="Hash Tags">
        <TagInput
          value={play.hash_tags || []}
          onChange={(v) => update('hash_tags', v)}
          suggestions={['left', 'middle', 'right', 'any']}
        />
      </Field>

      {/* Opponent Tags */}
      <SectionLabel>Opponent Matchup Tags</SectionLabel>
      <Field label="Best vs Front">
        <TagInput
          value={play.opponent_front_tags || []}
          onChange={(v) => update('opponent_front_tags', v)}
          placeholder="e.g. 4-3, 3-4, Bear, Odd"
          suggestions={['4-3', '3-4', 'Bear', 'Odd', 'Even', '4-2-5', '3-3-5', '6-2']}
        />
      </Field>
      <Field label="Best vs Coverage">
        <TagInput
          value={play.coverage_tags || []}
          onChange={(v) => update('coverage_tags', v)}
          placeholder="e.g. Cover 2, Man, Quarters"
          suggestions={['Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man', 'Cover 3', 'Cover 4', 'Quarters', 'Man', 'Zone']}
        />
      </Field>

      {/* Install & Risk */}
      <SectionLabel>Install & Difficulty</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Install Week">
          <Input type="number" min={1} value={play.install_week || ''} onChange={(e) => update('install_week', Number(e.target.value))}
            placeholder="e.g. 1" className="bg-secondary/50 border-0" />
        </Field>
        <Field label="Install Day">
          <Input type="number" min={1} max={5} value={play.install_day || ''} onChange={(e) => update('install_day', Number(e.target.value))}
            placeholder="1–5" className="bg-secondary/50 border-0" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age Level">
          {sel('age_level_difficulty', [['youth','Youth'],['middle_school','Middle School'],['high_school','High School'],['college','College'],['pro','Pro']], play, update)}
        </Field>
        <Field label="Risk Level">
          {sel('risk_level', [['low','Low'],['medium','Medium'],['high','High']], play, update, 'Medium')}
        </Field>
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
          placeholder="Key points to emphasize when installing this play..."
          className="bg-secondary/50 border-0 h-20 resize-none" />
      </Field>
      <Field label="General Notes">
        <Textarea value={play.notes || ''} onChange={(e) => update('notes', e.target.value)}
          placeholder="Any other coach notes..."
          className="bg-secondary/50 border-0 h-16 resize-none" />
      </Field>

      {/* Toggles */}
      <SectionLabel>Status</SectionLabel>
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-3">
          <Switch checked={play.is_favorite || false} onCheckedChange={(v) => update('is_favorite', v)} />
          <Label className="text-sm">Mark as Favorite</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={play.is_active !== false} onCheckedChange={(v) => update('is_active', v)} />
          <Label className="text-sm">Active in Playbook</Label>
        </div>
      </div>
    </div>
  );
}