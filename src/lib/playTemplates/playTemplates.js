/**
 * Play templates — concrete diagrams ({ players, paths }) for each seed item.
 *
 * Keyed by `item_name` (must match SEED_ITEMS exactly). The seeder merges
 * diagram_data into the LibraryItem record at install time.
 *
 * Each entry returns a fresh diagram so multiple imports stay independent.
 */

import {
  iFormation,
  shotgun2x2,
  shotgunTripsRight,
  shotgunEmpty,
  wingT,
  singleback,
  pistol,
  proSet,
  goalLineHeavy,
  defense43,
  defense34,
  mirrorPlayers,
} from './formationLayouts';

import {
  makeRoute,
  buildRoutes,
  hitch,
  slant,
  quickOut,
  curl,
  dig,
  out,
  in_,
  go,
  post,
  corner,
  fade,
  flat,
  wheel,
  swing,
  checkdown,
  shallowCross,
  drag,
  insideZoneTrack,
  outsideZoneTrack,
  powerTrack,
  counterTrack,
  trapTrack,
  jetSweep,
  qbDropback,
  qbBootleg,
  qbWaggle,
} from './routeLibrary';

// ───────── Helpers ───────────────────────────────────────────────────────────

const LOS = 290;

const indexByToken = (players) =>
  players.reduce((acc, p) => { acc[p.token_id] = p; return acc; }, {});

function olBlocks(players, depth = 8) {
  return players
    .filter(p => p.role_type === 'lineman' && p.team_side === 'offense')
    .map(p => makeRoute(p.token_id, [
      { x: p.x, y: p.y },
      { x: p.x, y: p.y - depth },
    ], { path_type: 'blocking_track', route_name: 'block' }));
}

function pullPath(player, targetX, targetY = LOS - 6) {
  return makeRoute(player.token_id, [
    { x: player.x, y: player.y },
    { x: player.x, y: player.y - 8 },
    { x: targetX, y: targetY },
  ], { path_type: 'pull_path', route_name: 'pull' });
}

// ───────── I-Formation runs ──────────────────────────────────────────────────

function isoRight() {
  const players = iFormation();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x + 30, y: LOS - 4 },
      { x: idx.FB.x + 50, y: LOS - 18 },
    ], { path_type: 'blocking_track', route_name: 'lead' }),
    makeRoute('TB', [
      { x: idx.TB.x, y: idx.TB.y },
      { x: idx.TB.x + 20, y: idx.TB.y - 40 },
      { x: idx.TB.x + 40, y: LOS - 35 },
    ], { path_type: 'run_path', route_name: 'iso' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x + 10, y: idx.QB.y + 8 },
    ], { path_type: 'run_path', route_name: 'handoff' }),
  ];
  return { players, paths, annotations: [] };
}

function powerRight() {
  const players = iFormation();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players).filter(p => p.token_id !== 'LG'),
    pullPath(idx.LG, 540, LOS - 12),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x + 80, y: LOS - 6 },
    ], { path_type: 'blocking_track', route_name: 'kick_out' }),
    makeRoute('TB', powerTrack(idx.TB, 'right'),
      { path_type: 'run_path', route_name: 'power' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x + 10, y: idx.QB.y + 8 },
    ], { path_type: 'run_path', route_name: 'handoff' }),
  ];
  return { players, paths, annotations: [] };
}

function counterTrey() {
  const players = iFormation();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players).filter(p => !['LG', 'LT'].includes(p.token_id)),
    pullPath(idx.LG, 540, LOS - 6),
    pullPath(idx.LT, 580, LOS - 18),
    makeRoute('TB', counterTrack(idx.TB, 'right'),
      { path_type: 'run_path', route_name: 'counter' }),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x - 30, y: idx.FB.y - 4 },
    ], { path_type: 'fake_path', route_name: 'fake_counter_step' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x + 12, y: idx.QB.y + 12 },
    ], { path_type: 'run_path', route_name: 'reverse_pivot' }),
  ];
  return { players, paths, annotations: [] };
}

