import type { PlayDiagram } from './types';
import type { ConceptAnalysisResult } from './concepts';
import type { DefensiveScenario } from './adjustments';
import type { TimingAnalysisResult } from './timing';
import type { AdjustmentAnalysisResult } from './adjustments';

export interface InstallChecklistItem {
  id: string;
  label: string;
  status: 'complete' | 'partial' | 'missing';
  notes: string[];
}

export interface InstallReport {
  concept: string;
  readyToInstall: boolean;
  readyToCall: boolean;
  checklist: InstallChecklistItem[];
  summary: string[];
}

export function buildInstallReport(input: {
  diagram: PlayDiagram;
  play: {
    formation?: string;
    personnel?: string;
    motion?: string;
    coaching_points?: string;
    notes?: string;
    name?: string;
    play_name?: string;
  };
  concepts: ConceptAnalysisResult;
  timing: TimingAnalysisResult;
  adjustments: AdjustmentAnalysisResult;
  scenario?: DefensiveScenario;
}): InstallReport {
  const { diagram, play, concepts, timing, adjustments } = input;
  const concept = concepts.concepts[0]?.concept || 'unknown';

  const checklist: InstallChecklistItem[] = [];

  checklist.push({
    id: 'formation',
    label: 'Formation defined',
    status: play.formation ? 'complete' : 'missing',
    notes: play.formation ? [play.formation] : ['Add a named formation for install language.'],
  });

  checklist.push({
    id: 'personnel',
    label: 'Personnel defined',
    status: play.personnel ? 'complete' : 'missing',
    notes: play.personnel ? [play.personnel] : ['Attach personnel grouping so the play fits call-sheet logic.'],
  });

  checklist.push({
    id: 'concept',
    label: 'Primary concept identified',
    status: concept !== 'unknown' ? 'complete' : 'partial',
    notes:
      concept !== 'unknown'
        ? [`Detected concept: ${concept}.`]
        : ['Concept inference is weak; add explicit concept tag or stronger route structure.'],
  });

  checklist.push({
    id: 'timing',
    label: 'QB timing / progression defined',
    status: timing.progression.length >= 2 ? 'complete' : 'partial',
    notes: [
      `Drop family: ${timing.dropFamily}.`,
      `Timing verdict: ${timing.verdict.summary}`,
    ],
  });

  checklist.push({
    id: 'pressure-answer',
    label: 'Pressure answer installed',
    status: adjustments.applied.some((a) => a.kind === 'hot' || a.kind === 'protection')
      ? 'complete'
      : 'missing',
    notes:
      adjustments.applied.some((a) => a.kind === 'hot' || a.kind === 'protection')
        ? ['Pressure answer found.']
        : ['Install a hot route, protection check, or built-in pressure answer.'],
  });

  checklist.push({
    id: 'coverage-answer',
    label: 'Coverage answer installed',
    status: adjustments.applied.some((a) => a.kind === 'sight')
      ? 'complete'
      : ['stick', 'mesh', 'shallow_cross'].includes(concept)
      ? 'partial'
      : 'complete',
    notes:
      adjustments.applied.some((a) => a.kind === 'sight')
        ? ['Coverage-based answer found.']
        : ['Add a sight adjustment if this concept changes versus man or zone.'],
  });

  checklist.push({
    id: 'motion',
    label: 'Motion / tag rules defined',
    status: play.motion || adjustments.applied.some((a) => a.kind === 'motion' || a.kind === 'formation_tag')
      ? 'complete'
      : 'partial',
    notes:
      play.motion
        ? [`Play motion: ${play.motion}`]
        : ['Optional, but useful if you want multiple presentations of the same concept.'],
  });

  checklist.push({
    id: 'coaching-points',
    label: 'Coaching points written',
    status: play.coaching_points ? 'complete' : 'missing',
    notes:
      play.coaching_points
        ? ['Coaching points available for player install.']
        : ['Write player-facing coaching points for QB, skill, and OL responsibilities.'],
  });

  checklist.push({
    id: 'assignment-completeness',
    label: 'Core assignments present',
    status: diagram.paths.length > 0 ? 'complete' : 'missing',
    notes:
      diagram.paths.length > 0
        ? [`${diagram.paths.length} path assignments found.`]
        : ['No path assignments found in the diagram.'],
  });

  const missingCount = checklist.filter((c) => c.status === 'missing').length;
  const partialCount = checklist.filter((c) => c.status === 'partial').length;

  const readyToInstall = missingCount <= 2;
  const readyToCall = missingCount === 0 && partialCount <= 1 && timing.verdict.status !== 'busted';

  const summary = [
    readyToInstall
      ? 'Play is organized well enough to begin install.'
      : 'Play needs more structure before a clean install.',
    readyToCall
      ? 'Play appears ready for call-sheet use.'
      : 'Play still needs answers or teaching detail before game-night use.',
    ...adjustments.installFlags,
  ];

  return {
    concept,
    readyToInstall,
    readyToCall,
    checklist,
    summary,
  };
}