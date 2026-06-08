import React from 'react';
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, FastForward, Save } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function BottomControlBar({
  paths,
  players,
  isAnimating,
  onToggleAnimation,
  onReset,
  speed,
  onSpeedChange,
  onSave,
  isDirty,
  isSaving,
}) {
  const totalPaths = paths?.length || 0;
  const hasAnimation = totalPaths > 0;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur-xl">
        {/* Left: Animation controls */}
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={onReset}
            disabled={!hasAnimation}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-2 ml-2">
            <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <Slider
                value={[speed]}
                min={0.5}
                max={2}
                step={0.25}
                onValueChange={(vals) => onSpeedChange(vals[0])}
                className="w-16"
                disabled={!hasAnimation}
              />
              <span className="text-[10px] font-semibold text-muted-foreground w-7 text-center">
                {speed.toFixed(2)}x
              </span>
            </div>
          </div>

          {hasAnimation && (
            <div className="ml-2 flex items-center gap-1.5 rounded-lg bg-background/60 px-2 py-1">
              <div className="text-[9px] font-semibold text-muted-foreground">
                {totalPaths} route{totalPaths !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Right: Save button */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <div className="text-[10px] text-muted-foreground mr-1">
              Unsaved changes
            </div>
          )}
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className={cn(
              "h-8 px-3 text-xs",
              isDirty ? "bg-accent hover:bg-accent/90" : "bg-muted text-muted-foreground"
            )}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}