function playActionBootLeft() {
  const players = iFormation();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 4),
    makeRoute('TB', [
      { x: idx.TB.x, y: idx.TB.y },
      { x: idx.TB.x - 40, y: LOS - 4 },
    ], { path_type: 'fake_path', route_name: 'power_fake' }),
    makeRoute('FB', flat(idx.FB, 'left'), { path_type: 'pass_route', route_name: 'flat' }),
    makeRoute('Y', shallowCross(idx.Y), { path_type: 'pass_route', route_name: 'drag' }),
    makeRoute('X', [
      { x: idx.X.x, y: idx.X.y },
      { x: idx.X.x, y: LOS - 100 },
    ], { path_type: 'pass_route', route_name: 'go' }),
    makeRoute('Z', post(idx.Z, 16), { path_type: 'pass_route', route_name: 'post' }),
    makeRoute('QB', qbBootleg(idx.QB, 'left'),
      { path_type: 'run_path', route_name: 'boot_left' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Spread plays ─────────────────────────────────────────────────────

function insideZone() {
  const players = shotgun2x2();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players),
    makeRoute('RB', insideZoneTrack(idx.RB, 'right'),
      { path_type: 'run_path', route_name: 'inside_zone' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x + 10, y: idx.QB.y },
    ], { path_type: 'run_path', route_name: 'mesh' }),
  ];
  return { players, paths, annotations: [] };
}

function slantFlat() {
  const players = shotgun2x2();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 4),
    makeRoute('X', slant(idx.X, 4), { path_type: 'pass_route', route_name: 'slant' }),
    makeRoute('H', flat(idx.H, 'left'), { path_type: 'pass_route', route_name: 'flat' }),
    makeRoute('Z', hitch(idx.Z, 6), { path_type: 'pass_route', route_name: 'hitch' }),
    makeRoute('Y', curl(idx.Y, 10), { path_type: 'pass_route', route_name: 'curl' }),
    makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
    makeRoute('QB', qbDropback(idx.QB, 3), { path_type: 'run_path', route_name: 'drop' }),
  ];
  return { players, paths, annotations: [] };
}

function meshConcept() {
  const players = shotgunTripsRight();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 4),
    makeRoute('X', shallowCross(idx.X), { path_type: 'pass_route', route_name: 'mesh_cross' }),
    makeRoute('H', shallowCross(idx.H), { path_type: 'pass_route', route_name: 'mesh_cross' }),
    makeRoute('Y', [
      { x: idx.Y.x, y: idx.Y.y },
      { x: idx.Y.x + 20, y: idx.Y.y - 60 },
      { x: idx.Y.x - 20, y: idx.Y.y - 90 },
    ], { path_type: 'pass_route', route_name: 'corner' }),
    makeRoute('Z', wheel(idx.Z), { path_type: 'pass_route', route_name: 'wheel' }),
    makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
    makeRoute('QB', qbDropback(idx.QB, 5), { path_type: 'run_path', route_name: 'drop' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Wing-T plays ─────────────────────────────────────────────────────

function buckSweep() {
  const players = wingT();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players).filter(p => !['LG', 'RG'].includes(p.token_id)),
    pullPath(idx.LG, 680, LOS - 8),
    pullPath(idx.RG, 720, LOS - 16),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x - 20, y: idx.FB.y - 8 },
    ], { path_type: 'fake_path', route_name: 'buck_fake' }),
    makeRoute('LH', [
      { x: idx.LH.x, y: idx.LH.y },
      { x: 640, y: idx.LH.y - 8 },
      { x: 720, y: LOS - 20 },
    ], { path_type: 'run_path', route_name: 'sweep' }),
    makeRoute('WG', [
      { x: idx.WG.x, y: idx.WG.y },
      { x: idx.WG.x + 40, y: LOS - 18 },
    ], { path_type: 'blocking_track', route_name: 'arc' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x - 16, y: idx.QB.y + 8 },
    ], { path_type: 'run_path', route_name: 'reverse_out' }),
  ];
  return { players, paths, annotations: [] };
}

function bellyTrap() {
  const players = wingT();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players).filter(p => p.token_id !== 'LG'),
    pullPath(idx.LG, 500, LOS - 6),
    makeRoute('FB', trapTrack(idx.FB, 'right'),
      { path_type: 'run_path', route_name: 'trap' }),
    makeRoute('LH', [
      { x: idx.LH.x, y: idx.LH.y },
      { x: idx.LH.x - 30, y: idx.LH.y - 8 },
    ], { path_type: 'fake_path', route_name: 'fake_sweep' }),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x, y: idx.QB.y + 16 },
    ], { path_type: 'run_path', route_name: 'handoff' }),
  ];
  return { players, paths, annotations: [] };
}

