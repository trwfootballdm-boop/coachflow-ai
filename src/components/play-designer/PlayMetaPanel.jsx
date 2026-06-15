import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminology } from "@/lib/useTerminology";

// Suggestion chips rendered below an input. Clicking a chip fills the field.
function SuggestionChips({ value, onPick, suggestions = [] }) {
  const filtered = (suggestions || []).filter(
    (s) => s && s.toLowerCase() !== String(value || '').toLowerCase()
  );
  if (filtered.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {filtered.slice(0, 10).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="text-[11px] px-2 py-0.5 rounded-full bg-muted hover:bg-primary/15 hover:text-primary transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        <div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClass =
  "h-9 rounded-lg border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/70";

const selectClass =
  "h-9 rounded-lg border-border bg-background/60 text-sm text-foreground";

export default function PlayMetaPanel({ play, onChange }) {
  const update = (patch) => onChange({ ...play, ...patch });
  const { values: term } = useTerminology();

  return (
    <div className="divide-y divide-border/50">
      <Section title="Identity" defaultOpen>
        <Field label="Play Name">
          <Input
            value={play.name || play.play_name || ''}
            onChange={(e) => update({ name: e.target.value, play_name: e.target.value })}
            className={inputClass}
            placeholder="Inside Zone Left"
          />
        </Field>
        <Field label="Short Name / Call">
          <Input
            value={play.short_name || ''}
            onChange={(e) => update({ short_name: e.target.value })}
            className={inputClass}
            placeholder="IZ Left"
          />
        </Field>
        <Field label="Side">
          <Select value={play.side || ''} onValueChange={(v) => update({ side: v })}>
            <SelectTrigger className={selectClass}><SelectValue placeholder="Side" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="offense">Offense</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
              <SelectItem value="special_teams">Special teams</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Run / Pass">
          <Select value={play.run_pass || ''} onValueChange={(v) => update({ run_pass: v })}>
            <SelectTrigger className={selectClass}><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="run">Run</SelectItem>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="rpo">RPO</SelectItem>
              <SelectItem value="special_teams">Special teams</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Formation & Personnel" defaultOpen>
        <Field label="Formation">
          <Input
            value={play.formation || ''}
            onChange={(e) => update({ formation: e.target.value })}
            className={inputClass}
            placeholder="Shotgun Trips Right"
          />
          <SuggestionChips
            value={play.formation}
            onPick={(v) => update({ formation: v })}
            suggestions={term.formation_tag}
          />
        </Field>
        <Field label="Personnel">
          <Input
            value={play.personnel || ''}
            onChange={(e) => update({ personnel: e.target.value })}
            className={inputClass}
            placeholder="11 personnel"
          />
          <SuggestionChips
            value={play.personnel}
            onPick={(v) => update({ personnel: v })}
            suggestions={term.personnel}
          />
        </Field>
      </Section>

      <Section title="Concept & Motion" defaultOpen={false}>
        <Field label="Play Family">
          <Input
            value={play.play_family || ''}
            onChange={(e) => update({ play_family: e.target.value })}
            className={inputClass}
            placeholder="Zone, Power, Mesh"
          />
        </Field>
        <Field label="Concept">
          <Input
            value={play.concept || ''}
            onChange={(e) => update({ concept: e.target.value })}
            className={inputClass}
            placeholder="Inside Zone"
          />
          <SuggestionChips
            value={play.concept}
            onPick={(v) => update({ concept: v })}
            suggestions={term.concept}
          />
        </Field>
        <Field label="Motion">
          <Input
            value={play.motion || ''}
            onChange={(e) => update({ motion: e.target.value })}
            className={inputClass}
            placeholder="Jet, Orbit"
          />
          <SuggestionChips
            value={play.motion}
            onPick={(v) => update({ motion: v })}
            suggestions={term.motion}
          />
        </Field>
      </Section>

      <Section title="Direction & Risk" defaultOpen={false}>
        <Field label="Direction">
          <Select value={play.direction || 'any'} onValueChange={(v) => update({ direction: v })}>
            <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['left', 'right', 'middle', 'any'].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Strength">
          <Select value={play.strength || 'any'} onValueChange={(v) => update({ strength: v })}>
            <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['left', 'right', 'field', 'boundary', 'any'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Risk Level">
          <Select value={play.risk_level || 'medium'} onValueChange={(v) => update({ risk_level: v })}>
            <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Install Week">
          <Input
            type="number"
            value={play.install_week || ''}
            onChange={(e) => update({ install_week: parseInt(e.target.value, 10) || null })}
            className={inputClass}
            placeholder="1"
          />
        </Field>
      </Section>
    </div>
  );
}