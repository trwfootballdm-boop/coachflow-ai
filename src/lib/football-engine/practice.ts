export interface PracticeInputPlay {
  id: string;
  name: string;
  concept: string;
  formation?: string;
  personnel?: string;
  tags?: string[];
  installReady?: boolean;
  callReady?: boolean;
  situations?: string[];
  coachingPoints?: string[];
}

export interface PracticePlayEntry {
  playId: string;
  playName: string;
  concept: string;
  formation?: string;
  personnel?: string;
  tags: string[];
  coachingPoints: string[];
  situationLabels: string[];
}

export interface DefensiveScenario {
  coverageShell: string;
  frontFamily: string;
  pressure: string;
  middleField: string;
}

export interface PracticePeriod {
  id: string;
  type: 'indy' | 'group' | '7on7' | 'inside_run' | 'team' | 'red_zone' | 'third_down' | 'two_minute' | 'backed_up';
  label: string;
  durationMin: number;
  objective: string;
  plays: PracticePlayEntry[];
  scoutCards: DefensiveScenario[];
  coachingPoints: string[];
}

export type PracticePeriodType = PracticePeriod['type'];

export interface PracticeScript {
  dayLabel: string;
  theme: string;
  periods: PracticePeriod[];
  summary: string[];
}

export interface WeeklyPracticePlanInput {
  dayLabel: string;
  theme: string;
  plays: PracticeInputPlay[];
}

function bySituation(plays: PracticeInputPlay[], label: string) {
  return plays.filter((p) => p.situations?.includes(label));
}

function toEntry(play: PracticeInputPlay): PracticePlayEntry {
  return {
    playId: play.id,
    playName: play.name,
    concept: play.concept,
    formation: play.formation,
    personnel: play.personnel,
    tags: play.tags || [],
    coachingPoints: play.coachingPoints || [],
    situationLabels: play.situations || [],
  };
}

function defaultScenariosForConcept(concept: string): DefensiveScenario[] {
  if (['stick', 'snag', 'mesh', 'shallow_cross'].includes(concept)) {
    return [
      { coverageShell: 'cover_3', frontFamily: 'even', pressure: '4man', middleField: 'closed' },
      { coverageShell: 'cover_2', frontFamily: 'even', pressure: '4man', middleField: 'open' },
      { coverageShell: 'cover_1', frontFamily: 'even', pressure: '5man', middleField: 'closed' },
    ];
  }

  if (['inside_zone', 'power', 'counter'].includes(concept)) {
    return [
      { coverageShell: 'cover_3', frontFamily: 'over', pressure: '4man', middleField: 'closed' },
      { coverageShell: 'cover_1', frontFamily: 'under', pressure: '5man', middleField: 'closed' },
    ];
  }

  return [
    { coverageShell: 'unknown', frontFamily: 'unknown', pressure: 'none', middleField: 'unknown' },
  ];
}

function buildIndyPeriod(plays: PracticeInputPlay[]): PracticePeriod {
  const concepts = [...new Set(plays.map((p) => p.concept))];

  return {
    id: 'indy',
    type: 'indy',
    label: 'Indy',
    durationMin: 12,
    objective: 'Teach concept-specific fundamentals before group and team periods.',
    plays: plays.slice(0, 6).map(toEntry),
    scoutCards: [],
    coachingPoints: concepts.map((c) => `Reinforce core footwork and assignment rules for ${c}.`),
  };
}

function buildGroupPeriod(plays: PracticeInputPlay[]): PracticePeriod {
  return {
    id: 'group',
    type: 'group',
    label: 'Routes / Fits',
    durationMin: 10,
    objective: 'Pair related skill groups to teach timing, leverage, and communication.',
    plays: plays.slice(0, 8).map(toEntry),
    scoutCards: plays.slice(0, 3).flatMap((p) => defaultScenariosForConcept(p.concept)),
    coachingPoints: [
      'Emphasize alignment, splits, leverage, and verbal communication.',
      'Correct tags and adjustments before full-team reps.',
    ],
  };
}

