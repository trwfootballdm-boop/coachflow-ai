// src/lib/football-engine/validation.ts

import type {
  PlayDiagram,
  PlayerToken,
  PlayPath,
  ValidationMessage,
  ValidationResult,
  EligibleReceiverResult,
} from './types';

const DEFAULT_LOS_Y = 290;
const LOS_TOLERANCE = 8;
const BACKFIELD_MIN_OFFSET = 12;

function isOffense(player: PlayerToken) {
  return player.team_side === 'offense';
}

function normalizeNumber(value?: number | string): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isIneligibleNumber(num: number | null) {
  if (num === null) return false;
  return num >= 50 && num <= 79;
}

function sortLeftToRight(players: PlayerToken[]) {
  return [...players].sort((a, b) => a.x - b.x);
}

function classifyLinePlayers(offense: PlayerToken[], losY = DEFAULT_LOS_Y) {
  const onLine = offense.filter((p) => Math.abs(p.y - losY) <= LOS_TOLERANCE);
  const backfield = offense.filter((p) => p.y > losY + BACKFIELD_MIN_OFFSET);
  const ambiguous = offense.filter(
    (p) => !onLine.some((x) => x.token_id === p.token_id) && !backfield.some((x) => x.token_id === p.token_id)
  );

  return {
    onLine: sortLeftToRight(onLine),
    backfield: sortLeftToRight(backfield),
    ambiguous,
  };
}

function computeEligibility(offense: PlayerToken[], losY = DEFAULT_LOS_Y): {
  eligible: EligibleReceiverResult;
  messages: ValidationMessage[];
} {
  const messages: ValidationMessage[] = [];
  const { onLine, backfield, ambiguous } = classifyLinePlayers(offense, losY);

  const leftEnd = onLine[0];
  const rightEnd = onLine[onLine.length - 1];

  const eligibleIds = new Set<string>();
  const ineligibleIds = new Set<string>();

  if (leftEnd) eligibleIds.add(leftEnd.token_id);
  if (rightEnd && rightEnd.token_id !== leftEnd?.token_id) eligibleIds.add(rightEnd.token_id);

  for (const p of backfield) {
    eligibleIds.add(p.token_id);
  }

  for (const p of onLine) {
    if (!eligibleIds.has(p.token_id)) {
      ineligibleIds.add(p.token_id);
    }
  }

  for (const p of offense) {
    const num = normalizeNumber(p.jersey_number);
    if (isIneligibleNumber(num) && !p.reported_eligible) {
      eligibleIds.delete(p.token_id);
      ineligibleIds.add(p.token_id);
    }
  }

  if (onLine.length < 7) {
    messages.push({
      code: 'OFFENSE_TOO_FEW_ON_LINE',
      severity: 'error',
      message: `Only ${onLine.length} players appear to be on the line of scrimmage. At least 7 are required.`,
      relatedIds: onLine.map((p) => p.token_id),
    });
  }

  if (backfield.length > 4) {
    messages.push({
      code: 'TOO_MANY_BACKFIELD',
      severity: 'error',
      message: `There are ${backfield.length} players in the backfield. A standard offensive formation can have at most 4.`,
      relatedIds: backfield.map((p) => p.token_id),
    });
  }

  if (!leftEnd || !rightEnd) {
    messages.push({
      code: 'NO_END_PLAYERS',
      severity: 'error',
      message: 'Could not determine end players on the line of scrimmage.',
    });
  }

  for (const p of ambiguous) {
    messages.push({
      code: 'AMBIGUOUS_ALIGNMENT',
      severity: 'warning',
      message: `${p.display_label || p.position_code || p.token_id} is neither clearly on the line nor clearly in the backfield.`,
      relatedIds: [p.token_id],
    });
  }

  return {
    eligible: {
      eligibleIds: [...eligibleIds],
      ineligibleIds: [...ineligibleIds],
      onLineIds: onLine.map((p) => p.token_id),
      backfieldIds: backfield.map((p) => p.token_id),
      leftEndId: leftEnd?.token_id,
      rightEndId: rightEnd?.token_id,
    },
    messages,
  };
}

function validatePathAssignments(paths: PlayPath[], players: PlayerToken[]): ValidationMessage[] {
  const playerIds = new Set(players.map((p) => p.token_id));
  const messages: ValidationMessage[] = [];

  for (const path of paths) {
    if (path.token_id && !playerIds.has(path.token_id)) {
      messages.push({
        code: 'PATH_PLAYER_MISSING',
        severity: 'warning',
        message: `Path ${path.path_id} is assigned to a player that does not exist on the field.`,
        relatedIds: [path.path_id, path.token_id],
      });
    }

    if (!path.points || path.points.length < 2) {
      messages.push({
        code: 'PATH_TOO_SHORT',
        severity: 'warning',
        message: `Path ${path.path_id} has fewer than 2 points.`,
        relatedIds: [path.path_id],
      });
    }
  }

  return messages;
}

function validatePlayerCount(offense: PlayerToken[]): ValidationMessage[] {
  if (offense.length === 11) return [];
  return [
    {
      code: 'OFFENSE_COUNT',
      severity: offense.length > 11 ? 'error' : 'warning',
      message: `Offense has ${offense.length} players on the field. Standard plays should show 11.`,
      relatedIds: offense.map((p) => p.token_id),
    },
  ];
}

export function validateOffensivePlay(diagram: PlayDiagram, losY = DEFAULT_LOS_Y): ValidationResult {
  const offense = diagram.players.filter(isOffense);

  const playerCountMessages = validatePlayerCount(offense);
  const { eligible, messages: eligibilityMessages } = computeEligibility(offense, losY);
  const pathMessages = validatePathAssignments(diagram.paths, diagram.players);

  const messages = [
    ...playerCountMessages,
    ...eligibilityMessages,
    ...pathMessages,
  ];

  return {
    valid: !messages.some((m) => m.severity === 'error'),
    messages,
    eligible,
    summary: {
      offenseCount: offense.length,
      lineCount: eligible.onLineIds.length,
      backfieldCount: eligible.backfieldIds.length,
      eligibleCount: eligible.eligibleIds.length,
    },
  };
}