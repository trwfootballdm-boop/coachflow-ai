/**
 * Formation helpers — pure functions for formation manipulation.
 *
 * Field coordinate system:
 *   x: 0 → 900 (left → right, midX = 450)
 *   y: 0 → 540 (top → bottom)
 */

export const FIELD_W = 900;
export const FIELD_H = 540;
export const MID_X = 450;

export function deepClone(obj) {
  if (obj == null) return obj;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch (_) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Strip a full play diagram down to just its formation data (players only).
 */
export function extractFormationFromDiagram(diagram) {
  if (!diagram || !Array.isArray(diagram.players)) {
    return { players: [], paths: [], annotations: [] };
  }
  const players = diagram.players.map((p) => {
    const { token_id, x, y, team_side, position, position_code, display_label, jersey_number, color } = p;
    return {
      token_id,
      x,
      y,
      team_side: team_side || 'offense',
      position: position || position_code || '',
      ...(position_code !== undefined && { position_code }),
      ...(display_label !== undefined && { display_label }),
      ...(jersey_number !== undefined && { jersey_number }),
      ...(color !== undefined && { color }),
    };
  });
  return { players, paths: [], annotations: [] };
}

export function mirrorFormationPlayers(players = []) {
  return players.map((p) => ({ ...p, x: MID_X + (MID_X - p.x) }));
}

export function mirrorFormationDiagram(diagram_data) {
  if (!diagram_data) return diagram_data;
  const players = mirrorFormationPlayers(diagram_data.players || []);
  const paths = (diagram_data.paths || []).map((path) => ({
    ...path,
    points: (path.points || []).map((pt) => ({ ...pt, x: MID_X + (MID_X - pt.x) })),
  }));
  const annotations = (diagram_data.annotations || []).map((a) =>
    a.x !== undefined ? { ...a, x: MID_X + (MID_X - a.x) } : a
  );
  return { ...diagram_data, players, paths, annotations };
}

export function suggestFormationType(players = []) {
  const off = players.filter((p) => (p.team_side || 'offense') === 'offense');
  if (off.length === 0) {
    const def = players.filter((p) => p.team_side === 'defense');
    const lbs = def.filter((p) => /LB/i.test(p.position || p.position_code || '')).length;
    const dl = def.filter((p) => /DL|DE|DT|NT/i.test(p.position || p.position_code || '')).length;
    if (dl === 3 && lbs === 4) return '3-4';
    if (dl === 4 && lbs === 3) return '4-3';
    if (def.length >= 5 && lbs <= 2) return 'nickel';
    return '4-3';
  }

  const qb = off.find((p) => /QB/i.test(p.position || p.position_code || ''));
  const rbs = off.filter((p) => /RB|HB|FB/i.test(p.position || p.position_code || ''));
  const wrs = off.filter((p) => /WR/i.test(p.position || p.position_code || ''));
  const tes = off.filter((p) => /TE/i.test(p.position || p.position_code || ''));

  if (rbs.length === 0) return 'empty';

  const ol = off.filter((p) => /OL|C|G|T/i.test(p.position || p.position_code || ''));
  const losY = ol.length ? ol.reduce((s, p) => s + p.y, 0) / ol.length : 270;

  if (qb) {
    const qbDepth = Math.abs(qb.y - losY);
    if (qbDepth < 25) return 'under_center';
    if (qbDepth > 25 && qbDepth < 60) return 'pistol';
    if (qbDepth >= 60) {
      if (rbs.length >= 2 && tes.length >= 1) return 'i_formation';
      if (wrs.length >= 4) return 'spread';
      return 'shotgun';
    }
  }
  if (wrs.length >= 4) return 'spread';
  return 'shotgun';
}

export function personnelGrouping(players = []) {
  const off = players.filter((p) => (p.team_side || 'offense') === 'offense');
  const rbs = off.filter((p) => /RB|HB|FB/i.test(p.position || p.position_code || '')).length;
  const tes = off.filter((p) => /TE/i.test(p.position || p.position_code || '')).length;
  return `${rbs}${tes}`;
}

export function getThumbnailDimensions(width = 240, height = 160) {
  return { width, height };
}

export function autoShortName(formation_name = '') {
  if (!formation_name) return '';
  return formation_name
    .replace(/\bRight\b/gi, 'Rt')
    .replace(/\bLeft\b/gi, 'Lt')
    .replace(/\bShotgun\b/gi, 'Gun')
    .replace(/\s+/g, ' ')
    .slice(0, 24)
    .trim();
}