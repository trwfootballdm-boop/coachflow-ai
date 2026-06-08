// src/lib/football-engine/reactions.ts

import type { PlayDiagram } from './types';
import type { ConceptAnalysisResult } from './concepts';

export type CoverageShell =
  | 'cover_0'
  | 'cover_1'
  | 'cover_2'
  | 'cover_3'
  | 'cover_4'
  | 'quarters'
  | 'unknown';

export type FrontFamily =
  | 'even'
  | 'odd'
  | 'bear'
  | 'over'
  | 'under'
  | 'unknown';

export interface DefensiveScenario {
  coverageShell: CoverageShell;
  frontFamily?: FrontFamily;
  pressure?: 'none' | '4man' | '5man' | '6man';
  middleField?: 'open' | 'closed' | 'unknown';
}

export interface ConflictKey {
  defenderRole: string;
  stressedBy: string[];
  advantage: 'offense' | 'defense' | 'neutral';
  why: string;
}

export interface ReactionAnalysisResult {
  scenario: DefensiveScenario;
  conflicts: ConflictKey[];
  notes: string[];
  recommendedReads: string[];
}

export function inferCoverageShell(diagram: PlayDiagram, conceptResult?: ConceptAnalysisResult): DefensiveScenario {
  const offenseCount = diagram.players.filter((p) => p.team_side === 'offense').length;
  const defenseCount = diagram.players.filter((p) => p.team_side === 'defense').length;

  const deepDefenders = diagram.players.filter((p) => p.team_side === 'defense' && p.y && p.y < 200).length;
  const boxDefenders = diagram.players.filter((p) => p.team_side === 'defense' && p.y && p.y >= 200).length;

  let coverageShell: CoverageShell = 'unknown';

  if (deepDefenders === 0) {
    coverageShell = 'cover_0';
  } else if (deepDefenders === 1) {
    coverageShell = 'cover_1';
  } else if (deepDefenders === 2) {
    coverageShell = 'cover_2';
  } else if (deepDefenders === 3) {
    coverageShell = 'cover_3';
  } else if (deepDefenders >= 4) {
    coverageShell = 'cover_4';
  }

  let pressure: 'none' | '4man' | '5man' | '6man' = 'none';
  const rushers = diagram.players.filter((p) => p.team_side === 'defense' && p.role_type === 'defender' && p.y && p.y > 280).length;
  if (rushers <= 4) pressure = '4man';
  else if (rushers === 5) pressure = '5man';
  else if (rushers >= 6) pressure = '6man';

  let middleField: 'open' | 'closed' | 'unknown' = 'unknown';
  if (coverageShell === 'cover_2' || coverageShell === 'cover_4' || coverageShell === 'quarters') {
    middleField = 'open';
  } else if (coverageShell === 'cover_1' || coverageShell === 'cover_3') {
    middleField = 'closed';
  }

  return {
    coverageShell,
    pressure,
    middleField,
  };
}

export function identifyConflicts(
  diagram: PlayDiagram,
  conceptResult: ConceptAnalysisResult,
  scenario: DefensiveScenario,
): ConflictKey[] {
  const conflicts: ConflictKey[] = [];

  const stickConcept = conceptResult.concepts.find((c) => c.concept === 'stick');
  if (stickConcept && scenario.coverageShell === 'cover_3') {
    conflicts.push({
      defenderRole: 'Flat defender (CB/O LB)',
      stressedBy: stickConcept.playerIds,
      advantage: 'offense',
      why: 'Stick concept creates high-low stress on flat defender with vertical clear-out.',
    });
  }

  const meshConcept = conceptResult.concepts.find((c) => c.concept === 'mesh');
  if (meshConcept && (scenario.coverageShell === 'cover_2' || scenario.coverageShell === 'cover_4')) {
    conflicts.push({
      defenderRole: 'Underneath zone defenders',
      stressedBy: meshConcept.playerIds,
      advantage: 'offense',
      why: 'Mesh concept creates rub/pick situations against zone defenders in shallow areas.',
    });
  }

  const shallowCrossConcept = conceptResult.concepts.find((c) => c.concept === 'shallow_cross');
  if (shallowCrossConcept && scenario.coverageShell === 'cover_1') {
    conflicts.push({
      defenderRole: 'Man coverage underneath',
      stressedBy: shallowCrossConcept.playerIds,
      advantage: 'offense',
      why: 'Shallow cross creates natural picks against man coverage.',
    });
  }

  const powerConcept = conceptResult.concepts.find((c) => c.concept === 'power');
  if (powerConcept && scenario.frontFamily === 'odd') {
    conflicts.push({
      defenderRole: 'Front-side linebacker',
      stressedBy: powerConcept.playerIds,
      advantage: 'offense',
      why: 'Power run with puller creates numbers advantage vs odd front.',
    });
  }

  return conflicts;
}

export function analyzeReactions(
  diagram: PlayDiagram,
  conceptResult: ConceptAnalysisResult,
): ReactionAnalysisResult {
  const scenario = inferCoverageShell(diagram, conceptResult);
  const conflicts = identifyConflicts(diagram, conceptResult, scenario);

  const recommendedReads: string[] = [];

  if (scenario.coverageShell === 'cover_3') {
    recommendedReads.push('Read the deep-third defender leverage vs verticals');
    recommendedReads.push('Attack seams between deep thirds');
  } else if (scenario.coverageShell === 'cover_2') {
    recommendedReads.push('Read the two-deep safeties for hole shots');
    recommendedReads.push('Attack underneath zones before they settle');
  } else if (scenario.coverageShell === 'cover_1') {
    recommendedReads.push('Identify single-high safety and attack man coverage');
    recommendedReads.push('Look for natural picks and rubs');
  }

  if (scenario.pressure === '5man' || scenario.pressure === '6man') {
    recommendedReads.push('Identify blitzers pre-snap and adjust protection');
    recommendedReads.push('Look for hot routes vs pressure');
  }

  return {
    scenario,
    conflicts,
    notes: conflicts.length
      ? []
      : ['No major conflicts identified - this is a base vs base look.'],
    recommendedReads,
  };
}