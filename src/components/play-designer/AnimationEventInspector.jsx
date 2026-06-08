import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Clock, Zap, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  'snap', 'pre_snap_motion', 'route_release', 'handoff', 'mesh',
  'fake', 'throw', 'catch', 'blitz_trigger', 'pursuit_start', 'end_state', 'custom',
];

const EVENT_LABELS = {
  snap: 'Snap', pre_snap_motion: 'Pre-Snap Motion', route_release: 'Route Release',
  handoff: 'Handoff', mesh: 'Mesh Point', fake: 'Fake', throw: 'Throw',
  catch: 'Catch', blitz_trigger: 'Blitz Trigger', pursuit_start: 'Pursuit Start',
  end_state: 'End State', custom: 'Custom Marker',
};

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min = 0, max, step = 50, suffix = '' }) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="h-7 text-xs font-mono"
      />
      {suffix && <span className="text-[10px] text-muted-foreground shrink-0">{suffix}</span>}
    </div>
  );
}

export default function AnimationEventInspector({
  event,
  diagram,
  timeline,
  onUpdateEvent,
  onClose,
}) {
  if (!event) return null;

  const players = diagram?.players || [];
  const paths = diagram?.paths || [];

  const update = (patch) => {
    if (!onUpdateEvent || !timeline) return;
    const updatedEvents = timeline.events.map(e =>
      e.event_id === event.event_id ? { ...e, ...patch } : e
    );
    onUpdateEvent({ ...timeline, events: updatedEvents });
  };

  const duration = event.end_ms !== undefined ? event.end_ms - event.time_ms : 0;

  return (
    <div className="bg-card border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-bold">Event</span>
        </div>
        <button
          onClick={onClose}
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Event type */}
        <Field label="Event Type">
          <Select value={event.event_type} onValueChange={v => update({ event_type: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{EVENT_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Label */}
        <Field label="Display Label">
          <Input
            value={event.label || ''}
            onChange={e => update({ label: e.target.value })}
            placeholder="Optional label…"
            className="h-7 text-xs"
          />
        </Field>

        {/* Timing */}
        <div className="border border-border rounded-lg p-2.5 space-y-2.5 bg-secondary/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Timing</span>
          </div>

          <Field label="Start Time (ms)">
            <NumInput
              value={event.time_ms}
              onChange={v => {
                const patch = { time_ms: v };
                if (event.end_ms !== undefined) patch.end_ms = v + duration;
                update(patch);
              }}
              min={0}
              max={timeline?.totalDuration || 10000}
              step={50}
              suffix="ms"
            />
          </Field>

          {event.end_ms !== undefined && (
            <Field label="Duration (ms)">
              <NumInput
                value={duration}
                onChange={v => update({ end_ms: event.time_ms + v })}
                min={100}
                max={5000}
                step={50}
                suffix="ms"
              />
            </Field>
          )}

          <Field label="Delay before start (ms)">
            <NumInput
              value={event.delay_ms || 0}
              onChange={v => update({ delay_ms: v })}
              min={0}
              max={3000}
              step={50}
              suffix="ms"
            />
          </Field>
        </div>

        {/* Linked player */}
        <Field label="Linked Player">
          <Select
            value={event.token_id || '__none__'}
            onValueChange={v => update({ token_id: v === '__none__' ? null : v })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {players.map(p => (
                <SelectItem key={p.token_id} value={p.token_id}>
                  {p.display_label || p.position_code} {p.jersey_number ? `#${p.jersey_number}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Linked path */}
        {paths.length > 0 && (
          <Field label="Linked Path">
            <Select
              value={event.path_id || '__none__'}
              onValueChange={v => update({ path_id: v === '__none__' ? null : v })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {paths.map((p, i) => (
                  <SelectItem key={p.path_id || i} value={p.path_id || String(i)}>
                    {p.path_type?.replace(/_/g, ' ')} {p.token_id ? `· ${players.find(pl => pl.token_id === p.token_id)?.display_label || ''}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {/* System event note */}
        {event.is_system && (
          <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded-lg p-2 leading-relaxed">
            This is a system event. Changing its timing will shift all path events that reference the snap.
          </div>
        )}

        {event.is_auto && (
          <div className="text-[10px] text-muted-foreground/70 leading-relaxed">
            Auto-generated. Edit timing above to fine-tune.
          </div>
        )}
      </div>
    </div>
  );
}