import type { PlayDiagram } from './types';
import type { ConceptAnalysisResult } from './concepts';
import type { TimingAnalysisResult } from './timing';

export interface DefensiveScenario {
  coverageShell: 'cover_0' | 'cover_1' | 'cover_2' | 'cover_3' | 'cover_4' | 'man' | 'zone';
  frontFamily: 'even' | 'odd' | 'bear' | '3-3-5';
  pressure: '4man' | '5man' | '6man' | 'blitz';
  middleField: 'open' | 'closed';
}

export interface Adjustment {
  kind: 'hot' | 'protection' | 'sight' | 'motion' | 'formation_tag' | 'route_adjustment';
  position: string;
  description: string;
  trigger: string;
  confidence: number;
}

export interface AdjustmentAnalysisResult {
  applied: Adjustment[];
  installFlags: string[];
  warnings: string[];
  readyForInstall: boolean;
}

export function analyzeAdjustments(
  diagram: PlayDiagram,
  concepts: ConceptAnalysisResult,
  timing: TimingAnalysisResult,
  scenario: DefensiveScenario
): AdjustmentAnalysisResult {
  const adjustments: Adjustment[] = [];
  const installFlags: string[] = [];
  const warnings: string[] = [];

  const primaryConcept = concepts?.concepts?.[0]?.concept || 'unknown';
  const dropFamily = timing?.dropFamily || '';
  const motionRecs = concepts?.motionRecommendations || [];

  // Hot route adjustments for pressure
  if (scenario.pressure === '5man' || scenario.pressure === '6man' || scenario.pressure === 'blitz') {
    const rbPlayer = diagram?.players?.find((p) => p.position_code === 'RB');
    if (rbPlayer) {
      const rbPath = diagram?.paths?.find((path) => path.player_token_id === rbPlayer.token_id);
      if (!rbPath || rbPath.path_type === 'block') {
        adjustments.push({
          kind: 'hot',
          position: 'RB',
          description: 'RB hot route to flat or check-release',
          trigger: '5+ rushers',
          confidence: 0.8,
        });
        installFlags.push('Hot route installed for RB vs pressure');
      }
    }
  }

  // Protection adjustments
  if (dropFamily.includes('5-step') || dropFamily.includes('7-step')) {
    if (scenario.pressure === '5man' || scenario.pressure === '6man') {
      adjustments.push({
        kind: 'protection',
        position: 'OL',
        description: 'Slide protection away from pressure or man protection',
        trigger: '5+ rushers with deep drop',
        confidence: 0.7,
      });
      installFlags.push('Protection slide required for deep drop');
    }
  }

  // Sight adjustments for zone vs man
  if (primaryConcept === 'mesh' || primaryConcept === 'stick' || primaryConcept === 'shallow_cross') {
    if (scenario.coverageShell === 'man' || scenario.coverageShell === 'cover_1') {
      adjustments.push({
        kind: 'sight',
        position: 'WR',
        description: 'Break off route at 12-15 yards vs man coverage',
        trigger: 'Man coverage look',
        confidence: 0.75,
      });
      installFlags.push('Sight adjustment: break off vs man');
    }
  }

  // Motion adjustments for coverage identification
  if (motionRecs.length > 0) {
    adjustments.push({
      kind: 'motion',
      position: motionRecs[0]?.position || 'WR',
      description: motionRecs[0]?.recommendation || 'Pre-snap motion',
      trigger: 'Coverage identification',
      confidence: 0.6,
    });
    installFlags.push('Motion recommended for coverage ID');
  }

  // Formation tags for field/boundary
  const offensivePlayers = diagram?.players?.filter((p) => p.team_side === 'offense') || [];
  if (offensivePlayers.length <= 4) {
    adjustments.push({
      kind: 'formation_tag',
      position: 'WR',
      description: 'Add receiver to boundary side',
      trigger: 'Empty or reduced formation',
      confidence: 0.5,
    });
    warnings.push('Reduced formation may limit optionality');
  }

  const readyForInstall = warnings.length === 0 && adjustments.length >= 1;

  return {
    applied: adjustments,
    installFlags,
    warnings,
    readyForInstall,
  };
}