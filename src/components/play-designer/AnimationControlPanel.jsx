import React from 'react';
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function AnimationControlPanel({
  paths,
  players,
  isAnimating,
  onToggleAnimation,
  onReset,
  speed,
  onSpeedChange,
}) {
  const totalPaths = paths?.length || 0;
  const hasAnimation = totalPaths > 0;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-xl">
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={onToggleAnimation}
        disabled={!hasAnimation}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
          isAnimating
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          !hasAnimation && "opacity-50 cursor-not-allowed"
        )}
      >
        {isAnimating ? (
          <>
            <Pause className="h-3.5 w-3.5" />
            Pause
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Play
          </>
        )}
      </button>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        disabled={!hasAnimation}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Slider
            value={[speed]}
            min={0.5}
            max={2}
            step={0.25}
            onValueChange={(vals) => onSpeedChange(vals[0])}
            className="w-20"
            disabled={!hasAnimation}
          />
          <span className="text-[10px] font-semibold text-muted-foreground w-8 text-center">
            {speed.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Path count indicator */}
      <div className="ml-1 flex items-center gap-1.5 rounded-lg bg-background/60 px-2 py-1">
        <div className="text-[9px] font-semibold text-muted-foreground">
          {totalPaths} route{totalPaths !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}