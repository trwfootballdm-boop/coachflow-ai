import { seedCalls, seedConcepts } from '@/lib/football-engine/seedData';
import { base44 } from '@/api/base44Client';

// Maps seedData concept families → Play entity run_pass / play_type fields
const FAMILY_MAP = {
  run:         { run_pass: 'run',   play_type: 'run' },
  quick:       { run_pass: 'pass',  play_type: 'pass' },
  dropback:    { run_pass: 'pass',  play_type: 'pass' },
  screen:      { run_pass: 'pass',  play_type: 'screen' },
  play_action: { run_pass: 'pass',  play_type: 'play_action' },
};

// Maps seedData situations → Play field_zone_tags / down_distance_tags
const SITUATION_TO_FIELD_ZONE = {
  red_zone:    'red_zone',
  goal_line:   'goal_line',
  backed_up:   'backed_up',
  base:        'any',
  midfield:    'midfield',
};

const SITUATION_TO_DOWN = {
  first_and_ten:  '1st-10',
  second_short:   '2nd-short',
  second_medium:  '2nd-medium',
  second_long:    '2nd-long',
  third_short:    '3rd-short',
  third_medium:   '3rd-medium',
  third_long:     '3rd-long',
  two_minute:     '2-minute',
  pressure:       '3rd-short',
  shot:           '1st-10',
};

export async function seedPlaysForTeam(teamId) {
  const plays = [];

  for (const call of seedCalls) {
    const concept = seedConcepts.find(c => c.id === call.conceptId);
    if (!concept) continue;

    const typeInfo = FAMILY_MAP[concept.family] || { run_pass: 'pass', play_type: 'pass' };

    const fieldZone = [...new Set(
      (call.situations || [])
        .map(s => SITUATION_TO_FIELD_ZONE[s])
        .filter(Boolean)
    )];

    const downDistance = [...new Set(
      (call.situations || [])
        .map(s => SITUATION_TO_DOWN[s])
        .filter(Boolean)
    )];

    plays.push({
      team_id:             teamId,
      name:                call.callName,
      play_name:           call.callName,
      short_name:          call.callName.split(' ').slice(-2).join(' '),
      side:                'offense',
      run_pass:            typeInfo.run_pass,
      play_type:           typeInfo.play_type,
      play_family:         concept.family,
      formation:           call.formation,
      personnel:           call.personnel || '11',
      motion:              call.motion || '',
      concept:             concept.name,
      direction:           'any',
      strength:            'any',
      field_zone_tags:     fieldZone.length ? fieldZone : ['any'],
      down_distance_tags:  downDistance,
      hash_tags:           ['any'],
      install_day:         concept.installTier,
      install_week:        1,
      age_level_difficulty: 'youth',
      risk_level:          concept.installTier === 1 ? 'low' : concept.installTier === 2 ? 'medium' : 'high',
      coaching_points:     concept.teachingPoints?.join('\n') || '',
      tags:                call.tags || [],
      is_favorite:         !!call.weeklyDefault,
      is_active:           true,
      version:             1,
    });
  }

  return base44.entities.Play.bulkCreate(plays);
}