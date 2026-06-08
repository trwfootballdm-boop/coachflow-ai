import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Default timing constants (ms) ───────────────────────────────────────────
const SNAP_TIME = 800;
const MOTION_LEAD = 600;          // pre-snap motion starts this many ms before snap
const PATH_STAGGER = 120;          // stagger between simultaneous paths
const DEFAULT_PATH_DURATION = 1600;
const PRE_SNAP_MOTION_DURATION = 900;
const TOTAL_DEFAULT_DURATION = 4500;

// ─── Path type → timing bucket ────────────────────────────────────────────────
const PATH_TIMING = {
  motion_path:    { startOffset: -MOTION_LEAD, duration: PRE_SNAP_MOTION_DURATION },
  run_path:       { startOffset: 0, duration: 1400 },
  ball_path:      { startOffset: 120, duration: 800 },
  pass_route:     { startOffset: 0, duration: 1600 },
  blocking_track: { startOffset: 60, duration: 1400 },
  pull_path:      { startOffset: 0, duration: 1100 },
  blitz_path:     { startOffset: 0, duration: 1200 },
  pursuit_path:   { startOffset: 400, duration: 1400 },
  zone_drop:      { startOffset: 200, duration: 1200 },
  contain_path:   { startOffset: 0, duration: 1300 },
  fake_path:      { startOffset: 0, duration: 900 },
};

// ─── Auto-generate timeline events from diagram data ─────────────────────────
export function generateDefaultTimeline(diagram) {
  if (!diagram) return { events: [], totalDuration: TOTAL_DEFAULT_DURATION };

  const paths = diagram.paths || [];
  const players = diagram.players || [];
  const events = [];

  // Snap event
  events.push({
    event_id: 'snap',
    event_type: 'snap',
    time_ms: SNAP_TIME,
    label: 'Snap',
    token_id: null,
    path_id: null,
    is_system: true,
  });

  // Generate one event per path
  let pathStagger = 0;
  paths.forEach((path, idx) => {
    const timing = PATH_TIMING[path.path_type] || { startOffset: 0, duration: DEFAULT_PATH_DURATION };
    const isPreSnap = path.path_type === 'motion_path';
    const startMs = SNAP_TIME + timing.startOffset + (isPreSnap ? 0 : pathStagger);
    const endMs = startMs + timing.duration;

    events.push({
      event_id: `path_${path.path_id || idx}_start`,
      event_type: isPreSnap ? 'pre_snap_motion' : 'route_release',
      time_ms: startMs,
      end_ms: endMs,
      duration_ms: timing.duration,
      label: path.path_type?.replace(/_/g, ' ') || 'movement',
      token_id: path.token_id || null,
      path_id: path.path_id || String(idx),
      path_type: path.path_type,
      is_auto: true,
    });

    if (!isPreSnap) pathStagger += PATH_STAGGER;
  });

  // Detect ball carrier
  const ballPath = paths.find(p => p.path_type === 'ball_path' || p.path_type === 'run_path');
  if (ballPath) {
    events.push({
      event_id: 'handoff',
      event_type: 'handoff',
      time_ms: SNAP_TIME + 200,
      label: 'Handoff / Snap',
      token_id: ballPath.token_id || null,
      path_id: ballPath.path_id || null,
      is_auto: true,
    });
  }

  // Sort by time
  events.sort((a, b) => a.time_ms - b.time_ms);

  const maxEnd = Math.max(
    ...events.map(e => e.end_ms || e.time_ms),
    TOTAL_DEFAULT_DURATION
  );

  return { events, totalDuration: maxEnd + 600 };
}

// ─── Interpolate a player's position along its path at a given time ───────────
function interpolatePosition(path, event, currentMs, players) {
  if (!event || !path) return null;
  const { time_ms: start, end_ms: end } = event;
  if (currentMs < start) return null;
  if (currentMs >= end) return { t: 1, path, event };
  const t = (currentMs - start) / (end - start);
  return { t, path, event };
}

function evalPathAt(points, t) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const totalSegments = points.length - 1;
  const segT = t * totalSegments;
  const seg = Math.floor(segT);
  const localT = segT - seg;
  const p1 = points[Math.min(seg, points.length - 1)];
  const p2 = points[Math.min(seg + 1, points.length - 1)];
  return {
    x: p1.x + (p2.x - p1.x) * localT,
    y: p1.y + (p2.y - p1.y) * localT,
  };
}

