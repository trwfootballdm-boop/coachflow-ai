import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Star, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const F = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const Sel = ({ value, onChange, options, placeholder }) => (
  <Select value={value || ''} onValueChange={onChange}>
    <SelectTrigger className="bg-secondary/50 border-0 h-9">
      <SelectValue placeholder={placeholder || 'Select...'} />
    </SelectTrigger>
    <SelectContent>
      {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
    </SelectContent>
  </Select>
);

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
    {children}
  </div>
);

export default function PlayOverviewTab({ play, onChange, formations }) {
  const u = (field, val) => onChange({ ...play, [field]: val });
  const offFormations = formations.filter(f => f.side_of_ball === play.side_of_ball || !f.side_of_ball);

  return (
    <div className="space-y-8">

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Version', value: `v${play.version_no || 1}` },
          { label: 'Side', value: play.side_of_ball?.replace(/_/g, ' ') || '—' },
          { label: 'Type', value: play.run_pass_type?.replace(/_/g, ' ') || '—' },
          { label: 'Level', value: play.difficulty_level || '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-secondary/40 rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-semibold capitalize mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Identity */}
      <Section title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Play Name" required>
            <Input value={play.play_name || ''} onChange={e => u('play_name', e.target.value)}
              placeholder="e.g. Power Right 38 Kick" className="bg-secondary/50 border-0 h-9" />
          </F>
          <F label="Short Name / Call Code">
            <Input value={play.short_name || ''} onChange={e => u('short_name', e.target.value)}
              placeholder="e.g. PWR-R, 38K" className="bg-secondary/50 border-0 h-9 font-mono" />
          </F>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <F label="Side of Ball" required>
            <Sel value={play.side_of_ball} onChange={v => u('side_of_ball', v)}
              options={[['offense','Offense'],['defense','Defense'],['special_teams','Special Teams']]} />
          </F>
          <F label="Run / Pass Type" required>
            <Sel value={play.run_pass_type} onChange={v => u('run_pass_type', v)}
              options={[['run','Run'],['pass','Pass'],['rpo','RPO'],['defense_call','Defense Call'],['special_teams_call','Special Teams']]} />
          </F>
          <F label="Direction">
            <Sel value={play.direction} onChange={v => u('direction', v)}
              options={[['none','None'],['left','Left'],['right','Right'],['middle','Middle'],['strong','Strong'],['weak','Weak']]} />
          </F>
        </div>
      </Section>

      {/* Formation & Scheme */}
      <Section title="Formation & Scheme">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Formation" required>
            <Select value={play.formation_id || ''} onValueChange={v => u('formation_id', v)}>
              <SelectTrigger className="bg-secondary/50 border-0 h-9">
                <SelectValue placeholder="Select formation..." />
              </SelectTrigger>
              <SelectContent>
                {offFormations.length === 0 && (
                  <SelectItem value="_none" disabled>No formations yet — add in Settings</SelectItem>
                )}
                {offFormations.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.formation_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Play Family" required hint="e.g. Power, Zone, Counter, Mesh, Blitz">
            <Input value={play.play_family || ''} onChange={e => u('play_family', e.target.value)}
              placeholder="e.g. Power, Zone, Man Blitz" className="bg-secondary/50 border-0 h-9" />
          </F>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Concept" required hint="e.g. inside_run, edge_run, play_action, cover_2">
            <Input value={play.concept || ''} onChange={e => u('concept', e.target.value)}
              placeholder="e.g. Inside Zone, Curl Flat, Cover 3" className="bg-secondary/50 border-0 h-9" />
          </F>
          <F label="Install Day" hint="Which practice day this play is installed on">
            <Input type="number" min={1} max={30} value={play.install_day || ''}
              onChange={e => u('install_day', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 1, 2, 3" className="bg-secondary/50 border-0 h-9" />
          </F>
        </div>
      </Section>

      {/* Difficulty & Risk */}
      <Section title="Difficulty & Risk">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Difficulty Level">
            <Sel value={play.difficulty_level} onChange={v => u('difficulty_level', v)}
              options={[['easy','Easy — Youth / Flag'],['moderate','Moderate — Middle School'],['advanced','Advanced — High School+']]} />
          </F>
          <F label="Risk Level" hint="How risky if the play breaks down">
            <Sel value={play.risk_level} onChange={v => u('risk_level', v)}
              options={[['low','Low — Safe call'],['medium','Medium — Some exposure'],['high','High — Big play or bust']]} />
          </F>
        </div>
      </Section>

      {/* Status */}
      <Section title="Status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-secondary/40 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">Mark as Favorite</p>
              <p className="text-xs text-muted-foreground">Pin to top of Play Library</p>
            </div>
            <Switch checked={play.favorite || false} onCheckedChange={v => u('favorite', v)} />
          </div>
          <div className="flex items-center justify-between bg-secondary/40 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active in Playbook</p>
              <p className="text-xs text-muted-foreground">Inactive plays are hidden by default</p>
            </div>
            <Switch checked={play.active !== false} onCheckedChange={v => u('active', v)} />
          </div>
        </div>
      </Section>
    </div>
  );
}