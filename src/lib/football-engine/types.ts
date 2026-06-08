// src/lib/football-engine/types.ts

export type PlayFamily =
  | 'run'
  | 'quick'
  | 'dropback'
  | 'screen'
  | 'play_action'
  | 'special';

export type InstallTier = 1 | 2 | 3;

export type Situation =
  | 'base'
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
  | 'shot'
  | 'goal_line'
  | 'pressure';

export type Personnel = '10' | '11' | '12' | '20' | '21' | 'empty';

export interface SeedConcept {
  id: string;
  name: string;
  family: PlayFamily;
  description: string;
  installTier: InstallTier;
  core: boolean;
  formations: string[];
  motions: string[];
  tags: string[];
  situations: Situation[];
  bestVs: string[];
  complements: string[];
  teachingPoints: string[];
}

export interface SeedCall {
  id: string;
  conceptId: string;
  callName: string;
  formation: string;
  personnel: Personnel;
  motion?: string;
  tags: string[];
  situations: Situation[];
  notes?: string;
  weeklyDefault?: boolean;
}

export interface SeedFormation {
  id: string;
  name: string;
  family: '2x2' | '3x1' | 'compressed' | 'empty' | 'pistol' | 'tight';
  personnel: Personnel[];
  notes?: string;
}

export interface SeedTag {
  id: string;
  name: string;
  kind: 'formation' | 'motion' | 'run' | 'pass' | 'screen' | 'protection' | 'rpo';
  appliesTo: PlayFamily[];
  notes?: string;
}

export type TeamSide = 'offense' | 'defense' | 'special_teams';

export type RoleType =
  | 'ball_carrier'
  | 'blocker'
  | 'receiver'
  | 'lineman'
  | 'defender'
  | 'kicker'
  | 'returner'
  | 'other';

export type PathType =
  | 'pass_route'
  | 'run_path'
  | 'blocking_track'
  | 'pull_path'
  | 'motion_path'
  | 'blitz_path'
  | 'pursuit_path'
  | 'zone_drop'
  | 'contain_path'
  | 'ball_path'
  | 'fake_path';

export interface PlayerToken {
  token_id: string;
  x: number;
  y: number;
  team_side: TeamSide;
  role_type?: RoleType;
  position_code?: string;
  display_label?: string;
  jersey_number?: number | string;
  visual_style?: {
    fill?: string;
    shape?: 'circle' | 'square' | 'triangle';
  };
  locked?: boolean;
  reported_eligible?: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface PlayPath {
  path_id: string;
  token_id?: string;
  path_type: PathType;
  points: PathPoint[];
  curve_type?: 'straight' | 'curved' | 'arc';
  stroke_width?: number;
}

export interface PlayDiagram {
  players: PlayerToken[];
  paths: PlayPath[];
  annotations?: any[];
}

export interface ValidationMessage {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  relatedIds?: string[];
}

export interface EligibleReceiverResult {
  eligibleIds: string[];
  ineligibleIds: string[];
  onLineIds: string[];
  backfieldIds: string[];
  leftEndId?: string;
  rightEndId?: string;
}

export interface ValidationResult {
  valid: boolean;
  messages: ValidationMessage[];
  eligible: EligibleReceiverResult;
  summary: {
    offenseCount: number;
    lineCount: number;
    backfieldCount: number;
    eligibleCount: number;
  };
}

// Call Sheet types
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

// Install & Practice types
export interface InstallReport {
  playId: string;
  playName: string;
  installDay: number;
  installWeek: number;
  ready: boolean;
  issues: string[];
  coachingPoints: string[];
}

export interface PracticeScriptPeriod {
  periodType: 'indy' | 'group' | '7on7' | 'team' | 'special_teams';
  plays: string[];
  focus: string;
  durationMinutes: number;
}

export interface PracticeScript {
  weekLabel: string;
  practiceDay: string;
  focusArea: string;
  periods: PracticeScriptPeriod[];
  notes: string[];
}

// Weekly Game Plan
export interface WeeklyGamePlan {
  week: string;
  opponent: string;
  scouting: {
    baseFronts: string[];
    baseCoverages: string[];
    pressureNotes: string[];
    matchupNotes: string[];
  };
  install: InstallReport[];
  practice: PracticeScript;
  callSheet: CallSheet;
  priorities: string[];
}

// Play Logging
export interface LoggedPlay {
  id: string;
  gameId: string;
  quarter: number;
  clock: string;
  down: 1 | 2 | 3 | 4;
  distance: number;
  yardLine: number;
  hash?: 'left' | 'middle' | 'right';
  fieldZone?: 'backed_up' | 'open_field' | 'fringe' | 'red_zone' | 'goal_line';
  playId?: string;
  playName: string;
  concept?: string;
  formation?: string;
  personnel?: string;
  defensiveLook?: {
    front?: string;
    coverage?: string;
    pressure?: string;
  };
  result?: {
    yards: number;
    success?: boolean;
    explosive?: boolean;
    turnover?: boolean;
    sack?: boolean;
    penalty?: boolean;
  };
  notes?: string[];
}