// src/lib/football-engine/timing.ts

import type { PlayDiagram } from './types';
import type { ConceptAnalysisResult } from './concepts';
import type { DefensiveScenario } from './reactions';

export type DropFamily =
  | 'quick'
  | 'three_step'
  | 'five_step'
  | 'seven_step'
  | 'play_action'
  | 'gun_quick'
  | 'unknown';

export interface RouteTimingWindow {
  pathId: string;
  tokenId?: string;
  family: string;
  readyAtMs: number;
  closeAtMs: number;
  peakAtMs: number;
  notes: string[];
}

export interface PressureWindow {
  source: 'base_rush' | 'blitz' | 'overload' | 'free_runner';
  arriveAtMs: number;
  severity: 'low' | 'medium' | 'high';
  notes: string[];
}

export interface ProgressionRead {
  label: string;
  pathId?: string;
  tokenId?: string;
  readOrder: number;
  expectedWindowMs: number;
  notes: string[];
}

export interface TimingAnalysisResult {
  dropFamily: DropFamily;
  dropTimeMs: number;
  routeWindows: RouteTimingWindow[];
  pressure: PressureWindow;
  progression: ProgressionRead[];
  verdict: {
    status: 'on_time' | 'tight_window' | 'late' | 'busted';
    summary: string;
  };
  notes: string[];
}

const DROP_TIMES: Record<DropFamily, number> = {
  quick: 1200,
  three_step: 1400,
  five_step: 2100,
  seven_step: 2800,
  play_action: 2600,
  gun_quick: 1100,
  unknown: 1800,
};

function inferDropFamily(concepts: ConceptAnalysisResult): DropFamily {
  const ids = concepts.concepts.map((c) => c.concept);

  if (ids.includes('stick') || ids.includes('snag')) return 'quick';
  if (ids.includes('mesh') || ids.includes('shallow_cross')) return 'five_step';
  if (ids.includes('four_verts') || ids.includes('smash')) return 'five_step';
  if (ids.includes('inside_zone') || ids.includes('power') || ids.includes('counter')) return 'play_action';

  return 'unknown';
}

function inferPathWindow(family: string): { readyAtMs: number; peakAtMs: number; closeAtMs: number; notes: string[] } {
  switch (family) {
    case 'flat':
      return { readyAtMs: 900, peakAtMs: 1200, closeAtMs: 1800, notes: ['Fast outlet timing.'] };
    case 'slant':
      return { readyAtMs: 1100, peakAtMs: 1450, closeAtMs: 2100, notes: ['Quick in-breaking window.'] };
    case 'drag':
    case 'shallow_cross':
      return { readyAtMs: 1400, peakAtMs: 1900, closeAtMs: 2600, notes: ['Works after underneath movement starts.'] };
    case 'dig':
      return { readyAtMs: 2200, peakAtMs: 2600, closeAtMs: 3200, notes: ['Intermediate route; usually later than quick game.'] };
    case 'corner':
      return { readyAtMs: 2100, peakAtMs: 2600, closeAtMs: 3200, notes: ['High-low timing on the outside.'] };
    case 'vertical':
    case 'go':
      return { readyAtMs: 2600, peakAtMs: 3200, closeAtMs: 4000, notes: ['Needs time and protection.'] };
    case 'run':
      return { readyAtMs: 700, peakAtMs: 1200, closeAtMs: 2200, notes: ['Backfield action develops immediately.'] };
    default:
      return { readyAtMs: 1500, peakAtMs: 2100, closeAtMs: 2800, notes: ['Generic timing estimate.'] };
  }
}

function inferPressureWindow(
  diagram: PlayDiagram,
  scenario?: DefensiveScenario
): PressureWindow {
  const blockers = diagram.players.filter(
    (p) => p.team_side === 'offense' && ['lineman', 'blocker', 'ball_carrier'].includes(String(p.role_type))
  ).length;

  let rushers = 4;
  if (scenario?.pressure === '5man') rushers = 5;
  if (scenario?.pressure === '6man') rushers = 6;

  if (scenario?.pressure === 'none') {
    return {
      source: 'base_rush',
      arriveAtMs: 2800,
      severity: 'low',
      notes: ['Minimal pressure look assumed.'],
    };
  }

  if (rushers > blockers) {
    return {
      source: rushers - blockers >= 2 ? 'free_runner' : 'overload',
      arriveAtMs: 1700,
      severity: 'high',
      notes: ['Rush count exceeds likely protection count. Throw hot or add protection.'],
    };
  }

  if (scenario?.pressure === '5man' || scenario?.pressure === '6man') {
    return {
      source: 'blitz',
      arriveAtMs: 2100,
      severity: 'medium',
      notes: ['Pressure accelerated by added rusher.'],
    };
  }

  return {
    source: 'base_rush',
    arriveAtMs: 2500,
    severity: 'medium',
    notes: ['Standard four-man pressure estimate.'],
  };
}

