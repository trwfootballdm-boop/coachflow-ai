import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Section({ title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border/70 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-foreground">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const inputClass =
  "h-9 rounded-lg border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/70";

const selectClass =
  "h-9 rounded-lg border-border bg-background/60 text-sm text-foreground";

export default function PlayMetaPanel({ play, onChange }) {
  const update = (patch) => onChange({ ...play, ...patch });

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section
        title="Identity"
        subtitle="Name and quick-call language"
      >
        <Field label="Play name">
          <Input
            value={play.name || play.play_name || ''}
            onChange={(e) =>
              update({ name: e.target.value, play_name: e.target.value })
            }
            className={inputClass}
            placeholder="Inside Zone Left"
          />
        </Field>

        <Field label="Short call">
          <Input
            value={play.short_name || ''}
            onChange={(e) => update({ short_name: e.target.value })}
            className={inputClass}
            placeholder="IZ Left"
          />
        </Field>
      </Section>

      <Section
        title="Structure"
        subtitle="Core play classification"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Side">
            <Select value={play.side || 'offense'} onValueChange={(v) => update({ side: v })}>
              <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="offense">Offense</SelectItem>
                <SelectItem value="defense">Defense</SelectItem>
                <SelectItem value="special_teams">Special teams</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Run / Pass">
            <Select value={play.run_pass || ''} onValueChange={(v) => update({ run_pass: v })}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="run">Run</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="rpo">RPO</SelectItem>
                <SelectItem value="special_teams">Special teams</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Formation">
          <Input
            value={play.formation || ''}
            onChange={(e) => update({ formation: e.target.value })}
            className={inputClass}
            placeholder="Shotgun Trips Right"
          />
        </Field>

        <Field label="Personnel">
          <Input
            value={play.personnel || ''}
            onChange={(e) => update({ personnel: e.target.value })}
            className={inputClass}
            placeholder="11 personnel"
          />
        </Field>
      </Section>

      <Section
        title="Situation"
        subtitle="Usage, concept, and install details"
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Play family">
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
          </Field>
        </div>

        <Field label="Motion">
          <Input
            value={play.motion || ''}
            onChange={(e) => update({ motion: e.target.value })}
            className={inputClass}
            placeholder="Jet, Orbit"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Risk">
            <Select value={play.risk_level || 'medium'} onValueChange={(v) => update({ risk_level: v })}>
              <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Install week">
            <Input
              type="number"
              value={play.install_week || ''}
              onChange={(e) =>
                update({ install_week: parseInt(e.target.value, 10) || null })
              }
              className={inputClass}
              placeholder="1"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Coaching notes"
        subtitle="Teaching points and reminders"
        defaultOpen={false}
      >
        <Field label="Notes">
          <Textarea
            value={play.coaching_points || ''}
            onChange={(e) => update({ coaching_points: e.target.value })}
            className="min-h-[120px] resize-none rounded-lg border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/70"
            placeholder="Key coaching points, reads, landmarks, or install reminders…"
          />
        </Field>
      </Section>
    </div>
  );
}