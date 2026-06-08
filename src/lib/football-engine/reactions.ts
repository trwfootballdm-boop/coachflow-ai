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

export function analyzeDefensiveReaction(
  diagram: PlayDiagram,
  conceptResult: ConceptAnalysisResult,
  scenario: DefensiveScenario
): ReactionAnalysisResult {
  const conflicts: ConflictKey[] = [];
  const recommendedReads: string[] = [];
  const notes: string[] = [];

  for (const match of conceptResult.concepts) {
    if (match.concept === 'stick') {
      if (scenario.coverageShell === 'cover_2') {
        conflicts.push({
          defenderRole: 'curl-flat defender',
          stressedBy: ['flat', 'stick'],
          advantage: 'offense',
          why: 'Stick stretches underneath zone horizontally with a quick flat and settle route.',
        });
        recommendedReads.push('Read the flat defender: widen to flat, throw stick; squat inside, take the flat.');
      }

      if (scenario.coverageShell === 'cover_3') {
        conflicts.push({
          defenderRole: 'hook/curl or flat defender',
          stressedBy: ['flat', 'stick seam window'],
          advantage: 'neutral',
          why: 'Stick can still stress underneath defenders, but hook help makes the window tighter than versus Cover 2.',
        });
        recommendedReads.push('Check flat leverage first, then work inside window off hook expansion.');
      }
    }

    if (match.concept === 'shallow_cross') {
      conflicts.push({
        defenderRole: 'second-level hook defenders',
        stressedBy: ['drag', 'basic/dig'],
        advantage: 'offense',
        why: 'Shallow cross forces second-level defenders to handle both low and intermediate threats.',
      });
      recommendedReads.push('Key the hook defender: drive on the drag, replace with the basic; sink under basic, hit the shallow.');
    }

    if (match.concept === 'mesh') {
      conflicts.push({
        defenderRole: 'man chasers / underneath zone defenders',
        stressedBy: ['crossing route 1', 'crossing route 2'],
        advantage: 'offense',
        why: 'Mesh creates traffic and horizontal strain underneath.',
      });
      recommendedReads.push('Work first crosser to second crosser, then settle down over the ball if available.');
    }

    if (match.concept === 'inside_zone') {
      if (scenario.frontFamily === 'even' || scenario.frontFamily === 'over' || scenario.frontFamily === 'under') {
        conflicts.push({
          defenderRole: 'backside C-gap defender',
          stressedBy: ['cutback lane', 'QB read / backside fit'],
          advantage: 'neutral',
          why: 'Inside zone often hinges on the backside fit and whether the defense closes the cutback lane.',
        });
        recommendedReads.push('Check front count and backside fit; identify whether the backside C-gap player is blocked, read, or free.');
      }
    }

    if (match.concept === 'power') {
      conflicts.push({
        defenderRole: 'play-side force / spill player',
        stressedBy: ['kickout', 'lead through gap'],
        advantage: 'neutral',
        why: 'Power challenges the edge-setting or spill defender with a puller and lead path.',
      });
      recommendedReads.push('Track the kickout and the play-side linebacker fit; power is strongest when the pull path creates a clean inside alley.');
    }
  }

  if (scenario.middleField === 'open') {
    notes.push('Middle-of-field open often suggests Cover 2 or Cover 4 families before the snap.');
  }

  if (scenario.middleField === 'closed') {
    notes.push('Middle-of-field closed often suggests Cover 1 or Cover 3 structures before the snap.');
  }

  if (!conflicts.length) {
    notes.push('No clear conflict analysis yet; add richer route families or explicit concept tags.');
  }

  return {
    scenario,
    conflicts,
    notes,
    recommendedReads,
  };
}