function buildProgression(concepts: ConceptAnalysisResult): ProgressionRead[] {
  const concept = concepts.concepts[0];

  if (!concept) return [];

  switch (concept.concept) {
    case 'stick':
      return [
        { label: 'Flat control', readOrder: 1, expectedWindowMs: 1000, notes: ['Read the flat defender first.'] },
        { label: 'Stick / settle', readOrder: 2, expectedWindowMs: 1400, notes: ['Replace the defender if he widens.'] },
        { label: 'Checkdown', readOrder: 3, expectedWindowMs: 1900, notes: ['Take outlet if window compresses.'] },
      ];
    case 'shallow_cross':
      return [
        { label: 'Shallow', readOrder: 1, expectedWindowMs: 1600, notes: ['Take easy underneath win if available.'] },
        { label: 'Basic / dig', readOrder: 2, expectedWindowMs: 2400, notes: ['Replace hook defender if he drives shallow.'] },
        { label: 'Outlet', readOrder: 3, expectedWindowMs: 2800, notes: ['Check ball down if pressure closes pocket.'] },
      ];
    case 'mesh':
      return [
        { label: 'First crosser', readOrder: 1, expectedWindowMs: 1600, notes: ['Work first shallow runner.'] },
        { label: 'Second crosser', readOrder: 2, expectedWindowMs: 1850, notes: ['Come across the mesh.'] },
        { label: 'Sit / settle', readOrder: 3, expectedWindowMs: 2200, notes: ['Find open grass over the ball.'] },
      ];
    case 'inside_zone':
      return [
        { label: 'Front count', readOrder: 1, expectedWindowMs: 0, notes: ['Count box and identify backside fit.'] },
        { label: 'Mesh / handoff', readOrder: 2, expectedWindowMs: 700, notes: ['Ride the mesh and confirm lane.'] },
        { label: 'Cutback / bang', readOrder: 3, expectedWindowMs: 1400, notes: ['Hit cutback if backside fit overcommits.'] },
      ];
    case 'power':
      return [
        { label: 'Kickout read', readOrder: 1, expectedWindowMs: 400, notes: ['Confirm kickout on edge defender.'] },
        { label: 'Gap fit', readOrder: 2, expectedWindowMs: 900, notes: ['Hit designated gap with lead blocker.'] },
        { label: ' Alley / bounce', readOrder: 3, expectedWindowMs: 1500, notes: ['Bend it back if alley closes.'] },
      ];
    default:
      return [
        { label: 'Primary', readOrder: 1, expectedWindowMs: 1800, notes: ['Work first read in progression.'] },
        { label: 'Secondary', readOrder: 2, expectedWindowMs: 2400, notes: ['Move to next read if covered.'] },
        { label: 'Outlet', readOrder: 3, expectedWindowMs: 2900, notes: ['Check down before pressure arrives.'] },
      ];
  }
}

export function analyzeTiming(
  diagram: PlayDiagram,
  concepts: ConceptAnalysisResult,
  scenario?: DefensiveScenario,
): TimingAnalysisResult {
  const dropFamily = inferDropFamily(concepts);
  const dropTimeMs = DROP_TIMES[dropFamily];

  const routeWindows: RouteTimingWindow[] = concepts.assignments.map((a) => {
    const timing = inferPathWindow(a.family);
    return {
      pathId: a.pathId,
      tokenId: a.tokenId,
      family: a.family,
      ...timing,
    };
  });

  const pressure = inferPressureWindow(diagram, scenario);

  const progression = buildProgression(concepts);

  let status: 'on_time' | 'tight_window' | 'late' | 'busted' = 'on_time';
  const summaryParts: string[] = [];

  if (pressure.arriveAtMs < dropTimeMs) {
    status = pressure.arriveAtMs < dropTimeMs - 600 ? 'busted' : 'tight_window';
    summaryParts.push(`Pressure arrives ${Math.round((dropTimeMs - pressure.arriveAtMs) / 100) / 10}s before drop.`);
  }

  const readyRoutes = routeWindows.filter((r) => r.readyAtMs <= dropTimeMs);
  if (readyRoutes.length === 0) {
    status = 'late';
    summaryParts.push('No routes ready by expected drop time.');
  } else if (readyRoutes.length < Math.ceil(routeWindows.length / 2)) {
    status = status === 'on_time' ? 'tight_window' : status;
    summaryParts.push('Limited windows available at drop time.');
  }

  return {
    dropFamily,
    dropTimeMs,
    routeWindows,
    pressure,
    progression,
    verdict: {
      status,
      summary: summaryParts.join(' ') || 'Timing windows align with concept.',
    },
    notes: [
      `Drop family: ${dropFamily.replace('_', ' ')}.`,
      `Expected drop: ${(dropTimeMs / 1000).toFixed(1)}s.`,
      `Pressure severity: ${pressure.severity}.`,
    ],
  };
}