import React from 'react';
import {
  Play, Pause, RotateCcw, SkipBack, SkipForward,
  Repeat, Zap, Ghost, Footprints, Wand2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const SPEED_LABELS = { 0.25: '¼×', 0.5: '½×', 1: '1×', 1.5: '1.5×', 2: '2×' };

const MODES = [
  { value: 'coach',    label: 'Coach',   desc: 'All routes + coaching annotations' },
  { value: 'player',   label: 'Player',  desc: 'Simplified — jersey numbers shown' },
  { value: 'teaching', label: 'Teach',   desc: 'Highlighted single player focus' },
];

export default function AnimationControls({
  isPlaying,
  currentMs,
  totalDuration,
  speed,
  loop,
  animMode,
  showTrails,
  showGhost,
  hasDiagram,
  // handlers
  onPlay,
  onPause,
  onRestart,
  onStepBack,
  onStepForward,
  onSeek,
  onSetSpeed,
  onToggleLoop,
  onSetMode,
  onToggleTrails,
  onToggleGhost,
  onAutoGenerate,
  onResetTimeline,
}) {
  const pct = totalDuration > 0 ? (currentMs / totalDuration) * 100 : 0;
  const fmtTime = (ms) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="flex items-center gap-1 h-full px-2 flex-wrap">
      {/* ── Playback controls ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onRestart}
          disabled={!hasDiagram}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-secondary",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title="Restart"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onStepBack}
          disabled={!hasDiagram}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-secondary",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title="Step Back"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        {/* Play/Pause — main button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasDiagram}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-lg transition-all shrink-0",
            isPlaying
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title={isPlaying ? 'Pause' : 'Play animation'}
        >
          {isPlaying
            ? <Pause className="h-4 w-4 fill-current" />
            : <Play className="h-4 w-4 fill-current translate-x-px" />}
        </button>

        <button
          onClick={onStepForward}
          disabled={!hasDiagram}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-secondary",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title="Step Forward"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Timeline scrubber ── */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[120px] max-w-xs">
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right shrink-0">
          {fmtTime(currentMs)}
        </span>
        <div className="relative flex-1 h-2 group">
          <div className="absolute inset-0 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/40 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentMs}
            step={50}
            onChange={e => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            disabled={!hasDiagram}
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background shadow-sm pointer-events-none transition-all"
            style={{ left: `calc(${pct}% - 7px)` }}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">
          {fmtTime(totalDuration)}
        </span>
      </div>

      {/* ── Speed selector ── */}
      <div className="flex items-center bg-secondary/60 rounded-md p-0.5 shrink-0">
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded transition-all",
              speed === s
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {SPEED_LABELS[s]}
          </button>
        ))}
      </div>

      {/* ── Loop ── */}
      <button
        onClick={onToggleLoop}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-md transition-all",
          loop ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        title="Loop"
      >
        <Repeat className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* ── Animation mode ── */}
      <div className="flex items-center bg-secondary/60 rounded-md p-0.5 shrink-0">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => onSetMode(m.value)}
            title={m.desc}
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded transition-all",
              animMode === m.value
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* ── Visual toggles ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onToggleTrails}
          className={cn(
            "h-7 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all",
            showTrails ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
          )}
          title="Path trails"
        >
          <Footprints className="h-3 w-3" /> Trails
        </button>
        <button
          onClick={onToggleGhost}
          className={cn(
            "h-7 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all",
            showGhost ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
          )}
          title="Ghost end positions"
        >
          <Ghost className="h-3 w-3" /> Ghost
        </button>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* ── Auto-generate & reset ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onAutoGenerate}
          disabled={!hasDiagram}
          className={cn(
            "h-7 px-2 flex items-center gap-1 rounded-md text-[10px] font-semibold transition-all",
            "text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title="Auto-generate timing from diagram"
        >
          <Wand2 className="h-3 w-3" /> Auto-Time
        </button>
        <button
          onClick={onResetTimeline}
          disabled={!hasDiagram}
          className={cn(
            "h-7 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title="Reset timing to defaults"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}