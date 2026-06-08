import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Wand2, ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayAnimation } from '@/hooks/usePlayAnimation';
import AnimatedFieldCanvas from './AnimatedFieldCanvas';
import AnimationControls from './AnimationControls';
import AnimationTimeline from './AnimationTimeline';
import AnimationEventInspector from './AnimationEventInspector';

export default function PlayAnimationPreview({ diagram, play, onSaveTimeline }) {
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInspector, setShowInspector] = useState(false);

  const anim = usePlayAnimation(diagram);

  const hasDiagram = diagram && (
    (diagram.players?.length > 0) || (diagram.paths?.length > 0)
  );

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowInspector(true);
  }, []);

  const handleUpdateTimeline = useCallback((updated) => {
    anim.setTimeline(updated);
  }, [anim]);

  const handleAutoGenerate = useCallback(() => {
    anim.autoGenerate();
    setTimelineExpanded(true);
  }, [anim]);

  // No diagram state
  if (!hasDiagram) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-secondary/10">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Play className="h-7 w-7 text-primary/50 translate-x-0.5" />
        </div>
        <p className="font-display font-semibold">No diagram to animate</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Draw the play in the Diagram tab first, then come back to preview the animation.
        </p>
      </div>
    );
  }

  const animatedPlayers = anim.getAnimatedPlayers();
  const activeEvents = anim.getActiveEvents();

  return (
    <div className="flex flex-col border border-border rounded-2xl overflow-hidden bg-card"
      style={{ height: '70vh', minHeight: 520 }}>

      {/* ── Top bar: mode badges + quick actions ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30 shrink-0">
        <div className="flex items-center bg-secondary rounded-md p-0.5">
          {[
            { v: 'coach', l: 'Coach' },
            { v: 'player', l: 'Player' },
            { v: 'teaching', l: 'Teaching' },
          ].map(m => (
            <button key={m.v}
              onClick={() => anim.setAnimMode(m.v)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded transition-all",
                anim.animMode === m.v
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {m.l}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Quick action: Auto-time */}
        {!anim.timeline && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-[11px] text-accent border-accent/30 hover:bg-accent/10"
            onClick={handleAutoGenerate}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Auto-Generate Timing
          </Button>
        )}

        {anim.timeline && (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">
              {anim.timeline.events?.length || 0} events
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Save timeline */}
          {anim.timeline && onSaveTimeline && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1"
              onClick={() => onSaveTimeline(anim.timeline)}
            >
              Save Timing
            </Button>
          )}
          {/* Inspector toggle */}
          {selectedEvent && (
            <Button
              size="sm"
              variant={showInspector ? 'secondary' : 'ghost'}
              className="h-7 text-[11px] gap-1"
              onClick={() => setShowInspector(v => !v)}
            >
              <Eye className="h-3 w-3" /> Event
            </Button>
          )}
        </div>
      </div>

      {/* ── Main body: field + optional inspector ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden bg-[#1a5c2e]">
          <AnimatedFieldCanvas
            diagram={diagram}
            animatedPlayers={animatedPlayers}
            activeEvents={activeEvents}
            currentMs={anim.currentMs}
            timeline={anim.timeline}
            isPlaying={anim.isPlaying}
            showTrails={anim.showTrails}
            showGhost={anim.showGhost}
            animMode={anim.animMode}
            showStaticPaths={true}
          />

          {/* Snap flash label */}
          {activeEvents.some(e => e.event_type === 'snap') && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-400/90 text-gray-900 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
              SNAP
            </div>
          )}

          {/* Active event labels (non-snap) */}
          {activeEvents.filter(e => e.event_type !== 'snap' && e.label).slice(0, 2).map(e => (
            <div key={e.event_id}
              className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
              {e.label}
            </div>
          ))}

          {/* No-timing hint overlay */}
          {!anim.timeline && !anim.isPlaying && (
            <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm text-white/80 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                <Wand2 className="h-3.5 w-3.5 text-accent" />
                Click Auto-Generate Timing to enable playback
              </div>
            </div>
          )}
        </div>

        {/* Event inspector side panel */}
        {showInspector && selectedEvent && (
          <div className="w-52 shrink-0">
            <AnimationEventInspector
              event={selectedEvent}
              diagram={diagram}
              timeline={anim.timeline}
              onUpdateEvent={handleUpdateTimeline}
              onClose={() => setShowInspector(false)}
            />
          </div>
        )}
      </div>

      {/* ── Playback controls bar ── */}
      <div className="h-11 border-t border-border bg-card shrink-0 flex items-center">
        <AnimationControls
          isPlaying={anim.isPlaying}
          currentMs={anim.currentMs}
          totalDuration={anim.totalDuration}
          speed={anim.speed}
          loop={anim.loop}
          animMode={anim.animMode}
          showTrails={anim.showTrails}
          showGhost={anim.showGhost}
          hasDiagram={!!hasDiagram && !!anim.timeline}
          onPlay={anim.play}
          onPause={anim.pause}
          onRestart={anim.restart}
          onStepBack={anim.stepBack}
          onStepForward={anim.stepForward}
          onSeek={anim.seekTo}
          onSetSpeed={anim.setSpeed}
          onToggleLoop={anim.setLoop.bind(null, !anim.loop)}
          onSetMode={anim.setAnimMode}
          onToggleTrails={() => anim.setShowTrails(!anim.showTrails)}
          onToggleGhost={() => anim.setShowGhost(!anim.showGhost)}
          onAutoGenerate={handleAutoGenerate}
          onResetTimeline={anim.resetTimeline}
        />
      </div>

      {/* ── Timeline panel ── */}
      <AnimationTimeline
        timeline={anim.timeline}
        diagram={diagram}
        currentMs={anim.currentMs}
        totalDuration={anim.totalDuration}
        selectedEvent={selectedEvent}
        onSelectEvent={handleSelectEvent}
        onUpdateEvent={handleUpdateTimeline}
        onSeek={anim.seekTo}
        isExpanded={timelineExpanded}
        onToggleExpand={() => setTimelineExpanded(v => !v)}
      />
    </div>
  );
}