function build7on7Period(plays: PracticeInputPlay[]): PracticePeriod {
  const passPlays = plays.filter((p) =>
    ['stick', 'snag', 'mesh', 'shallow_cross', 'four_verts', 'smash'].includes(p.concept)
  );

  return {
    id: '7on7',
    type: '7on7',
    label: '7-on-7',
    durationMin: 14,
    objective: 'Train QB progression, sight adjustments, and coverage answers.',
    plays: passPlays.slice(0, 10).map(toEntry),
    scoutCards: passPlays.slice(0, 4).flatMap((p) => defaultScenariosForConcept(p.concept)),
    coachingPoints: [
      'Start with base shell, then rotate to pressure or disguise looks.',
      'Grade QB eyes, timing, and route adjustment communication.',
    ],
  };
}

function buildInsideRunPeriod(plays: PracticeInputPlay[]): PracticePeriod {
  const runPlays = plays.filter((p) =>
    ['inside_zone', 'power', 'counter', 'outside_zone'].includes(p.concept)
  );

  return {
    id: 'inside-run',
    type: 'inside_run',
    label: 'Inside Run',
    durationMin: 10,
    objective: 'Train box count, run fit, and back track discipline.',
    plays: runPlays.slice(0, 8).map(toEntry),
    scoutCards: runPlays.slice(0, 4).flatMap((p) => defaultScenariosForConcept(p.concept)),
    coachingPoints: [
      'Emphasize aiming points, double teams, pull path, and backside fit.',
      'Do not waste reps on low-value looks that will not appear on Friday.',
    ],
  };
}

function buildTeamPeriod(plays: PracticeInputPlay[]): PracticePeriod {
  return {
    id: 'team',
    type: 'team',
    label: 'Team',
    durationMin: 18,
    objective: 'Run the week's call menu against expected defensive structures.',
    plays: plays.slice(0, 12).map(toEntry),
    scoutCards: plays.slice(0, 5).flatMap((p) => defaultScenariosForConcept(p.concept)),
    coachingPoints: [
      'Call it like the game.',
      'Track execution, not just install completion.',
    ],
  };
}

function buildSituationPeriod(
  id: string,
  type: PracticePeriodType,
  label: string,
  objective: string,
  plays: PracticeInputPlay[]
): PracticePeriod {
  return {
    id,
    type,
    label,
    durationMin: 8,
    objective,
    plays: plays.slice(0, 6).map(toEntry),
    scoutCards: plays.slice(0, 3).flatMap((p) => defaultScenariosForConcept(p.concept)),
    coachingPoints: [
      'Script exact field position, down, and distance.',
      'Coach the situation, not just the play call.',
    ],
  };
}

export function buildPracticeScript(input: WeeklyPracticePlanInput): PracticeScript {
  const installable = input.plays.filter((p) => p.installReady !== false);

  const redZone = bySituation(installable, 'red_zone');
  const thirdDown = bySituation(installable, 'third_down');
  const twoMinute = bySituation(installable, 'two_minute');
  const backedUp = bySituation(installable, 'backed_up');

  const periods: PracticePeriod[] = [
    buildIndyPeriod(installable),
    buildGroupPeriod(installable),
    build7on7Period(installable),
    buildInsideRunPeriod(installable),
    buildTeamPeriod(installable),
  ];

  if (redZone.length) {
    periods.push(
      buildSituationPeriod(
        'red-zone',
        'red_zone',
        'Red Zone',
        'Rehearse compressed-space calls and answers inside the scoring area.',
        redZone
      )
    );
  }

  if (thirdDown.length) {
    periods.push(
      buildSituationPeriod(
        'third-down',
        'third_down',
        '3rd Down',
        'Practice conversion calls versus pressure and disguise.',
        thirdDown
      )
    );
  }

  if (twoMinute.length) {
    periods.push(
      buildSituationPeriod(
        'two-minute',
        'two_minute',
        '2-Minute',
        'Train tempo, communication, and boundary awareness.',
        twoMinute
      )
    );
  }

  if (backedUp.length) {
    periods.push(
      buildSituationPeriod(
        'backed-up',
        'backed_up',
        'Backed Up',
        'Practice field-position-safe calls from poor field position.',
        backedUp
      )
    );
  }

  return {
    dayLabel: input.dayLabel,
    theme: input.theme,
    periods,
    summary: [
      `Built ${periods.length} periods from ${installable.length} installable plays.`,
      'Practice script should reflect the week's priorities and expected game situations.',
    ],
  };
}