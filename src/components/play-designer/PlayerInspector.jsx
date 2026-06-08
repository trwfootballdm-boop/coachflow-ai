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
  { value: 'blocker', label: 'Blocker', color: '#fb923c' },
  { value: 'receiver', label: 'Receiver', color: '#60a5fa' },
  { value: 'lineman', label: 'Lineman', color: '#9ca3af' },
  { value: 'defender', label: 'Defender', color: '#f87171' },
  { value: 'kicker', label: 'Kicker', color: '#a78bfa' },
  { value: 'returner', label: 'Returner', color: '#34d399' },
  { value: 'other', label: 'Other', color: '#cbd5e1' },
];

const STANCES = ['two_point', 'three_point', 'four_point', 'upright'];
const FILL_COLORS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899',
  '#06b6d4','#84cc16','#f97316','#6b7280','#1e293b','#fafafa',
];

function Section({ label, children }) {
  return (
    <section className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function PlayerInspector({ player, onChange, onDuplicate, onRemove }) {
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/50">
          <span className="text-2xl">🏈</span>
        </div>
        <p className="text-sm font-semibold text-foreground">Select a player</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a player token on the field to edit identity, role, and placement.
        </p>
      </div>
    );
  }

  const update = (patch) => onChange({ ...player, ...patch });
  const role = ROLE_TYPES.find((r) => r.value === player.role_type);

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-2xl border border-border bg-accent/20 p-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
            style={{ background: role?.color || '#64748b' }}
          >
            {player.display_label || player.position_code || '?'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              {player.position_code || 'Unknown position'}
            </div>
            <div className="text-xs text-muted-foreground">
              {(player.role_type || 'other').replace(/_/g, ' ')}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ locked: !player.locked })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                  player.locked
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {player.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {player.locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Section label="Identity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position">
            <Select
              value={player.position_code || ''}
              onValueChange={(value) =>
                update({
                  position_code: value,
                  display_label: player.display_label || value,
                })
              }
            >
              <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
                <SelectValue placeholder="POS" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {ALL_POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Label">
            <Input
              value={player.display_label || ''}
              onChange={(e) => update({ display_label: e.target.value })}
              className="h-8 rounded-lg border-border bg-background/60 text-xs"
              placeholder="X, Y, 1"
              maxLength={4}
            />
          </Field>

          <Field label="Jersey #">
            <Input
              value={player.jersey_number || ''}
              onChange={(e) => update({ jersey_number: e.target.value })}
              className="h-8 rounded-lg border-border bg-background/60 text-xs"
              placeholder="#"
              maxLength={3}
            />
          </Field>

          <Field label="Side">
            <Select value={player.team_side || 'offense'} onValueChange={(value) => update({ team_side: value })}>
              <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offense">Offense</SelectItem>
                <SelectItem value="defense">Defense</SelectItem>
                <SelectItem value="special_teams">Special teams</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section label="Assignment">
        <Field label="Role type">
          <div className="flex flex-wrap gap-1.5">
            {ROLE_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => update({ role_type: item.value })}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors",
                  player.role_type === item.value
                    ? "text-white border-transparent"
                    : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
                )}
                style={player.role_type === item.value ? { background: item.color } : {}}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Stance">
          <div className="flex flex-wrap gap-1.5">
            {STANCES.map((stance) => (
              <button
                key={stance}
                type="button"
                onClick={() => update({ stance })}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors capitalize",
                  player.stance === stance
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {stance.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section label="Placement">
        <div className="grid grid-cols-2 gap-3">
          <Field label="X">
            <Input
              type="number"
              value={Math.round(player.x || 0)}
              onChange={(e) => update({ x: Number(e.target.value) })}
              className="h-8 rounded-lg border-border bg-background/60 font-mono text-xs"
            />
          </Field>

          <Field label="Y">
            <Input
              type="number"
              value={Math.round(player.y || 0)}
              onChange={(e) => update({ y: Number(e.target.value) })}
              className="h-8 rounded-lg border-border bg-background/60 font-mono text-xs"
            />
          </Field>
        </div>
      </Section>

      <Section label="Style">
        <Field label="Fill color">
          <div className="flex flex-wrap gap-2">
            {FILL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  update({
                    visual_style: { ...player.visual_style, fill: color },
                  })
                }
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  player.visual_style?.fill === color
                    ? "scale-110 border-foreground"
                    : "border-transparent"
                )}
                style={{ background: color }}
                aria-label={`Set fill color ${color}`}
              />
            ))}
          </div>
        </Field>
      </Section>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
          onClick={onDuplicate}
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}