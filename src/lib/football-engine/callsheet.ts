export type CallSheetBucket =
  | 'opening_script'
  | 'first_and_ten'
  | 'second_short'
  | 'second_medium'
  | 'second_long'
  | 'third_short'
  | 'third_medium'
  | 'third_long'
  | 'fourth_short'
  | 'red_zone'
  | 'backed_up'
  | 'two_minute'
  | 'four_minute'
  | 'shot_plays'
  | 'zero_answers'
  | 'favorites'
  | 'gimmicks'
  | 'notes';

export interface CallSheetPlay {
  playId: string;
  playName: string;
  concept: string;
  formation?: string;
  personnel?: string;
  tags?: string[];
  situations?: string[];
  preferredLook?: string[];
  bestFor?: string[];
  notes?: string[];
  openerScore?: number;
}

export interface CallSheetSection {
  bucket: CallSheetBucket;
  label: string;
  plays: CallSheetPlay[];
  notes: string[];
}

export interface CallSheet {
  weekLabel: string;
  opponent?: string;
  sections: CallSheetSection[];
  summary: string[];
}

export interface CallSheetInputPlay {
  id: string;
  name: string;
  concept: string;
  formation?: string;
  personnel?: string;
  tags?: string[];
  callReady?: boolean;
  situations?: string[];
  preferredLook?: string[];
  bestFor?: string[];
  notes?: string[];
  explosive?: boolean;
  pressureAnswer?: boolean;
  openerScore?: number;
  gimmick?: boolean;
  favorite?: boolean;
}

export interface CallSheetInput {
  weekLabel: string;
  opponent?: string;
  plays: CallSheetInputPlay[];
}

function toPlay(play: CallSheetInputPlay): CallSheetPlay {
  return {
    playId: play.id,
    playName: play.name,
    concept: play.concept,
    formation: play.formation,
    personnel: play.personnel,
    tags: play.tags || [],
    situations: play.situations || [],
    preferredLook: play.preferredLook || [],
    bestFor: play.bestFor || [],
    notes: play.notes || [],
    openerScore: play.openerScore || 0,
  };
}

function selectBySituation(plays: CallSheetInputPlay[], label: string, limit = 6) {
  return plays.filter((p) => p.situations?.includes(label)).slice(0, limit).map(toPlay);
}

function selectOpeners(plays: CallSheetInputPlay[], limit = 12) {
  return [...plays]
    .sort((a, b) => (b.openerScore || 0) - (a.openerScore || 0))
    .slice(0, limit)
    .map(toPlay);
}

function selectShots(plays: CallSheetInputPlay[], limit = 6) {
  return plays.filter((p) => p.explosive).slice(0, limit).map(toPlay);
}

function selectZeroAnswers(plays: CallSheetInputPlay[], limit = 6) {
  return plays.filter((p) => p.pressureAnswer).slice(0, limit).map(toPlay);
}

function selectFavorites(plays: CallSheetInputPlay[], limit = 8) {
  return plays.filter((p) => p.favorite).slice(0, limit).map(toPlay);
}

function selectGimmicks(plays: CallSheetInputPlay[], limit = 4) {
  return plays.filter((p) => p.gimmick).slice(0, limit).map(toPlay);
}

function section(bucket: CallSheetBucket, label: string, plays: CallSheetPlay[], notes: string[] = []): CallSheetSection {
  return { bucket, label, plays, notes };
}

export function buildCallSheet(input: CallSheetInput): CallSheet {
  const ready = input.plays.filter((p) => p.callReady !== false);

  const sections: CallSheetSection[] = [
    section(
      'opening_script',
      'Opening Script',
      selectOpeners(ready, 10),
      ['Use only practiced calls.', 'Script should reflect weekly priorities and early defensive probes.']
    ),
    section(
      'first_and_ten',
      '1st & 10',
      selectBySituation(ready, 'first_and_ten', 8),
      ['Drive starters. Possession calls and safe explosives belong here.']
    ),
    section(
      'second_short',
      '2nd & Short',
      selectBySituation(ready, 'second_short', 6),
      ['Keep shots and constraint plays available.']
    ),
    section(
      'second_medium',
      '2nd & Medium',
      selectBySituation(ready, 'second_medium', 6)
    ),
    section(
      'second_long',
      '2nd & Long',
      selectBySituation(ready, 'second_long', 6),
      ['Stay on schedule; do not call desperation too early.']
    ),
    section(
      'third_short',
      '3rd / 4th & Short',
      [
        ...selectBySituation(ready, 'third_short', 4),
        ...selectBySituation(ready, 'fourth_short', 2),
      ].slice(0, 6),
      ['Must-have conversion menu.']
    ),
    section(
      'third_medium',
      '3rd & Medium',
      selectBySituation(ready, 'third_medium', 6)
    ),
    section(
      'third_long',
      '3rd & Long',
      selectBySituation(ready, 'third_long', 6),
      ['Separate man/zone pressure answers if possible.']
    ),
    section(
      'red_zone',
      'Red Zone',
      selectBySituation(ready, 'red_zone', 8),
      ['Compressed-field menu.']
    ),
    section(
      'backed_up',
      'Backed Up',
      selectBySituation(ready, 'backed_up', 6),
      ['Field-position-safe calls only.']
    ),
    section(
      'two_minute',
      '2-Minute',
      selectBySituation(ready, 'two_minute', 8),
      ['Tempo, sideline access, and communication rules matter here.']
    ),
    section(
      'four_minute',
      '4-Minute',
      selectBySituation(ready, 'four_minute', 6),
      ['Clock-drain and ball-security menu.']
    ),
    section(
      'shot_plays',
      'Shot Plays',
      selectShots(ready, 6),
      ['Keep timing and protection notes attached.']
    ),
    section(
      'zero_answers',
      'Zero / Pressure Answers',
      selectZeroAnswers(ready, 6),
      ['This section should be instantly visible on game night.']
    ),
    section(
      'favorites',
      'Favorites / Best Calls',
      selectFavorites(ready, 8),
      ['Fast-access calls you trust most.']
    ),
    section(
      'gimmicks',
      'Gimmicks',
      selectGimmicks(ready, 4),
      ['Use only if practiced and situation-appropriate.']
    ),
  ];

  return {
    weekLabel: input.weekLabel,
    opponent: input.opponent,
    sections,
    summary: [
      `Built ${sections.length} call-sheet sections from ${ready.length} game-ready plays.`,
      'Call sheet should be a fast decision tool, not a full playbook.',
    ],
  };
}