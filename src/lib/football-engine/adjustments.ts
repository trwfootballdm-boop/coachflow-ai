import type { PlayDiagram, PlayPath } from './types';
import type { ConceptAnalysisResult } from './concepts';
import type { DefensiveScenario } from './reactions';

export interface Adjustment {
  kind: 'hot' | 'protection' | 'sight' | 'motion' | 'formation_tag' | 'route_modification';
  targetTokenId?: string;
  description: string;
  trigger: string;
  priority: number;
}

export interface AdjustmentAnalysisResult {
  applied: Adjustment[];
  recommended: Adjustment[];
  installFlags: string[];
  confidence: number;
}

export function analyzeAdjustments(
  diagram: PlayDiagram,
  concepts: ConceptAnalysisResult,
  scenario: DefensiveScenario
): AdjustmentAnalysisResult {
  const applied: Adjustment[] = [];
  const recommended: Adjustment[] = [];
  const installFlags: string[] = [];

  const primaryConcept = concepts.concepts[0]?.concept || '';

  // Hot route analysis vs pressure
  if (scenario.pressure === '5man' || scenario.pressure === 'blitz') {
    const rb = diagram.players.find((p) => p.position_code === 'RB');
    if (rb) {
      const rbPath = diagram.paths.find((p) => p.path_token_id === rb.token_id);
      if (rbPath && rbPath.points.length > 0) {
        applied.push({
          kind: 'hot',
          targetTokenId: rb.token_id,
          description: 'RB releases to flat vs pressure',
          trigger: '5+ rushers',
          priority: 1,
        });
        installFlags.push('RB hot route installed');
      } else {
        recommended.push({
          kind: 'hot',
          targetTokenId: rb.token_id,
          description: 'Add hot route for RB vs pressure',
          trigger: '5+ rushers',
          priority: 1,
        });
      }
    }
  }

  // Sight adjustments for zone vs man
  if (primaryConcept === 'stick' || primaryConcept === 'mesh' || primaryConcept === 'shallow_cross') {
    const wrs = diagram.players.filter((p) => p.role_type === 'receiver');
    if (scenario.coverageShell === 'cover_2' || scenario.coverageShell === 'cover_4') {
      applied.push({
        kind: 'sight',
        description: 'Break open vs zone leverage',
        trigger: 'Zone coverage',
        priority: 2,
      });
      installFlags.push('Sight adjustments vs zone');
    }
    if (scenario.coverageShell === 'cover_1' || scenario.coverageShell === 'cover_0') {
      applied.push({
        kind: 'sight',
        description: 'Break open vs man leverage',
        trigger: 'Man coverage',
        priority: 2,
      });
      installFlags.push('Sight adjustments vs man');
    }
  }

  // Motion recommendations for conflict creation
  if (scenario.frontFamily === 'odd' && primaryConcept.includes('zone')) {
    recommended.push({
      kind: 'motion',
      description: 'Jet or orbit motion to identify coverage / create conflict',
      trigger: 'Pre-snap',
      priority: 3,
    });
  }

  // Formation tags for boundary/field
  if (primaryConcept === 'vertical' || primaryConcept === 'deep_shot') {
    applied.push({
      kind: 'formation_tag',
      description: 'Field/boundary tags for vertical concepts',
      trigger: 'Hash alignment',
      priority: 2,
    });
    installFlags.push('Field/boundary tags installed');
  }

  // Protection checks
  const ol = diagram.players.filter((p) => p.role_type === 'lineman');
  if (ol.length >= 5 && scenario.pressure === '5man') {
    applied.push({
      kind: 'protection',
      description: 'Slide protection call vs odd front',
      trigger: '5+ rushers',
      priority: 1,
    });
    installFlags.push('Protection scheme defined');
  }

  const confidence = applied.length > 0 ? 0.75 : recommended.length > 0 ? 0.5 : 0.3;

  return {
    applied,
    recommended,
    installFlags,
    confidence,
  };
}