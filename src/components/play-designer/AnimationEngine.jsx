// ─── Animation Engine ─────────────────────────────────────────────────────────
// Pure logic module — no React. Drives player position interpolation over time.

export const EVENT_TYPES = [
  'pre_snap_motion_start',
  'pre_snap_motion_end',
  'snap',
  'handoff',
  'mesh',
  'fake',
  'route_release',
  'route_break',
  'throw',
  'catch',
  'blitz_trigger',
  'pursuit_start',
  'end_state',
  'custom',
];

// Default total duration in ms
export const DEFAULT_DURATION = 4000;
export const DEFAULT_SNAP_TIME = 800;

// ─── Smart default timing generator ──────────────────────────────────────────
// Given paths and players from a diagram, returns an animation_timeline object
// with sensible defaults a coach can edit.
export function generateDefaultTimeline(players = [], paths = []) {
  const snap_time_ms = DEFAULT_SNAP_TIME;
  const events = [];
  let totalMs = DEFAULT_SNAP_TIME;

  // Snap event always first
  events.push({
    event_id: 'snap',
    event_type: 'snap',
    time_ms: snap_time_ms,
    token_id: null,
    path_id: null,
    note: 'Ball snapped',
  });

  // Pre-snap motion: any path typed as motion_path starts before snap
  paths.forEach((path, i) => {
    if (path.path_type === 'motion_path') {
      const motionStart = Math.max(0, snap_time_ms - 1200 - i * 200);
      events.push({
        event_id: `pre_motion_${path.path_id || i}`,
        event_type: 'pre_snap_motion_start',
        time_ms: motionStart,
        token_id: path.token_id || null,
        path_id: path.path_id || null,
        note: 'Pre-snap motion',
      });
    }
  });

  // Post-snap paths — stagger by type
  const POST_SNAP_ORDER = [
    'ball_path', 'run_path', 'pass_route', 'blocking_track', 'pull_path',
    'blitz_path', 'zone_drop', 'contain_path', 'pursuit_path', 'fake_path',
  ];

  let maxEnd = snap_time_ms;

  paths.forEach((path) => {
    if (path.path_type === 'motion_path') return; // handled above

    const typeIndex = POST_SNAP_ORDER.indexOf(path.path_type);
    const delay = typeIndex >= 0 ? typeIndex * 60 : 0;
    const pathStart = snap_time_ms + delay;

    // Duration is proportional to path length (rough estimate from points)
    const pts = path.points || [];
    let length = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    // ~1px = 1.5ms of animation time (tunable)
    const pathDuration = Math.min(2500, Math.max(400, length * 1.5));
    const pathEnd = pathStart + pathDuration;
    if (pathEnd > maxEnd) maxEnd = pathEnd;

    // Route break halfway through route
    if (path.path_type === 'pass_route' && pts.length >= 3) {
      events.push({
        event_id: `route_break_${path.path_id || path.token_id}`,
        event_type: 'route_break',
        time_ms: Math.round(pathStart + pathDuration * 0.55),
        token_id: path.token_id || null,
        path_id: path.path_id || null,
        note: 'Route break',
      });
    }

    // Handoff: ball_path event
    if (path.path_type === 'ball_path') {
      events.push({
        event_id: `handoff_${path.path_id}`,
        event_type: 'handoff',
        time_ms: pathStart + 150,
        token_id: path.token_id || null,
        path_id: path.path_id || null,
        note: 'Ball exchange',
      });
    }
  });

  // End state marker
  const totalDuration = Math.round(maxEnd + 400);
  events.push({
    event_id: 'end_state',
    event_type: 'end_state',
    time_ms: totalDuration,
    token_id: null,
    path_id: null,
    note: 'Play end',
  });

  return {
    total_duration_ms: totalDuration,
    snap_time_ms,
    events: events.sort((a, b) => a.time_ms - b.time_ms),
    // Per-path timing overrides
    path_timing: paths.reduce((acc, path, i) => {
      if (path.path_type === 'motion_path') {
        const motionStart = Math.max(0, snap_time_ms - 1200 - i * 200);
        const pts = path.points || [];
        let length = 0;
        for (let j = 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[j - 1].x;
          const dy = pts[j].y - pts[j - 1].y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
        acc[path.path_id || `path_${i}`] = {
          start_ms: motionStart,
          duration_ms: Math.min(1000, Math.max(300, length * 1.5)),
          delay_ms: 0,
        };
      } else {
        const typeIndex = POST_SNAP_ORDER.indexOf(path.path_type);
        const delay = typeIndex >= 0 ? typeIndex * 60 : 0;
        const pathStart = snap_time_ms + delay;
        const pts = path.points || [];
        let length = 0;
        for (let j = 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[j - 1].x;
          const dy = pts[j].y - pts[j - 1].y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
        acc[path.path_id || `path_${i}`] = {
          start_ms: pathStart,
          duration_ms: Math.min(2500, Math.max(400, length * 1.5)),
          delay_ms: delay,
        };
      }
      return acc;
    }, {}),
  };
}

// ─── Position interpolator ────────────────────────────────────────────────────
// Given current time_ms, players, paths, and timeline, returns animated positions.
export function getAnimatedState(currentMs, players, paths, timeline) {
  if (!timeline) return { positions: {}, activePaths: new Set() };

  const pathTiming = timeline.path_timing || {};
  const positions = {};
  const activePaths = new Set();

  // For each path, determine if it's active and how far along
  paths.forEach((path) => {
    const pathId = path.path_id || path.token_id;
    const timing = pathTiming[pathId];
    if (!timing || !path.points || path.points.length < 2) return;

    const { start_ms, duration_ms } = timing;
    const end_ms = start_ms + duration_ms;

    if (currentMs < start_ms) return; // not started yet
    activePaths.add(pathId);

    const progress = Math.min(1, (currentMs - start_ms) / duration_ms);

    // Interpolate position along path
    const pos = interpolateAlongPath(path.points, progress, path.curve_type);
    if (pos && path.token_id) {
      positions[path.token_id] = pos;
    }
  });

  // Players not being animated stay at their start positions
  players.forEach(player => {
    if (!positions[player.token_id]) {
      positions[player.token_id] = { x: player.x, y: player.y };
    }
  });

  return { positions, activePaths };
}

// Interpolate a point along a multi-segment path at progress 0–1
function interpolateAlongPath(points, progress, curveType) {
  if (!points || points.length < 2) return null;

  // Calculate total length
  const segments = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ len, start: total });
    total += len;
  }

  const target = progress * total;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segEnd = seg.start + seg.len;
    if (target <= segEnd || i === segments.length - 1) {
      const segProgress = seg.len > 0 ? (target - seg.start) / seg.len : 1;
      const p0 = points[i];
      const p1 = points[i + 1] || points[i];
      return {
        x: p0.x + (p1.x - p0.x) * Math.min(1, Math.max(0, segProgress)),
        y: p0.y + (p1.y - p0.y) * Math.min(1, Math.max(0, segProgress)),
      };
    }
  }

  return points[points.length - 1];
}

// ─── Easing functions ─────────────────────────────────────────────────────────
export const Easing = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// ─── Path draw progress (for progressive path reveal) ────────────────────────
// Returns 0-1 progress for how much of a path should be drawn at currentMs
export function getPathDrawProgress(pathId, currentMs, timeline) {
  if (!timeline?.path_timing) return 1;
  const timing = timeline.path_timing[pathId];
  if (!timing) return 1;
  const { start_ms, duration_ms } = timing;
  if (currentMs < start_ms) return 0;
  return Math.min(1, (currentMs - start_ms) / duration_ms);
}