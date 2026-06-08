import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Clock, Zap, Move, Minus, Plus } from 'lucide-react';

const EVENT_COLORS = {
  snap:             '#fde68a',
  pre_snap_motion:  '#a78bfa',
  route_release:    '#60a5fa',
  handoff:          '#fbbf24',
  mesh:             '#fbbf24',
  fake:             '#c084fc',
  throw:            '#34d399',
  catch:            '#34d399',
  blitz_trigger:    '#f87171',
  pursuit_start:    '#f87171',
  end_state:        '#9ca3af',
  custom:           '#e5e7eb',
};

const PATH_COLORS = {
  run_path:       '#f59e0b',
  pass_route:     '#60a5fa',
  blocking_track: '#fb923c',
  pull_path:      '#fb923c',
  motion_path:    '#a78bfa',
  blitz_path:     '#f87171',
  pursuit_path:   '#f87171',
  zone_drop:      '#34d399',
  contain_path:   '#f87171',
  ball_path:      '#fde68a',
  fake_path:      '#c084fc',
};

const EVENT_TYPE_LABELS = {
  snap: 'Snap', pre_snap_motion: 'Motion', route_release: 'Release',
  handoff: 'Handoff', mesh: 'Mesh', fake: 'Fake', throw: 'Throw',
  catch: 'Catch', blitz_trigger: 'Blitz', pursuit_start: 'Pursuit',
  end_state: 'End', custom: 'Marker',
};

function fmtMs(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Single event pill on the timeline track ───────────────────────────────────
function EventPill({ event, totalDuration, pxPerMs, selected, onSelect, onUpdateTime }) {
  const dragRef = useRef(null);
  const left = (event.time_ms / totalDuration) * 100;
  const width = event.end_ms
    ? ((event.end_ms - event.time_ms) / totalDuration) * 100
    : 0;
  const color = EVENT_COLORS[event.event_type] || '#e5e7eb';
  const pathColor = event.path_type ? (PATH_COLORS[event.path_type] || color) : color;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(event);
    const startX = e.clientX;
    const startMs = event.time_ms;
    const track = e.currentTarget.closest('[data-timeline-track]');
    const trackW = track?.getBoundingClientRect().width || 800;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dMs = (dx / trackW) * totalDuration;
      const newMs = Math.max(0, Math.min(totalDuration - 50, startMs + dMs));
      onUpdateTime(event.event_id, Math.round(newMs));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing flex items-center overflow-hidden group",
        "border transition-all",
        selected ? "border-white/60 z-10" : "border-transparent hover:border-white/30 z-0"
      )}
      style={{
        left: `${left}%`,
        width: width > 0 ? `${Math.max(width, 2)}%` : undefined,
        minWidth: width > 0 ? undefined : '4px',
        backgroundColor: event.end_ms ? pathColor + '30' : 'transparent',
      }}
      onMouseDown={handleMouseDown}
      title={`${EVENT_TYPE_LABELS[event.event_type] || event.event_type} · ${fmtMs(event.time_ms)}`}
    >
      {/* Start marker */}
      <div
        className="h-full shrink-0"
        style={{ width: 3, backgroundColor: pathColor, borderRadius: 2 }}
      />
      {/* Label */}
      {width > 4 && (
        <span className="text-[8px] font-bold px-1 truncate text-white/80 leading-none">
          {event.label || EVENT_TYPE_LABELS[event.event_type] || ''}
        </span>
      )}
    </div>
  );
}

