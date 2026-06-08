// src/lib/football-engine/concepts.ts

import type { PathPoint, PlayPath, PlayerToken } from './types';

export interface PathAssignment {
  pathId: string;
  tokenId?: string;
  kind: 'route' | 'run' | 'block' | 'motion' | 'unknown';
  family: 'vertical' | 'flat' | 'slant' | 'corner' | 'dig' | 'drag' | 'pull' | 'base' | 'unknown';
  confidence: number;
}

export interface ConceptMatch {
  concept: string;
  confidence: number;
  pathIds: string[];
  playerIds: string[];
  why: string[];
}

export interface ConceptAnalysisResult {
  assignments: PathAssignment[];
  concepts: ConceptMatch[];
  notes: string[];
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

function sameSide(player?: PlayerToken) {
  if (!player) return 'middle';
  if (player.x < 450) return 'left';
  if (player.x > 450) return 'right';
  return 'middle';
}

function findPlayer(players: PlayerToken[], tokenId?: string) {
  return players.find((p) => p.token_id === tokenId);
}

function detectStick(assignments: PathAssignment[], players: PlayerToken[]): ConceptMatch | null {
  const routes = assignments.filter((a) => a.kind === 'route');
  const flats = routes.filter((r) => r.family === 'flat');
  const sticks = routes.filter((r) => ['curl', 'out', 'unknown'].includes(String(r.family)));

  for (const flat of flats) {
    const flatPlayer = findPlayer(players, flat.tokenId);
    const flatSide = sameSide(flatPlayer);

    const partner = sticks.find((r) => {
      const p = findPlayer(players, r.tokenId);
      return sameSide(p) === flatSide && r.pathId !== flat.pathId;
    });

    if (partner) {
      return {
        concept: 'stick',
        confidence: 0.58,
        pathIds: [flat.pathId, partner.pathId],
        playerIds: [flat.tokenId, partner.tokenId].filter(Boolean) as string[],
        why: ['Flat route paired with short settle/option route on same side.'],
      };
    }
  }

  return null;
}

function detectShallowCross(assignments: PathAssignment[], players: PlayerToken[]): ConceptMatch | null {
  const drags = assignments.filter((a) => a.kind === 'route' && (a.family === 'drag' || a.family === 'shallow_cross'));
  const digs = assignments.filter((a) => a.kind === 'route' && a.family === 'dig');

  for (const drag of drags) {
    const dragPlayer = findPlayer(players, drag.tokenId);
    const dragSide = sameSide(dragPlayer);

    const basic = digs.find((d) => {
      const p = findPlayer(players, d.tokenId);
      return sameSide(p) !== dragSide;
    });

    if (basic) {
      return {
        concept: 'shallow_cross',
        confidence: 0.72,
        pathIds: [drag.pathId, basic.pathId],
        playerIds: [drag.tokenId, basic.tokenId].filter(Boolean) as string[],
        why: ['Drag paired with intermediate basic/dig from opposite side creates classic shallow structure.'],
      };
    }
  }

  return null;
}

function detectMesh(assignments: PathAssignment[], players: PlayerToken[]): ConceptMatch | null {
  const drags = assignments.filter((a) => a.kind === 'route' && a.family === 'drag');

  if (drags.length >= 2) {
    return {
      concept: 'mesh',
      confidence: 0.63,
      pathIds: drags.slice(0, 2).map((d) => d.pathId),
      playerIds: drags.slice(0, 2).map((d) => d.tokenId).filter(Boolean) as string[],
      why: ['Two shallow crossers suggest a mesh-style concept.'],
    };
  }

  return null;
}

function detectInsideZone(assignments: PathAssignment[], paths: PlayPath[]): ConceptMatch | null {
  const runs = assignments.filter((a) => a.kind === 'run');
  const pulls = assignments.filter((a) => a.kind === 'block' && a.family === 'pull');

  if (runs.length >= 1 && pulls.length === 0) {
    return {
      concept: 'inside_zone',
      confidence: 0.6,
      pathIds: runs.map((r) => r.pathId),
      playerIds: runs.map((r) => r.tokenId).filter(Boolean) as string[],
      why: ['Run track with no puller suggests zone structure, likely inside zone by default.'],
    };
  }

  return null;
}

function detectPower(assignments: PathAssignment[]): ConceptMatch | null {
  const runs = assignments.filter((a) => a.kind === 'run');
  const pulls = assignments.filter((a) => a.kind === 'block' && a.family === 'pull');

  if (runs.length >= 1 && pulls.length >= 1) {
    return {
      concept: 'power',
      confidence: 0.73,
      pathIds: [...runs.map((r) => r.pathId), ...pulls.map((p) => p.pathId)],
      playerIds: [...runs.map((r) => r.tokenId), ...pulls.map((p) => p.tokenId)].filter(Boolean) as string[],
      why: ['Run path plus puller strongly suggests gap scheme, likely power.'],
    };
  }

  return null;
}

export function analyzeConcepts(diagram: PlayDiagram): ConceptAnalysisResult {
  const assignments = diagram.paths.map(inferRouteFamily);
  const concepts = [
    detectStick(assignments, diagram.players),
    detectShallowCross(assignments, diagram.players),
    detectMesh(assignments, diagram.players),
    detectInsideZone(assignments, diagram.paths),
    detectPower(assignments),
  ].filter(Boolean) as ConceptMatch[];

  return {
    assignments,
    concepts: concepts.length ? concepts : [{
      concept: 'unknown',
      confidence: 0.2,
      pathIds: [],
      playerIds: [],
      why: ['No strong concept match yet.'],
    }],
    notes: concepts.length
      ? []
      : ['Concept detection is heuristic in milestone 2 and should be refined with explicit tags later.'],
  };
}