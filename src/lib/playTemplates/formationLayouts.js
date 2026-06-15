/**
 * Formation layouts — player position skeletons used by play templates.
 *
 * Each layout is a function returning a fresh array of player objects
 * (so each template gets independent player instances).
 *
 * LOS = y=290. Offense lined up at y=290; backfield deeper (y>290).
 * x=0-900, midX=450.
 */

// ── Offensive line (shared baseline) ──
function ol() {
  return [
    { token_id: 'C',  position_code: 'C',  display_label: 'C',  x: 450, y: 290, team_side: 'offense', role_type: 'lineman' },
    { token_id: 'LG', position_code: 'LG', display_label: 'LG', x: 410, y: 290, team_side: 'offense', role_type: 'lineman' },
    { token_id: 'RG', position_code: 'RG', display_label: 'RG', x: 490, y: 290, team_side: 'offense', role_type: 'lineman' },
    { token_id: 'LT', position_code: 'LT', display_label: 'LT', x: 370, y: 290, team_side: 'offense', role_type: 'lineman' },
    { token_id: 'RT', position_code: 'RT', display_label: 'RT', x: 530, y: 290, team_side: 'offense', role_type: 'lineman' },
  ];
}

// ── I-Formation: QB UC, FB at 5, TB at 7 ──
export function iFormation() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 310, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'FB', position_code: 'FB', display_label: 'FB', x: 450, y: 345, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'TB', position_code: 'RB', display_label: 'TB', x: 450, y: 390, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Shotgun 2x2 (11 personnel: 1 RB, 1 TE, 3 WR) ──
export function shotgun2x2() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'RB', position_code: 'RB', display_label: 'RB', x: 500, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 240, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Shotgun Trips Right (3 WR strong side, X solo backside) ──
export function shotgunTripsRight() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'RB', position_code: 'RB', display_label: 'RB', x: 400, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 580, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 680, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 780, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Shotgun Empty (no RB; 5 receivers) ──
export function shotgunEmpty() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 110, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'F',  position_code: 'WR', display_label: 'F',  x: 220, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 580, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 680, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 790, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Wing-T (FB at 4, halfback wing on TE side, opposite halfback at 6) ──
export function wingT() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 310, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'FB', position_code: 'FB', display_label: 'FB', x: 450, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'LH', position_code: 'RB', display_label: 'LH', x: 350, y: 360, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'WG', position_code: 'RB', display_label: 'WG', x: 615, y: 320, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Singleback (QB UC, single RB, 1 TE, 3 WR) ──
export function singleback() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 310, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'RB', position_code: 'RB', display_label: 'RB', x: 450, y: 380, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 260, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Pistol (QB 4 yards behind C, RB directly behind QB) ──
export function pistol() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 335, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'RB', position_code: 'RB', display_label: 'RB', x: 450, y: 380, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 270, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Pro Set (QB UC, 2 RBs side-by-side, 1 TE, 2 WR) ──
export function proSet() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 310, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'FB', position_code: 'FB', display_label: 'FB', x: 410, y: 365, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'TB', position_code: 'RB', display_label: 'TB', x: 490, y: 365, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  ];
}

// ── Goal-line / heavy (3 TE, 1 FB, 1 RB) ──
export function goalLineHeavy() {
  return [
    ...ol(),
    { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 450, y: 310, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'FB', position_code: 'FB', display_label: 'FB', x: 450, y: 345, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'TB', position_code: 'RB', display_label: 'TB', x: 450, y: 385, team_side: 'offense', role_type: 'ball_carrier' },
    { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'F',  position_code: 'TE', display_label: 'F',  x: 330, y: 290, team_side: 'offense', role_type: 'receiver' },
    { token_id: 'U',  position_code: 'TE', display_label: 'U',  x: 600, y: 320, team_side: 'offense', role_type: 'receiver' },
  ];
}

/**
 * 4-3 base defense (4 DL, 3 LB, 4 DB).
 */
export function defense43() {
  return [
    { token_id: 'NT',  position_code: 'NT', display_label: 'NT', x: 430, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'DT',  position_code: 'DT', display_label: 'DT', x: 510, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'LDE', position_code: 'DE', display_label: 'LE', x: 340, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'RDE', position_code: 'DE', display_label: 'RE', x: 580, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'MLB', position_code: 'LB', display_label: 'M',  x: 450, y: 210, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'WLB', position_code: 'LB', display_label: 'W',  x: 340, y: 210, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'SLB', position_code: 'LB', display_label: 'S',  x: 580, y: 210, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'LCB', position_code: 'CB', display_label: 'CB', x: 130, y: 230, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'RCB', position_code: 'CB', display_label: 'CB', x: 770, y: 230, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'FS',  position_code: 'FS', display_label: 'FS', x: 420, y: 130, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'SS',  position_code: 'SS', display_label: 'SS', x: 580, y: 160, team_side: 'defense', role_type: 'defensive_back' },
  ];
}

/**
 * 3-4 base defense.
 */
export function defense34() {
  return [
    { token_id: 'NG',   position_code: 'NG',  display_label: 'NG', x: 450, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'LDE',  position_code: 'DE',  display_label: 'LE', x: 370, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'RDE',  position_code: 'DE',  display_label: 'RE', x: 530, y: 250, team_side: 'defense', role_type: 'lineman' },
    { token_id: 'WILB', position_code: 'ILB', display_label: 'WI', x: 410, y: 215, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'SILB', position_code: 'ILB', display_label: 'SI', x: 490, y: 215, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'WOLB', position_code: 'OLB', display_label: 'WO', x: 290, y: 240, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'SOLB', position_code: 'OLB', display_label: 'SO', x: 610, y: 240, team_side: 'defense', role_type: 'linebacker' },
    { token_id: 'LCB',  position_code: 'CB',  display_label: 'CB', x: 130, y: 230, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'RCB',  position_code: 'CB',  display_label: 'CB', x: 770, y: 230, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'FS',   position_code: 'FS',  display_label: 'FS', x: 420, y: 130, team_side: 'defense', role_type: 'defensive_back' },
    { token_id: 'SS',   position_code: 'SS',  display_label: 'SS', x: 580, y: 160, team_side: 'defense', role_type: 'defensive_back' },
  ];
}

/**
 * Mirror a player array around midX (for "Left" variants of "Right" plays).
 */
export function mirrorPlayers(players) {
  return players.map(p => ({ ...p, x: 900 - p.x }));
}

/**
 * Layout registry for dynamic lookup.
 */
export const FORMATIONS = {
  i_formation:         { fn: iFormation,      name: 'I-Formation',         personnel: '21' },
  shotgun_2x2:         { fn: shotgun2x2,      name: 'Shotgun 2x2',         personnel: '11' },
  shotgun_trips_right: { fn: shotgunTripsRight, name: 'Shotgun Trips Right', personnel: '11' },
  shotgun_empty:       { fn: shotgunEmpty,    name: 'Empty',               personnel: '10' },
  wing_t:              { fn: wingT,           name: 'Wing-T',              personnel: '21' },
  singleback:          { fn: singleback,      name: 'Singleback',          personnel: '11' },
  pistol:              { fn: pistol,          name: 'Pistol',              personnel: '11' },
  pro_set:             { fn: proSet,          name: 'Pro Set',             personnel: '21' },
  goal_line_heavy:     { fn: goalLineHeavy,   name: 'Goal Line Heavy',     personnel: '23' },
  defense_43:          { fn: defense43,       name: '4-3 Base',            personnel: 'base' },
  defense_34:          { fn: defense34,       name: '3-4 Base',            personnel: 'base' },
};