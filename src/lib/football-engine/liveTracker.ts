export type HashMark = 'left' | 'middle' | 'right';

export type FieldZone =
  | 'backed_up'
  | 'coming_out'
  | 'open_field'
  | 'fringe'
  | 'red_zone'
  | 'goal_line';

export type PlayResultTag =
  | 'success'
  | 'explosive'
  | 'turnover'
  | 'penalty'
  | 'sack'
  | 'tfl'
  | 'touchdown'
  | 'first_down';

export interface DefensiveLookLog {
  front?: string;
  coverage?: string;
  pressure?: string;
  stunt?: string;
}

export interface PlayResultLog {
  yards: number;
  tags: PlayResultTag[];
  epaLike?: number;
  note?: string;
}

export interface LoggedPlay {
  id: string;
  gameId: string;
  opponent?: string;
  quarter: number;
  clock: string;
  series?: number;
  down: 1 | 2 | 3 | 4;
  distance: number;
  yardLine: number;
  hash: HashMark;
  fieldZone: FieldZone;
  personnel?: string;
  formation?: string;
  strength?: string;
  motion?: string;
  playId?: string;
  playName: string;
  concept?: string;
  playType: 'run' | 'pass' | 'rpo' | 'screen' | 'play_action' | 'other';
  direction?: 'left' | 'middle' | 'right';
  defensiveLook?: DefensiveLookLog;
  result: PlayResultLog;
  notes?: string[];
}

export interface LiveTrackerState {
  gameId: string;
  plays: LoggedPlay[];
}

export function createLiveTracker(gameId: string): LiveTrackerState {
  return {
    gameId,
    plays: [],
  };
}

export function logPlay(state: LiveTrackerState, play: LoggedPlay): LiveTrackerState {
  return {
    ...state,
    plays: [...state.plays, play],
  };
}

export function updateLoggedPlay(
  state: LiveTrackerState,
  playId: string,
  patch: Partial<LoggedPlay>
): LiveTrackerState {
  return {
    ...state,
    plays: state.plays.map((p) => (p.id === playId ? { ...p, ...patch } : p)),
  };
}

export function removeLoggedPlay(state: LiveTrackerState, playId: string): LiveTrackerState {
  return {
    ...state,
    plays: state.plays.filter((p) => p.id !== playId),
  };
}