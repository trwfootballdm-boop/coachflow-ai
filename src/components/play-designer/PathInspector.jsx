import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, FlipHorizontal, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const PATH_TYPES = [
  { value: 'pass_route', label: 'Pass Route', color: '#60a5fa', group: 'core' },
  { value: 'run_path', label: 'Run Path', color: '#f59e0b', group: 'core' },
  { value: 'blocking_track', label: 'Block Track', color: '#fb923c', group: 'core' },
  { value: 'motion_path', label: 'Motion', color: '#a78bfa', group: 'core' },
  { value: 'ball_path', label: 'Ball Path', color: '#fde68a', group: 'core' },
  { value: 'pull_path', label: 'Pull Path', color: '#fb923c', group: 'advanced' },
  { value: 'blitz_path', label: 'Blitz', color: '#f87171', group: 'advanced' },
  { value: 'pursuit_path', label: 'Pursuit', color: '#f87171', group: 'advanced' },
  { value: 'zone_drop', label: 'Zone Drop', color: '#34d399', group: 'advanced' },
  { value: 'contain_path', label: 'Contain', color: '#f87171', group: 'advanced' },
  { value: 'fake_path', label: 'Fake', color: '#c084fc', group: 'advanced' },
];

const ARROW_TYPES = ['open', 'filled', 'none', 'flat', 'double'];
const LINE_STYLES = ['solid', 'dashed', 'dotted', 'wavy'];
const CURVE_TYPES = ['straight', 'curved', 'arc'];

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

export default function PathInspector({ path, players, onChange, onRemove, onFlip }) {
  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/50">
          <Route className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">Select a path</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a route, track, or motion path on the field to edit its meaning and styling.
        </p>
      </div>
    );
  }

  const update = (patch) => onChange({ ...path, ...patch });
  const meta = PATH_TYPES.find((item) => item.value === path.path_type);
  const linkedPlayer = players?.find((player) => player.token_id === path.token_id);

  const coreTypes = PATH_TYPES.filter((item) => item.group === 'core');
  const advancedTypes = PATH_TYPES.filter((item) => item.group === 'advanced');

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-2xl border border-border bg-accent/20 p-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${meta?.color || '#64748b'}22`, border: `2px solid ${meta?.color || '#64748b'}` }}
          >
            <div
              className="h-0.5 w-5 rounded"
              style={{ background: meta?.color || '#64748b' }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              {meta?.label || path.path_type}
            </div>
            <div className="text-xs text-muted-foreground">
              {linkedPlayer
                ? `Assigned to ${linkedPlayer.display_label || linkedPlayer.position_code}`
                : 'No linked player'}
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground">
            {path.points?.length || 0} pts
          </div>
        </div>
      </div>

      <Section label="Path Type">
        <div className="grid grid-cols-2 gap-2">
          {coreTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => update({ path_type: item.value })}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[10px] font-semibold transition-colors",
                path.path_type === item.value
                  ? "border-transparent text-white"
                  : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
              )}
              style={path.path_type === item.value ? { background: item.color } : {}}
            >
              <div
                className="h-2 w-4 shrink-0 rounded"
                style={{ background: item.color, opacity: path.path_type === item.value ? 1 : 0.7 }}
              />
              {item.label}
            </button>
          ))}
        </div>

        <Field label="Advanced type">
          <Select
            value={advancedTypes.some((item) => item.value === path.path_type) ? path.path_type : ""}
            onValueChange={(value) => update({ path_type: value })}
          >
            <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
              <SelectValue placeholder="Optional advanced path type" />
            </SelectTrigger>
            <SelectContent>
              {advancedTypes.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section label="Draw Style">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Arrow">
            <Select value={path.arrowhead || 'open'} onValueChange={(value) => update({ arrowhead: value })}>
              <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARROW_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Line">
            <Select value={path.line_style || 'solid'} onValueChange={(value) => update({ line_style: value })}>
              <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINE_STYLES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Curve">
            <Select value={path.curve_type || 'straight'} onValueChange={(value) => update({ curve_type: value })}>
              <SelectTrigger className="h-8 rounded-lg border-border bg-background/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURVE_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Stroke width">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={path.stroke_width || 2.5}
              onChange={(e) => update({ stroke_width: parseFloat(e.target.value) })}
              className="h-1 flex-1 accent-primary"
            />
            <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">
              {path.stroke_width || 2.5}
            </span>
          </div>
        </Field>
      </Section>

      <Section label="Playback">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start (ms)">
            <Input
              type="number"
              step={50}
              value={path.anim_start_ms ?? 1000}
              onChange={(e) => update({ anim_start_ms: Number(e.target.value) })}
              className="h-8 rounded-lg border-border bg-background/60 font-mono text-xs"
            />
          </Field>

          <Field label="Duration (ms)">
            <Input
              type="number"
              step={100}
              value={path.anim_duration_ms ?? 1500}
              onChange={(e) => update({ anim_duration_ms: Number(e.target.value) })}
              className="h-8 rounded-lg border-border bg-background/60 font-mono text-xs"
            />
          </Field>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Snap occurs at {path.snap_time_ms ?? 1000}ms unless overridden.
        </p>
      </Section>

      <div className="flex gap-2 border-t border-border pt-3">
        {onFlip ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
            onClick={onFlip}
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
            Flip
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </div>
    </div>
  );
}