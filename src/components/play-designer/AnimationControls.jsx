import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, RefreshCw, Repeat,
  ChevronRight, ChevronLeft, Sparkles, X, Users, BookOpen,
  Eye, Zap, Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPES } from './AnimationEngine';

const SPEED_OPTIONS = [
  { value: 0.25, label: '¼×' },
  { value: 0.5,  label: '½×' },
  { value: 1,    label: '1×' },
  { value: 1.5,  label: '1.5×' },
  { value: 2,    label: '2×' },
];

const EVENT_COLORS = {
  snap:                 '#facc15',
  pre_snap_motion_start:'#a78bfa',
  pre_snap_motion_end:  '#a78bfa',
  handoff:              '#f59e0b',
  mesh:                 '#f59e0b',
  fake:                 '#c084fc',
  route_release:        '#60a5fa',
  route_break:          '#60a5fa',
  throw:                '#34d399',
  catch:                '#34d399',
  blitz_trigger:        '#f87171',
  pursuit_start:        '#f87171',
  end_state:            '#6b7280',
  custom:               '#e5e7eb',
};

const MODE_ICONS = {
  coach:    { icon: Eye,     label: 'Coach View' },
  player:   { icon: Users,   label: 'Player View' },
  teaching: { icon: BookOpen, label: 'Teaching' },
};

// ─── Event marker on the timeline ruler ──────────────────────────────────────
function EventMarker({ event, totalMs, onSelect, selected }) {
  const pct = totalMs > 0 ? (event.time_ms / totalMs) * 100 : 0;
  const color = EVENT_COLORS[event.event_type] || '#e5e7eb';
  return (
    <button
      title={`${event.event_type.replace(/_/g, ' ')} @ ${(event.time_ms / 1000).toFixed(2)}s`}
      onClick={() => onSelect(event)}
      className="absolute top-0 -translate-x-1/2 flex flex-col items-center group"
      style={{ left: `${pct}%` }}
    >
      <div
        className={cn(
          "w-2 h-4 rounded-sm transition-all",
          selected ? 'opacity-100 scale-125' : 'opacity-70 group-hover:opacity-100'
        )}
        style={{ background: color }}
      />
      <div className="h-px w-px" />
      {selected && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-600 rounded px-1.5 py-0.5 whitespace-nowrap z-10">
          <p className="text-[9px] font-bold text-white">{event.event_type.replace(/_/g, ' ')}</p>
          <p className="text-[9px] text-gray-400">{(event.time_ms / 1000).toFixed(2)}s</p>
        </div>
      )}
    </button>
  );
}