// ─── Main animation hook ──────────────────────────────────────────────────────
export function usePlayAnimation(diagram) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [animMode, setAnimMode] = useState('coach'); // coach | player | teaching
  const [showTrails, setShowTrails] = useState(true);
  const [showGhost, setShowGhost] = useState(false);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Build or rebuild timeline when diagram changes
  const generatedTimeline = diagram ? generateDefaultTimeline(diagram) : null;
  const activeTimeline = timeline || generatedTimeline;
  const totalDuration = activeTimeline?.totalDuration || TOTAL_DEFAULT_DURATION;

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (!isPlayingRef.current) return;
    const now = performance.now();
    if (lastTimeRef.current === null) lastTimeRef.current = now;
    const delta = (now - lastTimeRef.current) * speed;
    lastTimeRef.current = now;

    setCurrentMs(prev => {
      const next = prev + delta;
      if (next >= totalDuration) {
        if (loop) {
          lastTimeRef.current = null;
          return 0;
        }
        isPlayingRef.current = false;
        setIsPlaying(false);
        return totalDuration;
      }
      return next;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [speed, totalDuration, loop]);

  const play = useCallback(() => {
    if (currentMs >= totalDuration) setCurrentMs(0);
    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [currentMs, totalDuration, tick]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const restart = useCallback(() => {
    stop();
    setCurrentMs(0);
    setTimeout(() => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }, 50);
  }, [stop, tick]);

  const seekTo = useCallback((ms) => {
    setCurrentMs(Math.max(0, Math.min(ms, totalDuration)));
  }, [totalDuration]);

  const stepForward = useCallback(() => {
    const events = activeTimeline?.events || [];
    const next = events.find(e => e.time_ms > currentMs + 10);
    seekTo(next ? next.time_ms : Math.min(currentMs + 250, totalDuration));
  }, [currentMs, activeTimeline, seekTo, totalDuration]);

  const stepBack = useCallback(() => {
    const events = (activeTimeline?.events || []).slice().reverse();
    const prev = events.find(e => e.time_ms < currentMs - 10);
    seekTo(prev ? prev.time_ms : Math.max(currentMs - 250, 0));
  }, [currentMs, activeTimeline, seekTo]);

  const autoGenerate = useCallback(() => {
    if (!diagram) return;
    const generated = generateDefaultTimeline(diagram);
    setTimeline(generated);
    setCurrentMs(0);
    stop();
  }, [diagram, stop]);

  const resetTimeline = useCallback(() => {
    setTimeline(null);
    setCurrentMs(0);
    stop();
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Compute animated player positions for current time ───────────────────
  const getAnimatedPlayers = useCallback(() => {
    if (!diagram || !activeTimeline) return diagram?.players || [];

    const players = diagram.players || [];
    const paths = diagram.paths || [];
    const events = activeTimeline.events || [];

    return players.map(player => {
      // Find paths for this player
      const playerPaths = paths.filter(p => p.token_id === player.token_id);
      if (playerPaths.length === 0) return { ...player, _animated: false };

      // Find active path event for current time
      for (const path of playerPaths) {
        const event = events.find(e => e.path_id === path.path_id && e.end_ms !== undefined);
        if (!event) continue;

        const { time_ms: start, end_ms: end } = event;
        if (currentMs < start) continue;

        const t = Math.min(1, (currentMs - start) / (end - start));
        const pos = evalPathAt(path.points, t);
        if (!pos) continue;

        return {
          ...player,
          x: pos.x,
          y: pos.y,
          _animated: true,
          _t: t,
          _pathId: path.path_id,
        };
      }

      return { ...player, _animated: false };
    });
  }, [diagram, activeTimeline, currentMs]);

  // ── Active events at current time ────────────────────────────────────────
  const getActiveEvents = useCallback(() => {
    if (!activeTimeline) return [];
    return (activeTimeline.events || []).filter(e => {
      if (e.end_ms !== undefined) return currentMs >= e.time_ms && currentMs <= e.end_ms;
      return Math.abs(currentMs - e.time_ms) < 150;
    });
  }, [activeTimeline, currentMs]);

  return {
    // State
    isPlaying,
    currentMs,
    totalDuration,
    speed,
    loop,
    animMode,
    showTrails,
    showGhost,
    timeline: activeTimeline,
    // Controls
    play,
    pause,
    restart,
    seekTo,
    stepForward,
    stepBack,
    setSpeed,
    setLoop,
    setAnimMode,
    setShowTrails,
    setShowGhost,
    // Timeline management
    autoGenerate,
    resetTimeline,
    setTimeline,
    // Computed
    getAnimatedPlayers,
    getActiveEvents,
  };
}