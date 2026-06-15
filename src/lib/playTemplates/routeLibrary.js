/**
 * Route library — parametric route generators for play templates.
 *
 * Coordinate system: x=0-900 (left→right, midX=450), y=0-540 (top→bottom).
 * LOS is typically at y=290 for offensive plays.
 * Routes go UPFIELD (decreasing y) for offense.
 *
 * Each generator returns { points: [{x, y}, ...] } given a starting position.
 * Path objects with full metadata are built by the wrapper `makeRoute()`.
 */

import { MID_X } from '../formationHelpers';

const LOS = 290;
const uid = (prefix = 'r') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Build a complete path object suitable for diagram_data.paths.
 *
 * @param {string} tokenId - player to attach to
 * @param {Array<{x,y}>} points - waypoints (must include starting position)
 * @param {object} opts - { path_type, route_name, color, dashed }
 */
export function makeRoute(tokenId, points, opts = {}) {
  return {
    path_id: uid('path'),
    token_id: tokenId,
    path_type: opts.path_type || 'pass_route',
    route_name: opts.route_name || '',
    points,
    color: opts.color,
    dashed: opts.dashed || false,
  };
}

/**
 * Quick game routes (1-7 yards). Receiver releases vertically then breaks.
 * Direction: 'in' → toward midX, 'out' → away from midX.
 */

export function hitch(start, depth = 5) {
  // Release ~3 yards, hitch back 1 yard
  const yards = depth * 8; // 1 yard ≈ 8 SVG units (field is ~36 yards tall)
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: start.x, y: start.y - yards + 6 },
  ];
}

export function slant(start, depth = 4) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const inwardX = isLeft ? start.x + 90 : start.x - 90;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards * 0.4 },
    { x: inwardX, y: start.y - yards },
  ];
}

export function quickOut(start, depth = 5) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const outwardX = isLeft ? Math.max(60, start.x - 70) : Math.min(840, start.x + 70);
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: outwardX, y: start.y - yards },
  ];
}

/**
 * Intermediate routes (8-15 yards).
 */

export function curl(start, depth = 10) {
  const yards = depth * 8;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: start.x + (start.x < MID_X ? 12 : -12), y: start.y - yards + 14 },
  ];
}

export function dig(start, depth = 12) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const crossX = isLeft ? MID_X + 120 : MID_X - 120;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: crossX, y: start.y - yards },
  ];
}

export function comeback(start, depth = 14) {
  const yards = depth * 8;
  const outwardX = start.x < MID_X ? Math.max(60, start.x - 40) : Math.min(840, start.x + 40);
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: outwardX, y: start.y - yards + 24 },
  ];
}

export function out(start, depth = 10) {
  return quickOut(start, depth);
}

export function in_(start, depth = 8) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const inwardX = isLeft ? start.x + 110 : start.x - 110;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: inwardX, y: start.y - yards },
  ];
}

/**
 * Deep routes (15+ yards).
 */

export function go(start, depth = 25) {
  const yards = depth * 8;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: Math.max(20, start.y - yards) },
  ];
}

export function post(start, depth = 18) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const breakX = isLeft ? Math.min(MID_X + 60, start.x + 180) : Math.max(MID_X - 60, start.x - 180);
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards * 0.6 },
    { x: breakX, y: Math.max(20, start.y - yards) },
  ];
}

export function corner(start, depth = 18) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const breakX = isLeft ? Math.max(40, start.x - 120) : Math.min(860, start.x + 120);
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards * 0.6 },
    { x: breakX, y: Math.max(30, start.y - yards) },
  ];
}

export function fade(start, depth = 20) {
  return corner(start, depth);
}

/**
 * RB / TE specials.
 */

export function flat(start, side = 'auto') {
  const isLeft = side === 'left' || (side === 'auto' && start.x < MID_X);
  const outwardX = isLeft ? 100 : 800;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - 8 },
    { x: outwardX, y: LOS - 8 },
  ];
}

export function wheel(start) {
  const isLeft = start.x < MID_X;
  const flatX = isLeft ? 120 : 780;
  return [
    { x: start.x, y: start.y },
    { x: flatX, y: LOS - 8 },
    { x: flatX, y: 80 },
  ];
}

export function swing(start) {
  const isLeft = start.x < MID_X;
  const outwardX = isLeft ? 140 : 760;
  return [
    { x: start.x, y: start.y },
    { x: outwardX, y: start.y + 8 },
  ];
}