// ── Player row with its events ────────────────────────────────────────────────
function PlayerTrack({ tokenId, label, events, totalDuration, currentMs, selectedEventId, onSelectEvent, onUpdateEventTime }) {
  return (
    <div className="flex items-stretch min-h-[28px] group">
      {/* Row label */}
      <div className="w-20 shrink-0 pr-2 flex items-center justify-end">
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>

      {/* Track area */}
      <div
        className="flex-1 relative bg-secondary/20 rounded border border-border/30 hover:bg-secondary/30 transition-colors"
        data-timeline-track
      >
        {events.map(event => (
          <EventPill
            key={event.event_id}
            event={event}
            totalDuration={totalDuration}
            selected={selectedEventId === event.event_id}
            onSelect={onSelectEvent}
            onUpdateTime={onUpdateEventTime}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main timeline panel ───────────────────────────────────────────────────────
export default function AnimationTimeline({
  timeline,
  diagram,
  currentMs,
  totalDuration,
  selectedEvent,
  onSelectEvent,
  onUpdateEvent,
  onSeek,
  isExpanded,
  onToggleExpand,
}) {
  const trackRef = useRef(null);

  const handleTrackClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    onSeek(pct * totalDuration);
  }, [totalDuration, onSeek]);

  const updateEventTime = useCallback((eventId, newMs) => {
    if (!timeline || !onUpdateEvent) return;
    const updated = {
      ...timeline,
      events: timeline.events.map(e =>
        e.event_id === eventId ? { ...e, time_ms: newMs } : e
      ),
    };
    onUpdateEvent(updated);
  }, [timeline, onUpdateEvent]);

  if (!timeline) return null;

  const events = timeline.events || [];
  const players = diagram?.players || [];
  const paths = diagram?.paths || [];

  // Group events: system events + per player/path events
  const systemEvents = events.filter(e => e.is_system || !e.token_id);
  const pathEvents = events.filter(e => e.path_id && e.end_ms !== undefined);

  // Build tracks grouped by player
  const playerTracks = players.map(player => {
    const playerEvents = pathEvents.filter(e => e.token_id === player.token_id);
    return {
      tokenId: player.token_id,
      label: player.display_label || player.position_code || '?',
      events: playerEvents,
    };
  }).filter(t => t.events.length > 0);

  // Misc path events not tied to a player
  const orphanPathEvents = pathEvents.filter(e => !e.token_id);

  const pct = totalDuration > 0 ? (currentMs / totalDuration) * 100 : 0;

  return (
    <div className={cn(
      "border-t border-border bg-card/80 backdrop-blur-sm flex flex-col transition-all duration-200",
      isExpanded ? "h-48" : "h-8"
    )}>
      {/* ── Collapse toggle + label ── */}
      <div
        className="flex items-center gap-2 px-3 h-8 shrink-0 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={onToggleExpand}
      >
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Timeline
        </span>
        {events.length > 0 && (
          <span className="text-[9px] text-muted-foreground/60 font-mono">
            {events.length} events · {fmtMs(totalDuration)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selectedEvent && (
            <span className="text-[9px] text-primary font-semibold">
              {EVENT_TYPE_LABELS[selectedEvent.event_type]} @ {fmtMs(selectedEvent.time_ms)}
            </span>
          )}
          <div className={cn("h-3.5 w-3.5 flex items-center justify-center rounded text-muted-foreground transition-transform",
            isExpanded ? "rotate-180" : "")}>
            <svg viewBox="0 0 10 6" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M1 1l4 4 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2 pt-0 gap-1.5">
          {/* ── Time ruler ── */}
          <div className="flex items-stretch relative" ref={trackRef}>
            <div className="w-20 shrink-0" />
            <div
              className="flex-1 relative h-5 cursor-pointer"
              onClick={handleTrackClick}
              data-timeline-track
            >
              {/* Ruler ticks */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 11 }, (_, i) => (
                  <div key={i} className="flex-1 border-l border-border/40 relative">
                    <span className="absolute top-0 left-0.5 text-[7px] text-muted-foreground/40 font-mono leading-none">
                      {fmtMs((i / 10) * totalDuration)}
                    </span>
                  </div>
                ))}
              </div>

              {/* System event markers on ruler */}
              {systemEvents.map(e => (
                <div
                  key={e.event_id}
                  className="absolute top-0 bottom-0 flex flex-col items-center cursor-pointer group"
                  style={{ left: `${(e.time_ms / totalDuration) * 100}%` }}
                  onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e); }}
                  title={`${EVENT_TYPE_LABELS[e.event_type]} @ ${fmtMs(e.time_ms)}`}
                >
                  <div className="w-px h-full"
                    style={{ backgroundColor: EVENT_COLORS[e.event_type] || '#fff', opacity: 0.6 }} />
                  <div className="absolute top-1 text-[7px] font-bold whitespace-nowrap -translate-x-1/2 px-0.5 rounded"
                    style={{ color: EVENT_COLORS[e.event_type] || '#fff', opacity: 0.8 }}>
                    {EVENT_TYPE_LABELS[e.event_type]}
                  </div>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-20 pointer-events-none"
                style={{ left: `${pct}%` }}
              >
                <div className="absolute -top-0.5 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '5px solid rgba(255,255,255,0.8)',
                  }} />
              </div>
            </div>
          </div>

          {/* ── Player tracks ── */}
          <div className="flex-1 overflow-y-auto space-y-1 relative" onClick={handleTrackClick} data-timeline-track>
            {playerTracks.map(track => (
              <PlayerTrack
                key={track.tokenId}
                {...track}
                totalDuration={totalDuration}
                currentMs={currentMs}
                selectedEventId={selectedEvent?.event_id}
                onSelectEvent={onSelectEvent}
                onUpdateEventTime={updateEventTime}
              />
            ))}
            {orphanPathEvents.length > 0 && (
              <PlayerTrack
                tokenId="misc"
                label="Other"
                events={orphanPathEvents}
                totalDuration={totalDuration}
                currentMs={currentMs}
                selectedEventId={selectedEvent?.event_id}
                onSelectEvent={onSelectEvent}
                onUpdateEventTime={updateEventTime}
              />
            )}
            {playerTracks.length === 0 && orphanPathEvents.length === 0 && (
              <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground/40">
                Auto-generate timing to populate tracks
              </div>
            )}

            {/* Playhead overlay */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/30 z-10 pointer-events-none"
              style={{ left: `calc(80px + ${pct}% * (100% - 80px) / 100)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}