import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const PATH_TYPES = [
  { value: 'pass_route',     label: 'Pass Route',    color: '#60a5fa' },
  { value: 'run_path',       label: 'Run Path',      color: '#f59e0b' },
  { value: 'blocking_track', label: 'Block Track',   color: '#fb923c' },
  { value: 'pull_path',      label: 'Pull Path',     color: '#fb923c' },
  { value: 'motion_path',    label: 'Motion',        color: '#a78bfa' },
  { value: 'blitz_path',     label: 'Blitz',         color: '#f87171' },
  { value: 'pursuit_path',   label: 'Pursuit',       color: '#f87171' },
  { value: 'zone_drop',      label: 'Zone Drop',     color: '#34d399' },
  { value: 'contain_path',   label: 'Contain',       color: '#f87171' },
  { value: 'ball_path',      label: 'Ball Path',     color: '#fde68a' },
  { value: 'fake_path',      label: 'Fake',          color: '#c084fc' },
];

const ARROW_TYPES = ['open', 'filled', 'none', 'flat', 'double'];
const LINE_STYLES = ['solid', 'dashed', 'dotted', 'wavy'];
const CURVE_TYPES = ['straight', 'curved', 'arc'];

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

export default function PathInspector({ path, players, onUpdate, onRemove, onFlip }) {
  if (!path) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-secondary/60 flex items-center justify-center mb-3">
        <span className="text-xl">↗</span>
      </div>
      <p className="text-sm font-semibold text-muted-foreground">Select a path</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Click a route or block path on the field</p>
    </div>
  );

  const upd = (patch) => onUpdate({ ...path, ...patch });
  const meta = PATH_TYPES.find(p => p.value === path.path_type);
  const linkedPlayer = players?.find(p => p.token_id === path.token_id);

  return (
    <div className="space-y-4 p-3">
      {/* Quick identity */}
      <div className="flex items-center gap-2 p-2 bg-secondary/40 rounded-xl">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: meta?.color + '30', border: `2px solid ${meta?.color}` }}
        >
          <div className="w-5 h-0.5 rounded" style={{ background: meta?.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{meta?.label || path.path_type}</p>
          {linkedPlayer && (
            <p className="text-[10px] text-muted-foreground">
              {linkedPlayer.display_label || linkedPlayer.position_code}
            </p>
          )}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40">{path.points?.length || 0} pts</span>
      </div>

      <Section label="Path Type">
        <div className="grid grid-cols-2 gap-1">
          {PATH_TYPES.map(pt => (
            <button key={pt.value} onClick={() => upd({ path_type: pt.value })}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all border text-left",
                path.path_type === pt.value
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground bg-secondary/30 hover:bg-secondary/60"
              )}
              style={path.path_type === pt.value ? { background: pt.color } : {}}
            >
              <div className="h-2 w-4 rounded shrink-0" style={{ background: pt.color, opacity: path.path_type === pt.value ? 1 : 0.5 }} />
              {pt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Appearance">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Arrow">
            <Select value={path.arrowhead || 'open'} onValueChange={v => upd({ arrowhead: v })}>
              <SelectTrigger className="h-7 text-[10px] bg-secondary/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARROW_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Line">
            <Select value={path.line_style || 'solid'} onValueChange={v => upd({ line_style: v })}>
              <SelectTrigger className="h-7 text-[10px] bg-secondary/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINE_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Curve">
            <Select value={path.curve_type || 'straight'} onValueChange={v => upd({ curve_type: v })}>
              <SelectTrigger className="h-7 text-[10px] bg-secondary/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURVE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Stroke Width">
          <div className="flex items-center gap-2">
            <input type="range" min={1} max={6} step={0.5}
              value={path.stroke_width || 2.5}
              onChange={e => upd({ stroke_width: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-primary" />
            <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{path.stroke_width || 2.5}</span>
          </div>
        </Field>
      </Section>

      <Section label="Animation Timing">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start (ms)">
            <Input type="number" step={50}
              value={path.anim_start_ms ?? 1000}
              onChange={e => upd({ anim_start_ms: Number(e.target.value) })}
              className="h-7 text-xs bg-secondary/50 border-0 font-mono" />
          </Field>
          <Field label="Duration (ms)">
            <Input type="number" step={100}
              value={path.anim_duration_ms ?? 1500}
              onChange={e => upd({ anim_duration_ms: Number(e.target.value) })}
              className="h-7 text-xs bg-secondary/50 border-0 font-mono" />
          </Field>
        </div>
        <p className="text-[9px] text-muted-foreground/60">
          Snap is at {path.snap_time_ms ?? 1000}ms by default
        </p>
      </Section>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border">
        {onFlip && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-7 rounded-lg" onClick={onFlip}>
            <FlipHorizontal className="h-3 w-3" /> Flip
          </Button>
        )}
        <Button variant="ghost" size="sm"
          className="gap-1.5 text-xs h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}>
          <Trash2 className="h-3 w-3" /> Remove
        </Button>
      </div>
    </div>
  );
}