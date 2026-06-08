import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnimationCanvas from './AnimationCanvas';
import AnimationControls from './AnimationControls';
import { generateDefaultTimeline } from './AnimationEngine';
import { cn } from "@/lib/utils";

export default function AnimationPlayer({ players = [], paths = [], initialTimeline = null, onSave, onClose }) {
  const [timeline, setTimeline] = useState(initialTimeline);
  const [currentMs, setCurrentMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('coach'); // coach | player | teaching
  const [loop, setLoop] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const currentMsRef = useRef(0);

  // Keep ref in sync
  useEffect(() => { currentMsRef.current = currentMs; }, [currentMs]);

  const totalMs = timeline?.total_duration_ms || 4000;

  // ── Auto-generate if no timeline ──────────────────────────────────────────
  useEffect(() => {
    if (!timeline && (players.length > 0 || paths.length > 0)) {
      const generated = generateDefaultTimeline(players, paths);
      setTimeline(generated);
    }
  }, [players, paths]);

  // ── RAF-based playback loop ───────────────────────────────────────────────
  const tick = useCallback((timestamp) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const delta = (timestamp - lastTimestampRef.current) * speed;
    lastTimestampRef.current = timestamp;

    setCurrentMs(prev => {
      const next = prev + delta;
      if (next >= totalMs) {
        if (loop) {
          lastTimestampRef.current = null;
          return 0;
        } else {
          setIsPlaying(false);
          return totalMs;
        }
      }
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [speed, totalMs, loop]);

  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, tick]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handlePlay = () => {
    if (currentMs >= totalMs) setCurrentMs(0);
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleRestart = () => { setCurrentMs(0); setIsPlaying(false); };
  const handleSeek = (ms) => setCurrentMs(Math.max(0, Math.min(totalMs, ms)));

  const handleAutoGenerate = () => {
    const generated = generateDefaultTimeline(players, paths);
    setTimeline(generated);
    setCurrentMs(0);
    setIsPlaying(false);
  };

  const handleSave = () => {
    if (onSave && timeline) onSave(timeline);
  };

  // ── Mode overlay labels ───────────────────────────────────────────────────
  const modeLabel = {
    coach:    null,
    player:   '👤 Player View',
    teaching: '📘 Teaching Mode',
  }[mode];

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Field canvas */}
      <div className="flex-1 relative overflow-hidden">
        <AnimationCanvas
          players={players}
          paths={paths}
          timeline={timeline}
          currentMs={currentMs}
          mode={mode}
        />

        {/* Mode badge */}
        {modeLabel && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
            <p className="text-xs text-white font-medium">{modeLabel}</p>
          </div>
        )}

        {/* Teaching mode overlay: simplified labels */}
        {mode === 'teaching' && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white font-bold mb-1">Key Teaching Points</p>
            <div className="flex gap-3 flex-wrap">
              {[
                { color: '#60a5fa', label: 'Pass Routes' },
                { color: '#f59e0b', label: 'Run Paths' },
                { color: '#fb923c', label: 'Blocking' },
                { color: '#a78bfa', label: 'Motion' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-4 rounded-sm" style={{ background: item.color }} />
                  <span className="text-[10px] text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animation controls */}
      <AnimationControls
        timeline={timeline}
        currentMs={currentMs}
        isPlaying={isPlaying}
        speed={speed}
        mode={mode}
        selectedEvent={selectedEvent}
        loop={loop}
        paths={paths}
        players={players}
        onPlay={handlePlay}
        onPause={handlePause}
        onRestart={handleRestart}
        onSeek={handleSeek}
        onSetSpeed={setSpeed}
        onSetMode={setMode}
        onSelectEvent={setSelectedEvent}
        onAutoGenerate={handleAutoGenerate}
        onToggleLoop={() => setLoop(l => !l)}
        onClose={onClose}
      />
    </div>
  );
}