function wagglePass() {
  const players = wingT();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 4),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x + 30, y: idx.FB.y - 8 },
    ], { path_type: 'fake_path', route_name: 'belly_fake' }),
    makeRoute('LH', flat(idx.LH, 'left'), { path_type: 'pass_route', route_name: 'flat' }),
    makeRoute('WG', [
      { x: idx.WG.x, y: idx.WG.y },
      { x: idx.WG.x - 80, y: idx.WG.y - 50 },
      { x: idx.WG.x - 220, y: idx.WG.y - 70 },
    ], { path_type: 'pass_route', route_name: 'deep_cross' }),
    makeRoute('Y', drag(idx.Y), { path_type: 'pass_route', route_name: 'drag' }),
    makeRoute('X', [
      { x: idx.X.x, y: idx.X.y },
      { x: idx.X.x, y: LOS - 100 },
      { x: idx.X.x + 40, y: LOS - 130 },
    ], { path_type: 'pass_route', route_name: 'post' }),
    makeRoute('QB', qbWaggle(idx.QB, 'left'),
      { path_type: 'run_path', route_name: 'waggle_left' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Red-Zone / Goal Line ─────────────────────────────────────────────

function qbSneak() {
  const players = iFormation();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 6),
    makeRoute('QB', [
      { x: idx.QB.x, y: idx.QB.y },
      { x: idx.QB.x, y: LOS - 6 },
    ], { path_type: 'run_path', route_name: 'sneak' }),
    makeRoute('FB', [
      { x: idx.FB.x, y: idx.FB.y },
      { x: idx.FB.x, y: LOS - 4 },
    ], { path_type: 'blocking_track', route_name: 'lead' }),
    makeRoute('TB', [
      { x: idx.TB.x, y: idx.TB.y },
      { x: idx.TB.x + 30, y: idx.TB.y - 30 },
    ], { path_type: 'fake_path', route_name: 'fake_dive' }),
  ];
  return { players, paths, annotations: [] };
}

