// ─── Animation Engine — timing helpers and playback computation ───────────────

export const DEFAULT_TOTAL_MS = 4500;

const SNAP_MS = 800;
const MOTION_LEAD_MS = 600;
const PATH_STAGGER_MS = 120;

const PATH_DEFAULT_DURATIONS = {
  motion_path:    900,
  run_path:       1400,
  ball_path:      800,
  pass_route:     1600,
  blocking_track: 1400,
  pull_path:      1100,
  blitz_path:     1200,
  pursuit_path:   1400,
  zone_drop:      1200,
  contain_path:   1300,
  fake_path:      900,
};

// Interpolate position along a polyline at t in [0,1]
export function evalPathAt(points, t) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return { ...points[0] };
  if (t <= 0) return { ...points[0] };
  if (t >= 1) return { ...points[points.length - 1] };

  const totalSeg = points.length - 1;
  const segT = t * totalSeg;
  const seg = Math.floor(segT);
  const lt = segT - seg;
  const p1 = points[Math.min(seg, points.length - 1)];
  const p2 = points[Math.min(seg + 1, points.length - 1)];
  return {
    x: p1.x + (p2.x - p1.x) * lt,
    y: p1.y + (p2.y - p1.y) * lt,
  };
}

// Build default event timeline from diagram data
export function autoGenerateTimeline(diagram) {
  if (!diagram) {
    return { events: [], totalDuration: DEFAULT_TOTAL_MS };
  }

  const paths = diagram.paths || [];
  const events = [];

  // Snap event
  events.push({
    event_id: 'snap',
    event_type: 'snap',
    time_ms: SNAP_MS,
    label: 'Snap',
    is_system: true,
  });

  // One event per path, staggered post-snap
  let stagger = 0;
  paths.forEach((path, idx) => {
    const isPreSnap = path.path_type === 'motion_path';
    const duration = PATH_DEFAULT_DURATIONS[path.path_type] || 1400;
    const startOffset = isPreSnap ? -MOTION_LEAD_MS : stagger;
    const startMs = SNAP_MS + startOffset;
    const endMs = startMs + duration;

    events.push({
      event_id: `path_${path.path_id || idx}_start`,
      event_type: isPreSnap ? 'pre_snap_motion' : 'route_release',
      time_ms: Math.max(0, startMs),
      end_ms: endMs,
      duration_ms: duration,
      label: (path.path_type || 'move').replace(/_/g, ' '),
      token_id: path.token_id || null,
      path_id: path.path_id || String(idx),
      path_type: path.path_type,
      is_auto: true,
    });

    if (!isPreSnap) stagger += PATH_STAGGER_MS;
  });

  events.sort((a, b) => a.time_ms - b.time_ms);

  const maxEnd = Math.max(
    ...events.map(e => e.end_ms || e.time_ms),
    DEFAULT_TOTAL_MS
  );

  return { events, totalDuration: maxEnd + 500 };
}

// Compute the animated state of players at a given time
export function computeFrame(diagram, timeline, currentMs) {
  if (!diagram || !timeline) {
    return { players: diagram?.players || [], activeEventIds: [] };
  }

  const paths = diagram.paths || [];
  const players = diagram.players || [];
  const events = timeline.events || [];
  const activeEventIds = [];

  // Determine which events are "active" right now
  events.forEach(e => {
    const endMs = e.end_ms ?? e.time_ms;
    if (currentMs >= e.time_ms && currentMs <= endMs + 100) {
      activeEventIds.push(e.event_id);
    }
  });

  // Compute animated player positions
  const animatedPlayers = players.map(player => {
    const playerPaths = paths.filter(p => p.token_id === player.token_id);

    for (const path of playerPaths) {
      const event = events.find(e => e.path_id === (path.path_id || String(paths.indexOf(path))) && e.end_ms !== undefined);
      if (!event || currentMs < event.time_ms) continue;

      const t = Math.min(1, (currentMs - event.time_ms) / (event.end_ms - event.time_ms));
      const pos = evalPathAt(path.points, t);
      if (!pos) continue;

      return { ...player, x: pos.x, y: pos.y, _animated: true, _t: t };
    }

    return { ...player, _animated: false };
  });

  return { players: animatedPlayers, activeEventIds };
}

// Compute how much of a path to draw at the current time (for progressive path reveal)
export function computePathProgress(path, timeline, currentMs) {
  if (!timeline) return { visible: true, t: 1 };

  const events = timeline.events || [];
  const pathId = path.path_id || null;
  const event = events.find(e => e.path_id === pathId && e.end_ms !== undefined);

  if (!event) return { visible: true, t: 1 };
  if (currentMs < event.time_ms) return { visible: false, t: 0 };

  const t = Math.min(1, (currentMs - event.time_ms) / (event.end_ms - event.time_ms));
  return { visible: true, t };
}