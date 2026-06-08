import React, { useRef, useCallback, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RefreshCw,
  Repeat, Zap, ChevronDown, ChevronRight, Clock, Sparkles, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Event type colors & labels
const EVENT_META = {
  pre_snap_motion: { color: '#a78bfa', label: 'Motion' },
  snap:            { color: '#fbbf24', label: 'Snap' },
  handoff:         { color: '#f97316', label: 'Handoff' },
  mesh:            { color: '#f97316', label: 'Mesh' },
  fake:            { color: '#c084fc', label: 'Fake' },
  route_release:   { color: '#60a5fa', label: 'Release' },
  route_break:     { color: '#34d399', label: 'Break' },
  throw:           { color: '#fde68a', label: 'Throw' },
  catch:           { color: '#4ade80', label: 'Catch' },
  blitz_trigger:   { color: '#f87171', label: 'Blitz' },
  pursuit_start:   { color: '#f87171', label: 'Pursuit' },
  end_state:       { color: '#6b7280', label: 'End' },
  custom_marker:   { color: '#e5e7eb', label: 'Marker' },
};

const PATH_COLORS = {
  pass_route:     '#60a5fa',
  run_path:       '#f59e0b',
  blocking_track: '#fb923c',
  pull_path:      '#fb923c',
  motion_path:    '#a78bfa',
  blitz_path:     '#f87171',
  zone_drop:      '#34d399',
  ball_path:      '#fde68a',
  fake_path:      '#c084fc',
  contain_path:   '#f87171',
  pursuit_path:   '#f87171',
};

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

function formatMs(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Single event marker on the ruler ────────────────────────────────────────
function EventMarker({ event, totalDuration, selectedId, onClick }) {
  const meta = EVENT_META[event.event_type] || EVENT_META.custom_marker;
  const pct = (event.time_ms / totalDuration) * 100;
  const hasPath = !!event.path_id;
  const durPct = hasPath ? ((event.duration_ms || 1000) / totalDuration) * 100 : 0;

  return (
    <div
      className="absolute top-0 h-full"
      style={{ left: `${pct}%`, width: hasPath ? `${durPct}%` : 0, pointerEvents: 'none' }}
    >
      {/* Duration bar */}
      {hasPath && (
        <div
          className="absolute top-3 h-3 rounded-sm opacity-30"
          style={{ width: '100%', background: meta.color }}
        />
      )}
      {/* Event diamond marker */}
      <button
        className="absolute top-0 -translate-x-1/2 group"
        style={{ pointerEvents: 'all' }}
        onClick={e => { e.stopPropagation(); onClick(event); }}
        title={`${meta.label} at ${formatMs(event.time_ms)}`}
      >
        <div
          className={cn(
            "w-3 h-3 rotate-45 border-2 transition-all",
            selectedId === event.event_id
              ? "scale-125 border-white"
              : "border-transparent group-hover:scale-110"
          )}
          style={{ background: meta.color }}
        />
        <span
          className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </button>
    </div>
  );
}

// ─── Player track row ─────────────────────────────────────────────────────────
function TrackRow({ label, events, paths, totalDuration, selectedId, onSelectEvent, color }) {
  return (
    <div className="flex items-center gap-2 h-8">
      <div className="w-16 shrink-0 text-right">
        <span className="text-[9px] font-bold font-mono text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 relative h-full bg-secondary/30 rounded-sm border border-border/30">
        {events.map(evt => {
          const meta = EVENT_META[evt.event_type] || EVENT_META.custom_marker;
          const pct = (evt.time_ms / totalDuration) * 100;
          const durPct = evt.path_id ? Math.max(2, ((evt.duration_ms || 1000) / totalDuration) * 100) : 2;
          return (
            <div
              key={evt.event_id}
              className={cn(
                "absolute top-1 h-6 rounded-sm cursor-pointer transition-all opacity-70 hover:opacity-100 border",
                selectedId === evt.event_id ? "opacity-100 ring-1 ring-white" : ""
              )}
              style={{
                left: `${pct}%`,
                width: `${durPct}%`,
                background: meta.color,
                borderColor: meta.color,
              }}
              onClick={() => onSelectEvent(evt)}
              title={`${meta.label} · ${formatMs(evt.time_ms)} → +${formatMs(evt.duration_ms || 0)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main timeline component ──────────────────────────────────────────────────
export default function AnimationTimeline({
  timeline, players, paths,
  isPlaying, currentTime, speed, isLooping,
  totalDuration, selectedEventId,
  onPlay, onPause, onRestart, onSeek, onStepForward, onStepBack,
  onSetSpeed, onToggleLoop,
  onSelectEvent, onUpdateEvent, onDeleteEvent,
  onAutoGenerate, onSave,
  collapsed, onToggleCollapsed,
}) {
  const rulerRef = useRef(null);

  const handleRulerClick = useCallback((e) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(Math.round(pct * totalDuration));
  }, [totalDuration, onSeek]);

  const playheadPct = (currentTime / totalDuration) * 100;

  // Group events by token_id
  const groupedByPlayer = {};
  const globalEvents = [];
  (timeline?.events || []).forEach(evt => {
    if (evt.token_id) {
      if (!groupedByPlayer[evt.token_id]) groupedByPlayer[evt.token_id] = [];
      groupedByPlayer[evt.token_id].push(evt);
    } else {
      globalEvents.push(evt);
    }
  });

  // Player label lookup
  const playerLabels = {};
  players.forEach(p => { playerLabels[p.token_id] = p.display_label || p.position_code || '?'; });

  return (
    <div className="border-t border-border bg-card/90 backdrop-blur-sm flex flex-col shrink-0">
      {/* ── Collapse toggle ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50">
        <button
          onClick={onToggleCollapsed}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Timeline
        </button>

        {/* Playback controls */}
        <div className="flex items-center gap-0.5 ml-3 bg-secondary/60 rounded-lg p-0.5">
          <button onClick={onRestart} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors" title="Restart">
            <SkipBack className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={onStepBack} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors" title="Step back">
            <span className="text-[9px] font-bold text-muted-foreground">-</span>
          </button>
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-colors mx-0.5"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="h-3.5 w-3.5" />
              : <Play className="h-3.5 w-3.5 translate-x-px" />}
          </button>
          <button onClick={onStepForward} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors" title="Step forward">
            <span className="text-[9px] font-bold text-muted-foreground">+</span>
          </button>
          <button onClick={onRestart} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors" title="Loop">
            <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Loop toggle */}
        <button
          onClick={onToggleLoop}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
            isLooping ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary"
          )}
          title="Toggle loop"
        >
          <Repeat className="h-3.5 w-3.5" />
        </button>

        {/* Speed */}
        <div className="flex items-center bg-secondary/60 rounded-lg p-0.5 gap-0.5">
          {SPEED_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={cn(
                "px-1.5 py-0.5 text-[9px] font-bold rounded transition-all",
                speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Time display */}
        <div className="ml-2 text-[10px] font-mono text-muted-foreground tabular-nums">
          {formatMs(currentTime)} / {formatMs(totalDuration)}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 h-6 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={onAutoGenerate}
          >
            <Sparkles className="h-3 w-3" /> Auto-time
          </Button>
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 h-6 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={onSave}
          >
            <Clock className="h-3 w-3" /> Save timing
          </Button>
        </div>
      </div>

      {/* ── Expanded timeline tracks ── */}
      {!collapsed && (
        <div className="flex flex-col">
          {/* Ruler */}
          <div
            ref={rulerRef}
            className="relative h-7 ml-[4.5rem] mr-2 mb-1 cursor-crosshair"
            onClick={handleRulerClick}
          >
            {/* Ruler ticks */}
            {Array.from({ length: 11 }, (_, i) => {
              const pct = i * 10;
              const ms = (totalDuration / 10) * i;
              return (
                <div key={i} className="absolute top-0 h-full" style={{ left: `${pct}%` }}>
                  <div className="w-px h-3 bg-border/60" />
                  <span className="text-[7px] text-muted-foreground/50 font-mono ml-0.5">{formatMs(ms)}</span>
                </div>
              );
            })}

            {/* Snap marker */}
            {timeline?.snap_time_ms && (
              <div
                className="absolute top-0 h-full border-l-2 border-yellow-400/70 border-dashed"
                style={{ left: `${(timeline.snap_time_ms / totalDuration) * 100}%` }}
              >
                <span className="absolute bottom-0 left-1 text-[7px] font-bold text-yellow-400/70">SNAP</span>
              </div>
            )}

            {/* Global event markers */}
            {globalEvents.map(evt => {
              const meta = EVENT_META[evt.event_type] || EVENT_META.custom_marker;
              const pct = (evt.time_ms / totalDuration) * 100;
              return (
                <div
                  key={evt.event_id}
                  className="absolute top-0 h-full"
                  style={{ left: `${pct}%` }}
                  onClick={e => { e.stopPropagation(); onSelectEvent(evt); }}
                >
                  <div className="w-0.5 h-full opacity-60" style={{ background: meta.color }} />
                  <span className="absolute top-0 left-1 text-[7px] font-bold whitespace-nowrap"
                    style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white/90 pointer-events-none z-10"
              style={{ left: `${playheadPct}%` }}
            >
              <div className="w-2.5 h-2.5 bg-white rounded-full -translate-x-1 -translate-y-0 shadow-md" />
            </div>
          </div>

          {/* Player tracks */}
          <div className="flex flex-col gap-0.5 px-2 pb-2 max-h-36 overflow-y-auto">
            {Object.entries(groupedByPlayer).map(([tokenId, evts]) => (
              <TrackRow
                key={tokenId}
                label={playerLabels[tokenId] || tokenId.slice(0, 4)}
                events={evts}
                paths={paths}
                totalDuration={totalDuration}
                selectedId={selectedEventId}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}