function fadeToCorner() {
  const players = shotgun2x2();
  const idx = indexByToken(players);
  const paths = [
    ...olBlocks(players, 4),
    makeRoute('X', fade(idx.X), { path_type: 'pass_route', route_name: 'fade' }),
    makeRoute('Z', fade(idx.Z), { path_type: 'pass_route', route_name: 'fade' }),
    makeRoute('H', slant(idx.H, 3), { path_type: 'pass_route', route_name: 'quick_slant' }),
    makeRoute('Y', [
      { x: idx.Y.x, y: idx.Y.y },
      { x: idx.Y.x + 12, y: idx.Y.y - 24 },
    ], { path_type: 'pass_route', route_name: 'pop' }),
    makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
    makeRoute('QB', qbDropback(idx.QB, 3), { path_type: 'run_path', route_name: 'drop' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Defenses ─────────────────────────────────────────────────────────

function defense43Base() {
  const players = defense43();
  const idx = indexByToken(players);
  const paths = [
    makeRoute('MLB', [
      { x: idx.MLB.x, y: idx.MLB.y },
      { x: idx.MLB.x, y: idx.MLB.y - 40 },
    ], { path_type: 'zone_drop', route_name: 'hook' }),
    makeRoute('WLB', [
      { x: idx.WLB.x, y: idx.WLB.y },
      { x: idx.WLB.x - 40, y: idx.WLB.y - 30 },
    ], { path_type: 'zone_drop', route_name: 'curl_flat' }),
    makeRoute('SLB', [
      { x: idx.SLB.x, y: idx.SLB.y },
      { x: idx.SLB.x + 40, y: idx.SLB.y - 30 },
    ], { path_type: 'zone_drop', route_name: 'curl_flat' }),
    makeRoute('LDE', [
      { x: idx.LDE.x, y: idx.LDE.y },
      { x: idx.LDE.x, y: LOS + 8 },
    ], { path_type: 'pursuit_path', route_name: 'rush' }),
    makeRoute('RDE', [
      { x: idx.RDE.x, y: idx.RDE.y },
      { x: idx.RDE.x, y: LOS + 8 },
    ], { path_type: 'pursuit_path', route_name: 'rush' }),
    makeRoute('NT', [
      { x: idx.NT.x, y: idx.NT.y },
      { x: idx.NT.x - 8, y: LOS + 8 },
    ], { path_type: 'pursuit_path', route_name: 'rush' }),
    makeRoute('DT', [
      { x: idx.DT.x, y: idx.DT.y },
      { x: idx.DT.x + 8, y: LOS + 8 },
    ], { path_type: 'pursuit_path', route_name: 'rush' }),
  ];
  return { players, paths, annotations: [] };
}

function defense62Base() {
  const players = defense43().map(p => {
    if (p.token_id === 'LDE') return { ...p, x: 300 };
    if (p.token_id === 'RDE') return { ...p, x: 620 };
    return p;
  });
  players.push(
    { token_id: 'LILB', position_code: 'LB', display_label: 'L', x: 380, y: 230, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'RILB', position_code: 'LB', display_label: 'R', x: 530, y: 230, team_side: 'defense', role_type: 'linebacker' },
  );
  const idx = indexByToken(players);
  const paths = [
    makeRoute('MLB', [{ x: idx.MLB.x, y: idx.MLB.y }, { x: idx.MLB.x, y: idx.MLB.y - 30 }],
      { path_type: 'zone_drop', route_name: 'hook' }),
    makeRoute('LILB', [{ x: idx.LILB.x, y: idx.LILB.y }, { x: idx.LILB.x - 20, y: idx.LILB.y + 20 }],
      { path_type: 'pursuit_path', route_name: 'gap' }),
    makeRoute('RILB', [{ x: idx.RILB.x, y: idx.RILB.y }, { x: idx.RILB.x + 20, y: idx.RILB.y + 20 }],
      { path_type: 'pursuit_path', route_name: 'gap' }),
  ];
  return { players, paths, annotations: [] };
}

function defense53Base() {
  const players = defense34().map(p => p);
  players.push(
    { token_id: 'MILB', position_code: 'LB', display_label: 'MI', x: 450, y: 215, team_side: 'defense', role_type: 'linebacker' },
  );
  players[5] = { ...players[5], y: 250, position_code: 'DE', display_label: 'LE2', token_id: 'LDE2' };
  players[6] = { ...players[6], y: 250, position_code: 'DE', display_label: 'RE2', token_id: 'RDE2' };
  const idx = indexByToken(players);
  const paths = [
    makeRoute('MILB', [{ x: idx.MILB.x, y: idx.MILB.y }, { x: idx.MILB.x, y: idx.MILB.y - 25 }],
      { path_type: 'zone_drop', route_name: 'hook' }),
    makeRoute('WILB', [{ x: idx.WILB.x, y: idx.WILB.y }, { x: idx.WILB.x - 30, y: idx.WILB.y - 20 }],
      { path_type: 'zone_drop', route_name: 'flat' }),
    makeRoute('SILB', [{ x: idx.SILB.x, y: idx.SILB.y }, { x: idx.SILB.x + 30, y: idx.SILB.y - 20 }],
      { path_type: 'zone_drop', route_name: 'flat' }),
  ];
  return { players, paths, annotations: [] };
}

function lbBlitzPackage() {
  const players = defense43();
  const idx = indexByToken(players);
  const paths = [
    makeRoute('MLB', [
      { x: idx.MLB.x, y: idx.MLB.y },
      { x: idx.MLB.x, y: LOS + 12 },
    ], { path_type: 'blitz_path', route_name: 'A_gap' }),
    makeRoute('SLB', [
      { x: idx.SLB.x, y: idx.SLB.y },
      { x: idx.SLB.x - 20, y: LOS + 12 },
    ], { path_type: 'blitz_path', route_name: 'B_gap' }),
    makeRoute('WLB', [
      { x: idx.WLB.x, y: idx.WLB.y },
      { x: idx.WLB.x - 30, y: idx.WLB.y - 30 },
    ], { path_type: 'zone_drop', route_name: 'hook' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Formation snapshots ─────────────────────────────────────────────

function shotgun2x2Snapshot() {
  return { players: shotgun2x2(), paths: [], annotations: [] };
}

function iFormationProSnapshot() {
  return { players: iFormation(), paths: [], annotations: [] };
}

function tripsRightSnapshot() {
  return { players: shotgunTripsRight(), paths: [], annotations: [] };
}

// ───────── Special teams ─────────────────────────────────────────────────────

function kickoffCoverage() {
  const players = [];
  for (let i = 0; i < 11; i++) {
    const x = 100 + i * 70;
    players.push({
      token_id: `K${i}`, position_code: 'ST', display_label: i === 5 ? 'K' : String(i + 1),
      x, y: 200, team_side: 'offense', role_type: 'special_teams',
    });
  }
  const paths = players.map(p => makeRoute(p.token_id, [
    { x: p.x, y: p.y },
    { x: p.x, y: p.y + 120 },
  ], { path_type: 'pursuit_path', route_name: 'lane' }));
  return { players, paths, annotations: [] };
}

function puntTeamBase() {
  const players = [
    ...iFormation().slice(0, 5),
    { token_id: 'P',   position_code: 'P',  display_label: 'P',  x: 450, y: 410, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'PP1', position_code: 'PP', display_label: 'PP', x: 380, y: 340, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'PP2', position_code: 'PP', display_label: 'PP', x: 520, y: 340, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'GL',  position_code: 'G',  display_label: 'G',  x: 120, y: 290, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'GR',  position_code: 'G',  display_label: 'G',  x: 780, y: 290, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'WL',  position_code: 'W',  display_label: 'W',  x: 240, y: 290, team_side: 'offense', role_type: 'special_teams' },
    { token_id: 'WR',  position_code: 'W',  display_label: 'W',  x: 660, y: 290, team_side: 'offense', role_type: 'special_teams' },
  ];
  const idx = indexByToken(players);
  const paths = [
    makeRoute('GL', [{ x: idx.GL.x, y: idx.GL.y }, { x: idx.GL.x + 20, y: idx.GL.y - 100 }],
      { path_type: 'pursuit_path', route_name: 'gunner_lane' }),
    makeRoute('GR', [{ x: idx.GR.x, y: idx.GR.y }, { x: idx.GR.x - 20, y: idx.GR.y - 100 }],
      { path_type: 'pursuit_path', route_name: 'gunner_lane' }),
  ];
  return { players, paths, annotations: [] };
}

// ───────── Master registry ────────────────────────────────────────────────────

const TEMPLATE_BUILDERS = {
  'ISO Right': isoRight,
  'Power Right': powerRight,
  'Counter Trey': counterTrey,
  'Play Action Boot': playActionBootLeft,
  'Inside Zone': insideZone,
  'Slant-Flat': slantFlat,
  'Mesh Concept': meshConcept,
  'Buck Sweep': buckSweep,
  'Belly Trap': bellyTrap,
  'Waggle Pass': wagglePass,
  'QB Sneak': qbSneak,
  'Fade to Corner': fadeToCorner,
  '6-2 Base Defense': defense62Base,
  '5-3 Base Defense': defense53Base,
  'LB Blitz Package': lbBlitzPackage,
  'Shotgun 2x2 Formation': shotgun2x2Snapshot,
  'I-Formation Pro': iFormationProSnapshot,
  'Trips Right': tripsRightSnapshot,
  'Kickoff Coverage': kickoffCoverage,
  'Punt Team Base': puntTeamBase,
};

export function buildDiagramForItem(itemName) {
  const fn = TEMPLATE_BUILDERS[itemName];
  if (!fn) return null;
  try {
    return fn();
  } catch (err) {
    console.error('[playTemplates] failed to build', itemName, err);
    return null;
  }
}

export const TEMPLATE_NAMES = Object.keys(TEMPLATE_BUILDERS);

export const EXTENDED_TEMPLATES = [
  {
    item_name: 'ISO Left',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'I-Formation', formation_name: 'I-Formation',
    concept_family: 'ISO', run_pass: 'run',
    difficulty_level: 'beginner', age_level: 'youth',
    short_description: 'Mirror of ISO Right. FB leads through B gap on the left.',
    coaching_points: 'FB takes on the MIKE backer. TB reads the front-side block.',
    situation_tags: ['base', 'openers'],
    starter_recommended: true, sort_order: 5,
    play_data: { name: 'ISO Left', short_name: 'ISO L', play_family: 'ISO', formation: 'I-Formation', direction: 'left' },
    pack_system_family: 'I-Formation',
    diagram_data: () => {
      const d = isoRight();
      return { ...d, players: mirrorPlayers(d.players), paths: d.paths.map(p => ({ ...p, points: p.points.map(pt => ({ ...pt, x: 900 - pt.x })) })) };
    },
  },
  {
    item_name: 'Power Left',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'I-Formation', formation_name: 'I-Formation',
    concept_family: 'Power', run_pass: 'run',
    difficulty_level: 'beginner', age_level: 'youth',
    short_description: 'Right guard pulls to lead through the C gap on the left.',
    coaching_points: 'RG pulls and turns up off the FB kick-out.',
    situation_tags: ['base', 'short_yardage'],
    starter_recommended: true, sort_order: 6,
    play_data: { name: 'Power Left', short_name: 'PWR L', play_family: 'Power', formation: 'I-Formation', direction: 'left' },
    pack_system_family: 'I-Formation',
    diagram_data: () => {
      const d = powerRight();
      return { ...d, players: mirrorPlayers(d.players), paths: d.paths.map(p => ({ ...p, points: p.points.map(pt => ({ ...pt, x: 900 - pt.x })) })) };
    },
  },
  {
    item_name: 'Lead Draw',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'I-Formation', formation_name: 'I-Formation',
    concept_family: 'Draw', run_pass: 'run',
    difficulty_level: 'intermediate', age_level: 'youth',
    short_description: 'Delayed handoff. OL pass-sets then drives. FB leads.',
    coaching_points: 'Sell pass — QB drops 3 steps, hands off late. RB reads the lead block.',
    situation_tags: ['3rd_medium', 'change_up'],
    starter_recommended: false, sort_order: 7,
    play_data: { name: 'Lead Draw', short_name: 'DRAW', play_family: 'Draw', formation: 'I-Formation', direction: 'right' },
    pack_system_family: 'I-Formation',
    diagram_data: () => {
      const players = iFormation();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players, 4),
        makeRoute('QB', [
          { x: idx.QB.x, y: idx.QB.y },
          { x: idx.QB.x, y: idx.QB.y + 30 },
          { x: idx.QB.x + 10, y: idx.QB.y + 36 },
        ], { path_type: 'fake_path', route_name: 'pass_drop_fake' }),
        makeRoute('FB', [
          { x: idx.FB.x, y: idx.FB.y },
          { x: idx.FB.x + 30, y: LOS - 4 },
        ], { path_type: 'blocking_track', route_name: 'lead' }),
        makeRoute('TB', [
          { x: idx.TB.x, y: idx.TB.y },
          { x: idx.TB.x + 30, y: LOS - 20 },
        ], { path_type: 'run_path', route_name: 'draw' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Outside Zone',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Spread', formation_name: 'Shotgun 2x2',
    concept_family: 'Outside Zone', run_pass: 'run',
    difficulty_level: 'intermediate', age_level: 'middle_school',
    short_description: 'Wide zone run. RB aims for ghost tackle, reads cutback.',
    coaching_points: 'Bang/Bend/Bounce read. OL reaches playside.',
    situation_tags: ['base', '1st_down'],
    starter_recommended: true, sort_order: 13,
    play_data: { name: 'Outside Zone', short_name: 'OZ', play_family: 'Zone', formation: 'Shotgun 2x2', direction: 'right' },
    pack_system_family: 'Spread',
    diagram_data: () => {
      const players = shotgun2x2();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players),
        makeRoute('RB', outsideZoneTrack(idx.RB, 'right'), { path_type: 'run_path', route_name: 'outside_zone' }),
        makeRoute('QB', [{ x: idx.QB.x, y: idx.QB.y }, { x: idx.QB.x + 10, y: idx.QB.y }], { path_type: 'run_path', route_name: 'mesh' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Stick Concept',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Spread', formation_name: 'Shotgun Trips',
    concept_family: 'Stick', run_pass: 'pass',
    difficulty_level: 'beginner', age_level: 'youth',
    short_description: 'Trips quick game: stick/flat/seam triangle read.',
    coaching_points: 'Read flat defender. Stick is the answer vs zone.',
    situation_tags: ['3rd_short', '3rd_medium'],
    starter_recommended: true, sort_order: 14,
    play_data: { name: 'Stick', short_name: 'STICK', play_family: 'Quick Game', formation: 'Shotgun Trips', direction: 'right' },
    pack_system_family: 'Spread',
    diagram_data: () => {
      const players = shotgunTripsRight();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players, 4),
        makeRoute('Z', [{ x: idx.Z.x, y: idx.Z.y }, { x: idx.Z.x, y: idx.Z.y - 30 }, { x: idx.Z.x - 20, y: idx.Z.y - 36 }], { path_type: 'pass_route', route_name: 'stick' }),
        makeRoute('H', flat(idx.H, 'right'), { path_type: 'pass_route', route_name: 'flat' }),
        makeRoute('Y', [{ x: idx.Y.x, y: idx.Y.y }, { x: idx.Y.x, y: idx.Y.y - 80 }], { path_type: 'pass_route', route_name: 'seam' }),
        makeRoute('X', hitch(idx.X, 6), { path_type: 'pass_route', route_name: 'hitch' }),
        makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
        makeRoute('QB', qbDropback(idx.QB, 3), { path_type: 'run_path', route_name: 'drop' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Four Verticals',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Spread', formation_name: 'Shotgun 2x2',
    concept_family: '4 Verts', run_pass: 'pass',
    difficulty_level: 'intermediate', age_level: 'middle_school',
    short_description: 'Four go routes attack each deep quarter.',
    coaching_points: 'Inside receivers bend on safeties. QB reads middle field.',
    situation_tags: ['shot_plays', '2_minute'],
    starter_recommended: true, sort_order: 15,
    play_data: { name: '4 Verticals', short_name: '4V', play_family: 'Vertical', formation: 'Shotgun 2x2', direction: 'any' },
    pack_system_family: 'Spread',
    diagram_data: () => {
      const players = shotgun2x2();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players, 4),
        ...buildRoutes({ X: 'go:25', H: 'go:22', Y: 'go:22', Z: 'go:25' }, idx),
        makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
        makeRoute('QB', qbDropback(idx.QB, 7), { path_type: 'run_path', route_name: 'drop' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Snag Concept',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Spread', formation_name: 'Shotgun Trips',
    concept_family: 'Snag', run_pass: 'pass',
    difficulty_level: 'intermediate', age_level: 'middle_school',
    short_description: 'Snag/corner/flat triangle to the trips side.',
    coaching_points: 'High-low the flat defender. Snag is the dump.',
    situation_tags: ['3rd_medium', 'red_zone'],
    starter_recommended: false, sort_order: 16,
    play_data: { name: 'Snag', short_name: 'SNAG', play_family: 'Triangle', formation: 'Shotgun Trips', direction: 'right' },
    pack_system_family: 'Spread',
    diagram_data: () => {
      const players = shotgunTripsRight();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players, 4),
        makeRoute('Z', [{ x: idx.Z.x, y: idx.Z.y }, { x: idx.Z.x - 30, y: idx.Z.y - 30 }, { x: idx.Z.x - 60, y: idx.Z.y - 28 }], { path_type: 'pass_route', route_name: 'snag' }),
        makeRoute('Y', corner(idx.Y, 14), { path_type: 'pass_route', route_name: 'corner' }),
        makeRoute('H', flat(idx.H, 'right'), { path_type: 'pass_route', route_name: 'flat' }),
        makeRoute('X', hitch(idx.X, 6), { path_type: 'pass_route', route_name: 'hitch' }),
        makeRoute('RB', checkdown(idx.RB), { path_type: 'pass_route', route_name: 'check' }),
        makeRoute('QB', qbDropback(idx.QB, 5), { path_type: 'run_path', route_name: 'drop' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Bubble RPO',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Spread', formation_name: 'Shotgun 2x2',
    concept_family: 'RPO', run_pass: 'pass',
    difficulty_level: 'intermediate', age_level: 'middle_school',
    short_description: 'Inside zone with bubble screen to the slot. QB reads the alley defender.',
    coaching_points: 'Pre-snap count box. If alley defender squeezes, throw bubble.',
    situation_tags: ['base', 'tempo'],
    starter_recommended: true, sort_order: 17,
    play_data: { name: 'Bubble RPO', short_name: 'RPO', play_family: 'RPO', formation: 'Shotgun 2x2', direction: 'right' },
    pack_system_family: 'Spread',
    diagram_data: () => {
      const players = shotgun2x2();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players),
        makeRoute('RB', insideZoneTrack(idx.RB, 'right'), { path_type: 'run_path', route_name: 'inside_zone' }),
        makeRoute('H', [{ x: idx.H.x, y: idx.H.y }, { x: idx.H.x - 30, y: idx.H.y + 10 }, { x: idx.H.x - 80, y: idx.H.y + 4 }], { path_type: 'pass_route', route_name: 'bubble' }),
        makeRoute('X', [{ x: idx.X.x, y: idx.X.y }, { x: idx.X.x + 30, y: idx.X.y - 6 }], { path_type: 'blocking_track', route_name: 'stalk' }),
        makeRoute('QB', [{ x: idx.QB.x, y: idx.QB.y }, { x: idx.QB.x + 8, y: idx.QB.y }], { path_type: 'run_path', route_name: 'rpo_read' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: 'Jet Sweep',
    item_type: 'play', side_of_ball: 'offense',
    system_family: 'Wing-T', formation_name: 'Wing-T',
    concept_family: 'Jet', run_pass: 'run',
    difficulty_level: 'intermediate', age_level: 'youth',
    short_description: 'Wing in motion takes a quick handoff at full speed.',
    coaching_points: 'Time the snap with the motion. WG aims for the edge.',
    situation_tags: ['base', 'edge'],
    starter_recommended: true, sort_order: 18,
    play_data: { name: 'Jet Sweep', short_name: 'JET', play_family: 'Sweep', formation: 'Wing-T', direction: 'right' },
    pack_system_family: 'Wing-T',
    diagram_data: () => {
      const players = wingT();
      const idx = indexByToken(players);
      const paths = [
        ...olBlocks(players),
        makeRoute('WG', jetSweep(idx.WG, 'right'), { path_type: 'run_path', route_name: 'jet' }),
        makeRoute('FB', [{ x: idx.FB.x, y: idx.FB.y }, { x: idx.FB.x, y: idx.FB.y - 20 }], { path_type: 'fake_path', route_name: 'dive_fake' }),
        makeRoute('QB', [{ x: idx.QB.x, y: idx.QB.y }, { x: idx.QB.x + 30, y: idx.QB.y }], { path_type: 'run_path', route_name: 'jet_handoff' }),
      ];
      return { players, paths, annotations: [] };
    },
  },
  {
    item_name: '4-3 Cover 3',
    item_type: 'defensive_call', side_of_ball: 'defense',
    system_family: '4-3', formation_name: '4-3 Base',
    concept_family: 'Cover 3', run_pass: 'pass',
    difficulty_level: 'beginner', age_level: 'middle_school',
    short_description: '4-3 base with single-high safety and 3 deep zone coverage.',
    coaching_points: 'CBs play deep 1/3. FS deep middle. SS rolls down to robber/curl.',
    situation_tags: ['base'],
    starter_recommended: true, sort_order: 20,
    play_data: { name: '4-3 Cover 3', short_name: 'C3', play_family: 'Coverage', formation: '4-3', direction: 'any' },
    pack_system_family: '4-4',
    diagram_data: defense43Base,
  },
  {
    item_name: '4-3 Cover 2',
    item_type: 'defensive_call', side_of_ball: 'defense',
    system_family: '4-3', formation_name: '4-3 Base',
    concept_family: 'Cover 2', run_pass: 'pass',
    difficulty_level: 'intermediate', age_level: 'middle_school',
    short_description: 'Two safeties play deep halves; CBs jam and cover flats.',
    coaching_points: 'CBs sink with #2. Safeties stay over the top.',
    situation_tags: ['2_minute', '3rd_long'],
    starter_recommended: false, sort_order: 21,
    play_data: { name: '4-3 Cover 2', short_name: 'C2', play_family: 'Coverage', formation: '4-3', direction: 'any' },
    pack_system_family: '4-4',
    diagram_data: () => {
      const base = defense43Base();
      const players = base.players.map(p => {
        if (p.token_id === 'FS') return { ...p, x: 320, y: 130 };
        if (p.token_id === 'SS') return { ...p, x: 600, y: 130 };
        if (p.token_id === 'LCB') return { ...p, y: 270 };
        if (p.token_id === 'RCB') return { ...p, y: 270 };
        return p;
      });
      return { players, paths: base.paths, annotations: [] };
    },
  },
  {
    item_name: 'Cover 0 Blitz',
    item_type: 'defensive_call', side_of_ball: 'defense',
    system_family: '4-3', formation_name: '4-3 Pressure',
    concept_family: 'Cover 0', run_pass: 'pass',
    difficulty_level: 'advanced', age_level: 'middle_school',
    short_description: 'All-out blitz with man-free coverage. Bring 6, no safety help.',
    coaching_points: 'CBs and SS in tight man. FS bumps to nearest #3.',
    situation_tags: ['3rd_short', 'goal_line', 'pressure'],
    starter_recommended: false, sort_order: 22,
    play_data: { name: 'Cover 0 Blitz', short_name: 'C0', play_family: 'Pressure', formation: '4-3', direction: 'any' },
    pack_system_family: '4-4',
    diagram_data: () => {
      const base = lbBlitzPackage();
      const players = base.players;
      const idx = indexByToken(players);
      const extra = makeRoute('SS', [
        { x: idx.SS.x, y: idx.SS.y },
        { x: idx.SS.x - 60, y: LOS + 10 },
      ], { path_type: 'blitz_path', route_name: 'safety_blitz' });
      return { players, paths: [...base.paths, extra], annotations: [] };
    },
  },
];

export function resolveExtendedDiagram(entry) {
  if (typeof entry.diagram_data === 'function') return entry.diagram_data();
  return entry.diagram_data || null;
}