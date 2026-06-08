// Player assignment types for play diagram system

export type PlayerRole = 
  | 'qb' 
  | 'rb' 
  | 'wr' 
  | 'te' 
  | 'lt' 
  | 'lg' 
  | 'c' 
  | 'rg' 
  | 'rt' 
  | 'dl' 
  | 'lb' 
  | 'db';

export type ResponsibilityKind = 
  | 'route' 
  | 'block' 
  | 'motion' 
  | 'handoff' 
  | 'run-fit' 
  | 'coverage' 
  | 'blitz' 
  | 'spy';

export interface PlayerAlignment {
  x: number;
  y: number;
  side?: 'left' | 'right';
}

export interface ResponsibilityTiming {
  startMs: number;
  durationMs: number;
}

export interface PlayerResponsibility {
  kind: ResponsibilityKind;
  concept?: string;
  targetId?: string;
  landmark?: string;
  timing?: ResponsibilityTiming;
}

export interface PlayerAssignment {
  tokenId: string;
  role: PlayerRole;
  technique?: string;
  alignment?: PlayerAlignment;
  responsibility?: PlayerResponsibility;
}