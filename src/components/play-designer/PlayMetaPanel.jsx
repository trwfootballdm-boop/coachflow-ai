import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-[10px] text-gray-500 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

const inputClass = "h-7 text-xs bg-gray-800 border-gray-700 text-white placeholder-gray-600";
const selClass   = "h-7 text-xs bg-gray-800 border-gray-700 text-white";

export default function PlayMetaPanel({ play, onChange }) {
  const u = (patch) => onChange({ ...play, ...patch });

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Identity">
        <Field label="Play Name">
          <Input value={play.name || play.play_name || ''} onChange={e => u({ name: e.target.value, play_name: e.target.value })}
            className={inputClass} placeholder="Inside Zone Left" />
        </Field>
        <Field label="Short Call">
          <Input value={play.short_name || ''} onChange={e => u({ short_name: e.target.value })}
            className={inputClass} placeholder="IZL" />
        </Field>
        <Field label="Formation">
          <Input value={play.formation || ''} onChange={e => u({ formation: e.target.value })}
            className={inputClass} placeholder="Shotgun Trips Right" />
        </Field>
        <Field label="Personnel">
          <Input value={play.personnel || ''} onChange={e => u({ personnel: e.target.value })}
            className={inputClass} placeholder="11, 12, 21…" />
        </Field>
      </Section>

      <Section title="Category">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Side">
            <Select value={play.side || 'offense'} onValueChange={v => u({ side: v })}>
              <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="offense">Offense</SelectItem>
                <SelectItem value="defense">Defense</SelectItem>
                <SelectItem value="special_teams">Special Teams</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Run/Pass">
            <Select value={play.run_pass || ''} onValueChange={v => u({ run_pass: v })}>
              <SelectTrigger className={selClass}><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="run">Run</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="rpo">RPO</SelectItem>
                <SelectItem value="special_teams">Special Teams</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Play Family">
            <Input value={play.play_family || ''} onChange={e => u({ play_family: e.target.value })}
              className={inputClass} placeholder="Zone, Power, Mesh…" />
          </Field>
          <Field label="Concept">
            <Input value={play.concept || ''} onChange={e => u({ concept: e.target.value })}
              className={inputClass} placeholder="Inside Zone" />
          </Field>
        </div>
      </Section>

      <Section title="Situational" defaultOpen={false}>
        <Field label="Motion">
          <Input value={play.motion || ''} onChange={e => u({ motion: e.target.value })}
            className={inputClass} placeholder="Jet, Orbit…" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Direction">
            <Select value={play.direction || 'any'} onValueChange={v => u({ direction: v })}>
              <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                {['left','right','middle','any'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Strength">
            <Select value={play.strength || 'any'} onValueChange={v => u({ strength: v })}>
              <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                {['left','right','field','boundary','any'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Risk">
            <Select value={play.risk_level || 'medium'} onValueChange={v => u({ risk_level: v })}>
              <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Install Week">
            <Input type="number" value={play.install_week || ''} onChange={e => u({ install_week: parseInt(e.target.value, 10) || null })}
              className={inputClass} placeholder="1" />
          </Field>
        </div>
      </Section>

      <Section title="Coaching Notes" defaultOpen={false}>
        <Textarea value={play.coaching_points || ''} onChange={e => u({ coaching_points: e.target.value })}
          className="text-xs bg-gray-800 border-gray-700 text-white placeholder-gray-600 min-h-[80px] resize-none"
          placeholder="Key coaching points…" />
      </Section>
    </div>
  );
}