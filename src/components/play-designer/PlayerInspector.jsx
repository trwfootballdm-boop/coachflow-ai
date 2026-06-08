import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

const POSITIONS_OFFENSE = ['QB','RB','FB','WB','TB','WR','TE','LT','LG','C','RG','RT','H','Z','X','Y'];
const POSITIONS_DEFENSE = ['DE','DT','NT','MLB','ILB','OLB','WB','CB','FS','SS','DB','SAM','WILL','MIKE'];
const POSITIONS_ST = ['K','P','LS','L','R','PR','KR','G'];
const ALL_POSITIONS = [...new Set([...POSITIONS_OFFENSE, ...POSITIONS_DEFENSE, ...POSITIONS_ST])].sort();

const ROLE_TYPES = [
  { value: 'ball_carrier', label: 'Ball Carrier', color: '#fbbf24' },
  { value: 'blocker',      label: 'Blocker',      color: '#fb923c' },
  { value: 'receiver',     label: 'Receiver',     color: '#60a5fa' },
  { value: 'lineman',      label: 'Lineman',      color: '#9ca3af' },
  { value: 'defender',     label: 'Defender',     color: '#f87171' },
  { value: 'kicker',       label: 'Kicker',       color: '#a78bfa' },
  { value: 'returner',     label: 'Returner',     color: '#34d399' },
  { value: 'other',        label: 'Other',        color: '#e5e7eb' },
];

const STANCES = ['two_point', 'three_point', 'four_point', 'upright'];
const FILL_COLORS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899',
  '#06b6d4','#84cc16','#f97316','#6b7280','#1e293b','#fafafa',
];

function Section({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground mb-0.5 block">{label}</label>
      {children}
    </div>
  );
}

export default function PlayerInspector({ player, onUpdate, onDuplicate, onRemove }) {
  if (!player) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-secondary/60 flex items-center justify-center mb-3">
        <span className="text-2xl">🏈</span>
      </div>
      <p className="text-sm font-semibold text-muted-foreground">Select a player</p>
      <p className="text-xs text-muted-foreground/60 mt-1">or click the field to deselect</p>
    </div>
  );

  const upd = (patch) => onUpdate({ ...player, ...patch });
  const role = ROLE_TYPES.find(r => r.value === player.role_type);

  return (
    <div className="space-y-4 p-3">
      {/* Quick identity row */}
      <div className="flex items-center gap-2 p-2 bg-secondary/40 rounded-xl">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ background: role?.color || '#64748b' }}
        >
          {player.display_label || player.position_code || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{player.position_code || 'Unknown'}</p>
          <p className="text-[10px] text-muted-foreground">{player.role_type?.replace(/_/g, ' ') || 'No role'}</p>
        </div>
        <button
          onClick={() => upd({ locked: !player.locked })}
          className={cn("h-6 w-6 flex items-center justify-center rounded transition-colors",
            player.locked ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground hover:bg-secondary")}
          title={player.locked ? "Unlock" : "Lock position"}
        >
          {player.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </button>
      </div>

      <Section label="Identity">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Position">
            <Select value={player.position_code || ''} onValueChange={v => upd({ position_code: v, display_label: player.display_label || v })}>
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-0">
                <SelectValue placeholder="POS" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {ALL_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Label">
            <Input value={player.display_label || ''} onChange={e => upd({ display_label: e.target.value })}
              className="h-7 text-xs bg-secondary/50 border-0" placeholder="e.g. X, 1" maxLength={4} />
          </Field>
          <Field label="Jersey #">
            <Input value={player.jersey_number || ''} onChange={e => upd({ jersey_number: e.target.value })}
              className="h-7 text-xs bg-secondary/50 border-0" placeholder="#" maxLength={3} />
          </Field>
          <Field label="Side">
            <Select value={player.team_side || 'offense'} onValueChange={v => upd({ team_side: v })}>
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offense">Offense</SelectItem>
                <SelectItem value="defense">Defense</SelectItem>
                <SelectItem value="special_teams">ST</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section label="Role & Stance">
        <Field label="Role Type">
          <div className="flex flex-wrap gap-1">
            {ROLE_TYPES.map(r => (
              <button key={r.value} onClick={() => upd({ role_type: r.value })}
                className={cn("px-2 py-0.5 rounded text-[9px] font-bold transition-all border",
                  player.role_type === r.value ? "border-transparent text-white" : "border-border text-muted-foreground bg-secondary/40")}
                style={player.role_type === r.value ? { background: r.color, borderColor: r.color } : {}}>
                {r.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Stance">
          <div className="flex gap-1 flex-wrap">
            {STANCES.map(s => (
              <button key={s} onClick={() => upd({ stance: s })}
                className={cn("px-2 py-0.5 rounded-md text-[9px] font-medium transition-all capitalize",
                  player.stance === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section label="Position (field units)">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <Input type="number" value={Math.round(player.x || 0)} step={5}
              onChange={e => upd({ x: Number(e.target.value) })}
              className="h-7 text-xs bg-secondary/50 border-0 font-mono" />
          </Field>
          <Field label="Y">
            <Input type="number" value={Math.round(player.y || 0)} step={5}
              onChange={e => upd({ y: Number(e.target.value) })}
              className="h-7 text-xs bg-secondary/50 border-0 font-mono" />
          </Field>
        </div>
      </Section>

      <Section label="Visual Style">
        <Field label="Fill Color">
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {FILL_COLORS.map(c => (
              <button key={c} onClick={() => upd({ visual_style: { ...player.visual_style, fill: c } })}
                className={cn("h-5 w-5 rounded-full border-2 transition-all",
                  (player.visual_style?.fill === c) ? "border-white scale-110" : "border-transparent")}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
      </Section>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-7 rounded-lg" onClick={onDuplicate}>
          <Copy className="h-3 w-3" /> Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}