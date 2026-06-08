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

const DEFAULT_DROP_TIMES: Record<DropFamily, number> = {
  quick: 1200,
  three_step: 1600,
  five_step: 2400,
  seven_step: 3200,
  play_action: 3000,
  gun_quick: 1400,
  unknown: 2000,
};

const ROUTE_TIMING_PROFILES: Record<string, { ready: number; peak: number; close: number }> = {
  vertical: { ready: 2800, peak: 3200, close: 4000 },
  flat: { ready: 1200, peak: 1600, close: 2400 },
  slant: { ready: 1400, peak: 1800, close: 2600 },
  corner: { ready: 2600, peak: 3000, close: 3800 },
  dig: { ready: 2200, peak: 2600, close: 3400 },
  drag: { ready: 1600, peak: 2000, close: 3000 },
  curl: { ready: 1800, peak: 2200, close: 3200 },
  out: { ready: 1600, peak: 2000, close: 2800 },
  unknown: { ready: 2000, peak: 2500, close: 3500 },
};

function inferDropFamily(conceptResult: ConceptAnalysisResult, formation?: string): DropFamily {
  const hasQuickRoutes = conceptResult.concepts.some((c) =>
    ['stick', 'mesh', 'shallow_cross'].includes(c.concept)
  );

  if (hasQuickRoutes) return 'three_step';

  const hasDeepConcepts = conceptResult.concepts.some((c) =>
    c.concept === 'verticals' || c.concept === 'deep_shot'
  );

  if (hasDeepConcepts) return 'five_step';

  if (formation?.toLowerCase().includes('shotgun')) return 'gun_quick';

  return 'three_step';
}

function estimatePressure(scenario: DefensiveScenario): PressureWindow {
  const basePressure: PressureWindow = {
    source: 'base_rush',
    arriveAtMs: 2800,
    severity: 'medium',
    notes: ['Standard 4-man rush timing'],
  };

  if (scenario.pressure === '5man' || scenario.pressure === '6man') {
    return {
      source: 'blitz',
      arriveAtMs: scenario.pressure === '6man' ? 1800 : 2200,
      severity: 'high',
      notes: [
        'Extra rusher(s) detected',
        'Pressure arrives faster than standard drop',
        'Consider quick game or hot routes',
      ],
    };
  }

  return basePressure;
}

function buildRouteWindows(conceptResult: ConceptAnalysisResult): RouteTimingWindow[] {
  const windows: RouteTimingWindow[] = [];

  for (const match of conceptResult.concepts) {
    for (const pathId of match.pathIds) {
      const tokenId = match.playerIds?.[0];
      const family = match.pathFamilies?.[0] || 'unknown';
      const profile = ROUTE_TIMING_PROFILES[family] || ROUTE_TIMING_PROFILES.unknown;

      windows.push({
        pathId,
        tokenId,
        family,
        readyAtMs: profile.ready,
        peakAtMs: profile.peak,
        closeAtMs: profile.close,
        notes: [`${family} route timing window`],
      });
    }
  }

  return windows.sort((a, b) => a.readyAtMs - b.readyAtMs);
}

function buildProgression(
  conceptResult: ConceptAnalysisResult,
  routeWindows: RouteTimingWindow[],
  dropFamily: DropFamily,
): ProgressionRead[] {
  const progression: ProgressionRead[] = [];

  for (const match of conceptResult.concepts) {
    const primaryPathId = match.pathIds[0];
    const primaryTokenId = match.playerIds?.[0];

    progression.push({
      label: `${match.concept} - primary read`,
      pathId: primaryPathId,
      tokenId: primaryTokenId,
      readOrder: progression.length + 1,
      expectedWindowMs: routeWindows.find((w) => w.pathId === primaryPathId)?.readyAtMs || 2000,
      notes: [
        match.why || `Read ${match.concept} concept first`,
        `Confidence: ${(match.confidence * 100).toFixed(0)}%`,
      ],
    });
  }

  return progression;
}

function determineVerdict(
  dropTimeMs: number,
  pressure: PressureWindow,
  routeWindows: RouteTimingWindow[],
): { status: 'on_time' | 'tight_window' | 'late' | 'busted'; summary: string } {
  const earliestRoute = routeWindows[0];
  if (!earliestRoute) {
    return {
      status: 'busted',
      summary: 'No route timing windows identified - play may be incomplete',
    };
  }

  if (pressure.arriveAtMs < dropTimeMs - 400) {
    return {
      status: 'late',
      summary: `Pressure arrives at ${pressure.arriveAtMs}ms, before drop completion at ${dropTimeMs}ms`,
    };
  }

  if (pressure.arriveAtMs < dropTimeMs + 200) {
    return {
      status: 'tight_window',
      summary: `Tight timing: pressure arrives shortly after drop, need quick progression`,
    };
  }

  if (earliestRoute.readyAtMs > dropTimeMs + 600) {
    return {
      status: 'late',
      summary: `First route window opens at ${earliestRoute.readyAtMs}ms, significantly after drop`,
    };
  }

  return {
    status: 'on_time',
    summary: 'Timing is on schedule: drop, read, and throw windows align properly',
  };
}

export function analyzeTiming(
  diagram: PlayDiagram,
  conceptResult: ConceptAnalysisResult,
  scenario: DefensiveScenario,
  formation?: string,
): TimingAnalysisResult {
  const dropFamily = inferDropFamily(conceptResult, formation);
  const dropTimeMs = DEFAULT_DROP_TIMES[dropFamily];
  const routeWindows = buildRouteWindows(conceptResult);
  const pressure = estimatePressure(scenario);
  const progression = buildProgression(conceptResult, routeWindows, dropFamily);
  const verdict = determineVerdict(dropTimeMs, pressure, routeWindows);

  const notes: string[] = [];

  if (dropFamily === 'three_step' && pressure.severity === 'high') {
    notes.push('Quick drop matches well against pressure - get ball out fast');
  }

  if (dropFamily === 'seven_step' && pressure.severity === 'high') {
    notes.push('WARNING: Deep drop vs pressure - consider max protection or hot routes');
  }

  if (routeWindows.length === 0) {
    notes.push('No route timing data available - ensure routes are drawn on diagram');
  }

  return {
    dropFamily,
    dropTimeMs,
    routeWindows,
    pressure,
    progression,
    verdict,
    notes,
  };
}