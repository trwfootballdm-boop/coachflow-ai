// src/lib/football-engine/concepts.ts

import type { PathPoint, PlayPath } from './types';

export interface PathAssignment {
  pathId: string;
  tokenId?: string;
  kind: 'route' | 'run' | 'block' | 'motion' | 'unknown';
  family: 'vertical' | 'flat' | 'slant' | 'corner' | 'dig' | 'drag' | 'pull' | 'base' | 'unknown';
  confidence: number;
}

function dx(a: PathPoint, b: PathPoint) {
  return b.x - a.x;
}

function dy(a: PathPoint, b: PathPoint) {
  return b.y - a.y;
}

function totalDx(points: PathPoint[]) {
  if (points.length < 2) return 0;
  return points[points.length - 1].x - points[0].x;
}

function totalDy(points: PathPoint[]) {
  if (points.length < 2) return 0;
  return points[points.length - 1].y - points[0].y;
}

export function depth(points: PathPoint[]) {
  return Math.abs(totalDy(points));
}

export function width(points: PathPoint[]) {
  return Math.abs(totalDx(points));
}

export function inferRouteFamily(path: PlayPath): PathAssignment {
  const pts = path.points || [];
  if (pts.length < 2) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'unknown', confidence: 0.2 };
  }

  const first = pts[0];
  const last = pts[pts.length - 1];
  const dX = dx(first, last);
  const dY = dy(first, last);
  const absX = Math.abs(dX);
  const absY = Math.abs(dY);

  if (path.path_type === 'motion_path') {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'motion', family: 'unknown', confidence: 0.95 };
  }

  if (path.path_type === 'run_path') {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'run', family: 'unknown', confidence: 0.9 };
  }

  if (path.path_type === 'blocking_track') {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'block', family: 'base', confidence: 0.75 };
  }

  if (path.path_type === 'pull_path') {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'block', family: 'pull', confidence: 0.95 };
  }

  if (path.path_type !== 'pass_route') {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'unknown', family: 'unknown', confidence: 0.4 };
  }

  if (absY >= 70 && absX <= 18) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'vertical', confidence: 0.82 };
  }

  if (absY <= 18 && absX >= 35) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'flat', confidence: 0.85 };
  }

  if (absY >= 25 && absY <= 65 && absX >= 20 && absX <= 75) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'slant', confidence: 0.72 };
  }

  if (absY >= 45 && absX >= 55) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'corner', confidence: 0.68 };
  }

  if (absY >= 55 && absX >= 25 && absX <= 55) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'dig', confidence: 0.62 };
  }

  if (absY >= 10 && absY <= 35 && absX >= 25 && absX <= 70) {
    return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'drag', confidence: 0.7 };
  }

  return { pathId: path.path_id, tokenId: path.token_id, kind: 'route', family: 'unknown', confidence: 0.35 };
}