export function checkdown(start) {
  // RB stays in to block then releases short
  return [
    { x: start.x, y: start.y },
    { x: start.x + (start.x < MID_X ? 30 : -30), y: LOS - 16 },
  ];
}

/**
 * Crossing / mesh.
 */

export function shallowCross(start, depth = 3) {
  const isLeft = start.x < MID_X;
  const yards = depth * 8;
  const farX = isLeft ? 760 : 140;
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: start.y - yards },
    { x: farX, y: start.y - yards },
  ];
}

export function drag(start) {
  return shallowCross(start, 3);
}

/**
 * Run-game paths.
 */

export function insideZoneTrack(rb, direction = 'right') {
  const targetX = direction === 'right' ? MID_X + 50 : MID_X - 50;
  return [
    { x: rb.x, y: rb.y },
    { x: targetX, y: LOS + 4 },
    { x: targetX, y: LOS - 60 },
  ];
}

export function outsideZoneTrack(rb, direction = 'right') {
  const targetX = direction === 'right' ? 720 : 180;
  return [
    { x: rb.x, y: rb.y },
    { x: targetX, y: LOS + 4 },
    { x: targetX, y: LOS - 30 },
  ];
}

export function powerTrack(rb, direction = 'right') {
  const targetX = direction === 'right' ? MID_X + 80 : MID_X - 80;
  return [
    { x: rb.x, y: rb.y },
    { x: rb.x, y: LOS + 18 },
    { x: targetX, y: LOS - 8 },
    { x: targetX, y: LOS - 70 },
  ];
}

export function counterTrack(rb, direction = 'right') {
  const jabX = direction === 'right' ? rb.x - 30 : rb.x + 30;
  const targetX = direction === 'right' ? MID_X + 80 : MID_X - 80;
  return [
    { x: rb.x, y: rb.y },
    { x: jabX, y: rb.y + 4 },
    { x: targetX, y: LOS - 8 },
    { x: targetX, y: LOS - 70 },
  ];
}

export function trapTrack(rb, direction = 'right') {
  const targetX = direction === 'right' ? MID_X + 40 : MID_X - 40;
  return [
    { x: rb.x, y: rb.y },
    { x: targetX, y: LOS - 4 },
    { x: targetX, y: LOS - 60 },
  ];
}

export function jetSweep(motionPlayer, direction = 'right') {
  const targetX = direction === 'right' ? 750 : 150;
  return [
    { x: motionPlayer.x, y: motionPlayer.y },
    { x: MID_X, y: motionPlayer.y },
    { x: targetX, y: LOS - 20 },
    { x: targetX, y: LOS - 80 },
  ];
}

/**
 * QB drops, fakes, boots.
 */

export function qbDropback(qb, depth = 5) {
  return [
    { x: qb.x, y: qb.y },
    { x: qb.x, y: qb.y + depth * 6 },
  ];
}

export function qbBootleg(qb, direction = 'left') {
  const targetX = direction === 'left' ? 280 : 620;
  return [
    { x: qb.x, y: qb.y },
    { x: qb.x + (direction === 'left' ? -10 : 10), y: qb.y + 10 },
    { x: targetX, y: qb.y + 20 },
  ];
}

export function qbWaggle(qb, direction = 'left') {
  return qbBootleg(qb, direction);
}

/**
 * Convenience: bulk-build pass routes from a recipe.
 *
 * recipe: { tokenId: 'fn:depth' or 'fn' }, e.g.
 *   { X: 'go:25', Z: 'post:18', H: 'curl:10' }
 *
 * playerLookup: map of token_id → {x,y}
 */
const ROUTE_REGISTRY = {
  hitch, slant, quickOut, quick_out: quickOut,
  curl, dig, comeback, out, in: in_, in_,
  go, post, corner, fade,
  flat, wheel, swing, checkdown,
  shallowCross, shallow_cross: shallowCross, drag,
};

export function buildRoutes(recipe, playerLookup) {
  const paths = [];
  for (const [tokenId, spec] of Object.entries(recipe)) {
    const player = playerLookup[tokenId];
    if (!player) continue;
    const [name, ...rest] = String(spec).split(':');
    const depth = rest.length ? Number(rest[0]) : undefined;
    const fn = ROUTE_REGISTRY[name];
    if (!fn) continue;
    const points = depth === undefined ? fn(player) : fn(player, depth);
    paths.push(makeRoute(tokenId, points, { route_name: name, path_type: 'pass_route' }));
  }
  return paths;
}