// src/lib/football-engine/types.ts

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