// ─── Timeline track row ───────────────────────────────────────────────────────
function PathTrack({ path, timing, totalMs, currentMs, playerLabel }) {
  if (!timing) return null;
  const startPct = (timing.start_ms / totalMs) * 100;
  const widthPct = (timing.duration_ms / totalMs) * 100;
  const style = {
    run_path:       { bg: '#f59e0b33', border: '#f59e0b', label: 'Run' },
    pass_route:     { bg: '#60a5fa33', border: '#60a5fa', label: 'Route' },
    blocking_track: { bg: '#fb923c33', border: '#fb923c', label: 'Block' },
    pull_path:      { bg: '#fb923c55', border: '#fb923c', label: 'Pull' },
    motion_path:    { bg: '#a78bfa33', border: '#a78bfa', label: 'Motion' },
    blitz_path:     { bg: '#f8717133', border: '#f87171', label: 'Blitz' },
    zone_drop:      { bg: '#34d39933', border: '#34d399', label: 'Zone' },
    ball_path:      { bg: '#fde68a33', border: '#fde68a', label: 'Ball' },
  }[path.path_type] || { bg: '#ffffff1a', border: '#ffffff40', label: path.path_type };

  return (
    <div className="relative h-6 flex items-center">
      {/* Label */}
      <div className="w-20 shrink-0 flex items-center gap-1 pr-2">
        <span className="text-[9px] text-gray-400 truncate">{playerLabel || path.token_id?.slice(0, 3) || '?'}</span>
        <span className="text-[9px] font-bold shrink-0" style={{ color: style.border }}>{style.label}</span>
      </div>
      {/* Track */}
      <div className="flex-1 relative h-4 bg-gray-800 rounded">
        <div
          className="absolute top-0 h-full rounded border"
          style={{
            left: `${startPct}%`,
            width: `${widthPct}%`,
            background: style.bg,
            borderColor: style.border,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main animation controls bar ─────────────────────────────────────────────
export default function AnimationControls({
  timeline,
  currentMs,
  isPlaying,
  speed,
  mode,
  selectedEvent,
  onSeek,
  onPlay,
  onPause,
  onRestart,
  onSetSpeed,
  onSetMode,
  onSelectEvent,
  onAutoGenerate,
  onClose,
  paths = [],
  players = [],
  loop,
  onToggleLoop,
}) {
  const [showTracks, setShowTracks] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const rulerRef = useRef(null);

  const totalMs = timeline?.total_duration_ms || 4000;
  const snapMs = timeline?.snap_time_ms || 800;
  const events = timeline?.events || [];
  const pathTiming = timeline?.path_timing || {};

  const handleRulerClick = useCallback((e) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const rect = ruler.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(pct * totalMs));
  }, [totalMs, onSeek]);

  const stepMs = Math.round(totalMs * 0.05);

  const currentSec = (currentMs / 1000).toFixed(1);
  const totalSec = (totalMs / 1000).toFixed(1);
  const scrubPct = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;
  const snapPct = totalMs > 0 ? (snapMs / totalMs) * 100 : 20;

  // Player label lookup
  const playerMap = {};
  players.forEach(p => { playerMap[p.token_id] = p.display_label || p.position_code || '?'; });

  return (
    <div className="bg-gray-950 border-t border-gray-700 flex flex-col shrink-0 select-none">
      {/* ── Top controls bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
        {/* Mode toggle */}
        <div className="flex items-center bg-gray-800 rounded-lg p-0.5 shrink-0">
          {Object.entries(MODE_ICONS).map(([key, { icon: Icon, label }]) => (
            <button
              key={key}
              title={label}
              onClick={() => onSetMode(key)}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                mode === key ? "bg-gray-600 text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon style={{ width: 13, height: 13 }} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-700 shrink-0" />

        {/* Playback controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            title="Restart"
            onClick={onRestart}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <SkipBack style={{ width: 13, height: 13 }} />
          </button>
          <button
            title="Step back"
            onClick={() => onSeek(Math.max(0, currentMs - stepMs))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <ChevronLeft style={{ width: 13, height: 13 }} />
          </button>
          <button
            title={isPlaying ? 'Pause' : 'Play'}
            onClick={isPlaying ? onPause : onPlay}
            className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            {isPlaying
              ? <Pause style={{ width: 16, height: 16 }} />
              : <Play style={{ width: 16, height: 16 }} />}
          </button>
          <button
            title="Step forward"
            onClick={() => onSeek(Math.min(totalMs, currentMs + stepMs))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
          <button
            title="Loop"
            onClick={onToggleLoop}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all",
              loop ? "text-primary bg-primary/20" : "text-gray-500 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Repeat style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Time display */}
        <div className="text-[11px] font-mono text-gray-400 shrink-0 min-w-[64px] text-center">
          {currentSec}s / {totalSec}s
        </div>

        {/* Snap marker indicator */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-[9px] text-gray-500 font-mono">SNAP {(snapMs / 1000).toFixed(1)}s</span>
        </div>

        <div className="w-px h-5 bg-gray-700 shrink-0" />

        {/* Speed */}
        <div className="flex items-center bg-gray-800 rounded-lg p-0.5 shrink-0">
          {SPEED_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSetSpeed(opt.value)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                speed === opt.value ? "bg-gray-600 text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {/* Auto-generate */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
            onClick={onAutoGenerate}
          >
            <Sparkles style={{ width: 12, height: 12 }} /> Auto Timing
          </Button>

          {/* Tracks toggle */}
          <button
            title="Toggle track view"
            onClick={() => setShowTracks(s => !s)}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all",
              showTracks ? "bg-gray-700 text-white" : "text-gray-500 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Settings2 style={{ width: 13, height: 13 }} />
          </button>

          {/* Close animation */}
          <button
            title="Close animation"
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-800 hover:text-white transition-all"
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Timeline ruler ── */}
      <div className="px-3 py-2">
        <div
          ref={rulerRef}
          className="relative h-8 bg-gray-900 rounded-lg cursor-pointer overflow-hidden border border-gray-800"
          onClick={handleRulerClick}
        >
          {/* Snap line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-yellow-400 opacity-60 z-10"
            style={{ left: `${snapPct}%` }}
          />

          {/* Played region */}
          <div
            className="absolute top-0 bottom-0 bg-primary/10 rounded-l-lg"
            style={{ width: `${scrubPct}%` }}
          />

          {/* Event markers */}
          <div className="absolute inset-0 top-0">
            {events.map(ev => (
              <EventMarker
                key={ev.event_id}
                event={ev}
                totalMs={totalMs}
                onSelect={onSelectEvent}
                selected={selectedEvent?.event_id === ev.event_id}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
            style={{ left: `${scrubPct}%` }}
          >
            <div className="absolute -top-0.5 -left-1.5 w-3 h-3 bg-white rounded-full" />
          </div>

          {/* Time ticks */}
          {Array.from({ length: Math.floor(totalMs / 500) + 1 }).map((_, i) => {
            const ms = i * 500;
            const pct = (ms / totalMs) * 100;
            return (
              <div key={i} className="absolute bottom-0 flex flex-col items-center pointer-events-none"
                style={{ left: `${pct}%` }}>
                <div className="h-1.5 w-px bg-gray-700" />
                {i % 2 === 0 && (
                  <span className="text-[7px] text-gray-600 font-mono leading-none">
                    {(ms / 1000).toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Event editor (when event selected) ── */}
      {selectedEvent && (
        <div className="px-3 pb-2 flex items-center gap-3 border-t border-gray-800 pt-2">
          <div
            className="h-3 w-3 rounded-sm shrink-0"
            style={{ background: EVENT_COLORS[selectedEvent.event_type] || '#e5e7eb' }}
          />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
            {selectedEvent.event_type.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            t = {(selectedEvent.time_ms / 1000).toFixed(2)}s
          </span>
          {selectedEvent.note && (
            <span className="text-[10px] text-gray-500 italic">{selectedEvent.note}</span>
          )}
          {selectedEvent.token_id && (
            <Badge variant="outline" className="text-[9px] border-gray-700 text-gray-400">
              {playerMap[selectedEvent.token_id] || selectedEvent.token_id}
            </Badge>
          )}
          <button onClick={() => onSelectEvent(null)} className="ml-auto text-gray-600 hover:text-gray-400">
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      {/* ── Track view ── */}
      {showTracks && (
        <div className="px-3 pb-2 border-t border-gray-800 pt-2 space-y-0.5 max-h-36 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Path Tracks</p>
          {paths.map((path, i) => (
            <PathTrack
              key={path.path_id || i}
              path={path}
              timing={pathTiming[path.path_id]}
              totalMs={totalMs}
              currentMs={currentMs}
              playerLabel={playerMap[path.token_id]}
            />
          ))}
          {paths.length === 0 && (
            <p className="text-[9px] text-gray-600 italic">No paths in diagram</p>
          )}
        </div>
      )}
    </div>
  );
}