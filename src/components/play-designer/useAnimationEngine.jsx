import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Default timing constants (ms) ───────────────────────────────────────────
const SNAP_TIME = 1000;
const PLAY_DURATION = 5000;

// ─── Smart defaults: generate timing from diagram data ───────────────────────
export function generateDefaultTiming(players, paths) {
  const events = [];
  let id = 1;

  // Pre-snap motion players (motion_path)
  paths.forEach(path => {
    if (path.path_type === 'motion_path') {
      events.push({
        event_id: `evt_${id++}`, event_type: 'pre_snap_motion',
        time_ms: 0, duration_ms: 800,
        token_id: path.token_id, path_id: path.path_id,
        label: 'Pre-snap motion',
      });
    }
  });

  // Snap
  events.push({ event_id: `evt_${id++}`, event_type: 'snap', time_ms: SNAP_TIME, label: 'Snap' });

  // Ball carrier / run path
  paths.forEach(path => {
    if (path.path_type === 'run_path' || path.path_type === 'ball_path') {
      const isBall = path.path_type === 'ball_path';
      events.push({
        event_id: `evt_${id++}`,
        event_type: isBall ? 'handoff' : 'snap',
        time_ms: isBall ? SNAP_TIME + 300 : SNAP_TIME,
        duration_ms: 1400,
        token_id: path.token_id, path_id: path.path_id,
        label: isBall ? 'Ball movement' : 'Run path',
      });
    }
  });

  // Pass routes — stagger slightly
  let routeDelay = 0;
  paths.forEach(path => {
    if (path.path_type === 'pass_route') {
      events.push({
        event_id: `evt_${id++}`, event_type: 'route_release',
        time_ms: SNAP_TIME + routeDelay,
        duration_ms: 1800,
        token_id: path.token_id, path_id: path.path_id,
        label: 'Route',
      });
      routeDelay += 60; // slight stagger per receiver
    }
  });

  // Blocks
  paths.forEach(path => {
    if (path.path_type === 'blocking_track' || path.path_type === 'pull_path') {
      events.push({
        event_id: `evt_${id++}`, event_type: 'snap',
        time_ms: SNAP_TIME,
        duration_ms: 1200,
        token_id: path.token_id, path_id: path.path_id,
        label: path.path_type === 'pull_path' ? 'Pull' : 'Block',
      });
    }
  });

  // Defense
  paths.forEach(path => {
    if (['blitz_path', 'pursuit_path', 'zone_drop', 'contain_path'].includes(path.path_type)) {
      events.push({
        event_id: `evt_${id++}`,
        event_type: path.path_type === 'blitz_path' ? 'blitz_trigger' : 'pursuit_start',
        time_ms: SNAP_TIME + 200,
        duration_ms: 1500,
        token_id: path.token_id, path_id: path.path_id,
        label: path.path_type.replace(/_/g, ' '),
      });
    }
  });

  // End state
  events.push({ event_id: `evt_${id++}`, event_type: 'end_state', time_ms: PLAY_DURATION, label: 'End State' });

  return { events, total_duration_ms: PLAY_DURATION, snap_time_ms: SNAP_TIME };
}

// ─── Interpolate position along path at progress 0..1 ────────────────────────
export function interpolatePosition(points, progress) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0];
  const clampedP = Math.max(0, Math.min(1, progress));
  const totalSegments = points.length - 1;
  const segIdx = Math.min(Math.floor(clampedP * totalSegments), totalSegments - 1);
  const segProgress = (clampedP * totalSegments) - segIdx;
  const a = points[segIdx];
  const b = points[segIdx + 1];
  return { x: a.x + (b.x - a.x) * segProgress, y: a.y + (b.y - a.y) * segProgress };
}

// ─── Easing functions ─────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function linear(t) { return t; }

// ─── Main animation engine hook ───────────────────────────────────────────────
export function useAnimationEngine({ players, paths, timeline, onFrame }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const currentTimeRef = useRef(0);

  const totalDuration = timeline?.total_duration_ms || PLAY_DURATION;

  // Build a path lookup for fast access
  const pathMap = {};
  paths.forEach(p => { pathMap[p.path_id] = p; });

  // Build player lookup
  const playerMap = {};
  players.forEach(p => { playerMap[p.token_id] = p; });

  // Compute animated positions for a given time
  const computeFrame = useCallback((timeMs) => {
    if (!timeline?.events) return { playerPositions: {}, activePaths: new Set() };

    const playerPositions = {};
    const activePaths = new Set();

    // Start from base positions
    players.forEach(p => { playerPositions[p.token_id] = { x: p.x, y: p.y }; });

    // Apply events
    timeline.events.forEach(evt => {
      if (!evt.path_id || !evt.token_id) return;
      const path = pathMap[evt.path_id];
      if (!path?.points || path.points.length < 2) return;

      const startMs = evt.time_ms || 0;
      const durMs = evt.duration_ms || 1500;
      const endMs = startMs + durMs;

      if (timeMs < startMs) return; // not started yet

      activePaths.add(evt.path_id);

      const rawProgress = (timeMs - startMs) / durMs;
      const progress = easeInOut(Math.min(rawProgress, 1));

      const pos = interpolatePosition(path.points, progress);
      if (pos) playerPositions[evt.token_id] = pos;
    });

    return { playerPositions, activePaths };
  }, [players, paths, timeline]);

  const tick = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) * speed;
    lastTimeRef.current = timestamp;

    currentTimeRef.current = Math.min(currentTimeRef.current + delta, totalDuration);
    setCurrentTime(currentTimeRef.current);

    const frame = computeFrame(currentTimeRef.current);
    onFrame && onFrame(frame);

    if (currentTimeRef.current >= totalDuration) {
      if (isLooping) {
        currentTimeRef.current = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [speed, totalDuration, isLooping, computeFrame, onFrame]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, tick]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    const frame = computeFrame(0);
    onFrame && onFrame(frame);
  }, [computeFrame, onFrame]);

  const seekTo = useCallback((ms) => {
    currentTimeRef.current = ms;
    setCurrentTime(ms);
    const frame = computeFrame(ms);
    onFrame && onFrame(frame);
  }, [computeFrame, onFrame]);

  const stepForward = useCallback(() => {
    const next = Math.min(currentTimeRef.current + 250, totalDuration);
    seekTo(next);
  }, [seekTo, totalDuration]);

  const stepBack = useCallback(() => {
    const prev = Math.max(currentTimeRef.current - 250, 0);
    seekTo(prev);
  }, [seekTo]);

  return {
    isPlaying, currentTime, speed, isLooping,
    totalDuration, computeFrame,
    play, pause, restart, seekTo, stepForward, stepBack,
    setSpeed, setIsLooping,
  };
}