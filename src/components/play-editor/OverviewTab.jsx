import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Star, CalendarDays, Tag, PenTool, LayoutList, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

const SectionHeading = ({ children }) => (
  <div className="col-span-full pt-2">
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">{children}</div>
  </div>
);

const Sel = ({ field, options, play, update, placeholder = 'Select…', required }) => (
  <Select value={play[field] || ''} onValueChange={(v) => update(field, v)}>
    <SelectTrigger className={cn("bg-secondary/50 border-0 h-9", required && !play[field] && "ring-1 ring-destructive/40")}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(([val, label]) => (
        <SelectItem key={val} value={val}>{label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const DIFF_COLOR = { youth: 'bg-emerald-500/10 text-emerald-700', middle_school: 'bg-blue-500/10 text-blue-700', high_school: 'bg-amber-500/10 text-amber-700', college: 'bg-orange-500/10 text-orange-700', pro: 'bg-red-500/10 text-red-700' };
const RISK_COLOR = { low: 'bg-emerald-500/10 text-emerald-700', medium: 'bg-amber-500/10 text-amber-700', high: 'bg-red-500/10 text-red-700' };

export default function OverviewTab({ play, onChange, assignmentCount = 0, tagCount = 0, hasDiagram = false }) {
  const update = (field, value) => onChange({ ...play, [field]: value });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Left column */}
      <div className="space-y-5">
        {/* Quick stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            [LayoutList, 'Assignments', assignmentCount],
            [Tag, 'Tags', tagCount],
            [PenTool, 'Diagram', hasDiagram ? 'Yes' : 'None'],
            [Clock, 'Version', `v${play.version || 1}`],
          ]).map(([StatIcon, label, value]) => (
            <div key={label} className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <StatIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </div>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Identity */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Identity</div>
          <Field label="Play Name" required>
            <Input
              value={play.name || ''}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Power Right 38 Kick"
              className={cn("bg-secondary/50 border-0 h-9", !play.name && "ring-1 ring-destructive/40")}
            />
          </Field>
          <Field label="Short Name / Call">
            <Input
              value={play.short_name || ''}
              onChange={(e) => update('short_name', e.target.value)}
              placeholder="e.g. PWR-R, 36"
              className="bg-secondary/50 border-0 h-9 font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Side of Ball" required>
              <Sel field="side" required options={[['offense','Offense'],['defense','Defense'],['special_teams','Special Teams']]} play={play} update={update} />
            </Field>
            <Field label="Run / Pass" required>
              <Sel field="run_pass" required options={[['run','Run'],['pass','Pass'],['rpo','RPO'],['special_teams','Special Teams']]} play={play} update={update} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Play Family" required>
              <Input value={play.play_family || ''} onChange={(e) => update('play_family', e.target.value)}
                placeholder="e.g. Power, Zone, Mesh"
                className={cn("bg-secondary/50 border-0 h-9", !play.play_family && "ring-1 ring-destructive/40")} />
            </Field>
            <Field label="Concept" required>
              <Input value={play.concept || ''} onChange={(e) => update('concept', e.target.value)}
                placeholder="e.g. Inside Zone, Curl Flat"
                className={cn("bg-secondary/50 border-0 h-9", !play.concept && "ring-1 ring-destructive/40")} />
            </Field>
          </div>
        </div>

        {/* Status toggles */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Status</div>
          <div className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className={cn("h-4 w-4", play.is_favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Mark as Favorite</span>
            </div>
            <Switch checked={play.is_favorite || false} onCheckedChange={(v) => update('is_favorite', v)} />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", play.is_active !== false ? "bg-emerald-500" : "bg-muted-foreground/40")} />
              <span className="text-sm font-medium">Active in Playbook</span>
            </div>
            <Switch checked={play.is_active !== false} onCheckedChange={(v) => update('is_active', v)} />
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Formation & Personnel */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Formation & Alignment</div>
          <Field label="Formation">
            <Input value={play.formation || ''} onChange={(e) => update('formation', e.target.value)}
              placeholder="e.g. Shotgun Trips Right"
              className="bg-secondary/50 border-0 h-9" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Personnel">
              <Sel field="personnel" options={[['10','10 (4WR 1RB)'],['11','11 (3WR 1TE 1RB)'],['12','12 (2WR 2TE 1RB)'],['13','13 (1WR 3TE 1RB)'],['20','20 (2WR 2RB)'],['21','21 (2WR 1TE 2RB)'],['22','22 (2WR 2TE 2RB)'],['23','23 (1WR 2TE 2RB)']]} play={play} update={update} placeholder="Personnel" />
            </Field>
            <Field label="Strength">
              <Sel field="strength" options={[['any','Any'],['right','Right'],['left','Left'],['field','Field'],['boundary','Boundary']]} play={play} update={update} placeholder="Any" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Motion">
              <Input value={play.motion || ''} onChange={(e) => update('motion', e.target.value)}
                placeholder="e.g. Jet, Orbit" className="bg-secondary/50 border-0 h-9" />
            </Field>
            <Field label="Direction">
              <Sel field="direction" options={[['any','Any'],['left','Left'],['right','Right'],['middle','Middle']]} play={play} update={update} placeholder="Any" />
            </Field>
          </div>
        </div>

        {/* Install & Difficulty */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Install & Difficulty</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Install Week">
              <Input type="number" min={1} value={play.install_week || ''} onChange={(e) => update('install_week', Number(e.target.value))}
                placeholder="Week #" className="bg-secondary/50 border-0 h-9" />
            </Field>
            <Field label="Install Day">
              <Input type="number" min={1} max={5} value={play.install_day || ''} onChange={(e) => update('install_day', Number(e.target.value))}
                placeholder="Day 1–5" className="bg-secondary/50 border-0 h-9" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age Level">
              <Sel field="age_level_difficulty" options={[['youth','Youth'],['middle_school','Middle School'],['high_school','High School'],['college','College'],['pro','Pro']]} play={play} update={update} placeholder="Select level" />
            </Field>
            <Field label="Risk Level">
              <Sel field="risk_level" options={[['low','Low'],['medium','Medium'],['high','High']]} play={play} update={update} placeholder="Medium" />
            </Field>
          </div>
          <div className="flex gap-2 flex-wrap">
            {play.age_level_difficulty && (
              <Badge className={cn("text-[10px] capitalize", DIFF_COLOR[play.age_level_difficulty])}>{play.age_level_difficulty.replace(/_/g,' ')}</Badge>
            )}
            {play.risk_level && (
              <Badge className={cn("text-[10px] capitalize", RISK_COLOR[play.risk_level])}>Risk: {play.risk_level}</Badge>
            )}
          </div>
        </div>

        {/* Metadata footer */}
        {play.updated_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Clock className="h-3.5 w-3.5" />
            Last updated {format(new Date(play.updated_date), 'MMM d, yyyy h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}