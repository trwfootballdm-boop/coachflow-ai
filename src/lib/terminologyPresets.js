// Terminology preset packs — seed vocabulary coaches can import
// Each preset returns an array of { category, key, value, aliases, sort_order }

export const TERMINOLOGY_CATEGORIES = [
  { id: 'route',          label: 'Routes',          hint: 'Receiver route tree (Slant, Go, Dig, Comeback, Whip)' },
  { id: 'formation_tag',  label: 'Formation Tags',  hint: 'Alignment modifiers (Trips, Bunch, Empty, Stack)' },
  { id: 'motion',         label: 'Motion',          hint: 'Pre-snap motion names (Jet, Zip, Orbit, Fly, Shift)' },
  { id: 'protection',     label: 'Protection',      hint: 'Pass protection schemes (Slide, BOB, Half-Slide, Max)' },
  { id: 'concept',        label: 'Concepts',        hint: 'Pass/Run concept families (Mesh, Stick, Smash, Snag, Power)' },
  { id: 'defensive_call', label: 'Defensive Calls', hint: 'Defensive coverages and fronts (Cover 1, Cover 3, Tampa 2, Fire Zone)' },
  { id: 'personnel',      label: 'Personnel',       hint: 'Personnel groupings (11, 12, 21, Empty, Heavy)' },
];

const make = (category, items) =>
  items.map((it, i) => ({
    category,
    key: it.key,
    value: it.value,
    aliases: it.aliases || [],
    sort_order: i,
  }));

// ─── AIR RAID ──────────────────────────────────────────────────────────────
export const AIR_RAID_PRESET = [
  ...make('route', [
    { key: 'go',       value: 'Go',       aliases: ['9', 'Fly', 'Streak'] },
    { key: 'post',     value: 'Post',     aliases: ['8'] },
    { key: 'corner',   value: 'Corner',   aliases: ['7', 'Flag'] },
    { key: 'dig',      value: 'Dig',      aliases: ['6', 'In'] },
    { key: 'curl',     value: 'Curl',     aliases: ['5', 'Hook'] },
    { key: 'out',      value: 'Out',      aliases: ['4'] },
    { key: 'comeback', value: 'Comeback', aliases: ['3'] },
    { key: 'slant',    value: 'Slant',    aliases: ['2'] },
    { key: 'flat',     value: 'Flat',     aliases: ['1', 'Arrow'] },
    { key: 'mesh',     value: 'Mesh',     aliases: ['Drag', 'Cross'] },
    { key: 'wheel',    value: 'Wheel',    aliases: [] },
    { key: 'shallow',  value: 'Shallow',  aliases: ['Under'] },
  ]),
  ...make('formation_tag', [
    { key: 'trips', value: 'Trips', aliases: ['Trey'] },
    { key: 'twins', value: '2x2',   aliases: ['Doubles', 'Pro'] },
    { key: 'empty', value: 'Empty', aliases: ['5-Wide'] },
    { key: 'bunch', value: 'Bunch', aliases: ['Tight'] },
  ]),
  ...make('motion', [
    { key: 'jet',   value: 'Jet',   aliases: ['Rocket'] },
    { key: 'zip',   value: 'Zip',   aliases: ['Quick'] },
    { key: 'orbit', value: 'Orbit', aliases: [] },
    { key: 'shift', value: 'Shift', aliases: [] },
  ]),
  ...make('protection', [
    { key: 'slide_right', value: 'Slide Right', aliases: ['51', 'Rip'] },
    { key: 'slide_left',  value: 'Slide Left',  aliases: ['50', 'Liz'] },
    { key: 'bob',         value: 'BOB',         aliases: ['Big On Big'] },
    { key: 'max',         value: 'Max',         aliases: ['7-Man'] },
  ]),
  ...make('concept', [
    { key: 'mesh',      value: 'Mesh',    aliases: [] },
    { key: 'stick',     value: 'Stick',   aliases: ['Spot'] },
    { key: 'y_cross',   value: 'Y-Cross', aliases: ['Cross'] },
    { key: 'shallow',   value: 'Shallow', aliases: ['Drive'] },
    { key: 'snag',      value: 'Snag',    aliases: ['Spacing'] },
    { key: 'smash',     value: 'Smash',   aliases: [] },
    { key: 'levels',    value: 'Levels',  aliases: [] },
    { key: 'four_verts', value: '4 Verts', aliases: ['6', 'Stretch'] },
  ]),
  ...make('defensive_call', [
    { key: 'cover_0',   value: 'Cover 0',    aliases: ['All-Out'] },
    { key: 'cover_1',   value: 'Cover 1',    aliases: ['Man-Free'] },
    { key: 'cover_2',   value: 'Cover 2',    aliases: [] },
    { key: 'cover_3',   value: 'Cover 3',    aliases: [] },
    { key: 'cover_4',   value: 'Cover 4',    aliases: ['Quarters'] },
    { key: 'tampa_2',   value: 'Tampa 2',    aliases: [] },
    { key: 'fire_zone', value: 'Fire Zone',  aliases: ['Zone Blitz'] },
  ]),
  ...make('personnel', [
    { key: '00', value: '00 (Empty)',   aliases: ['5WR'] },
    { key: '10', value: '10 (4WR/1RB)', aliases: ['Spread'] },
    { key: '11', value: '11 (1TE/1RB)', aliases: ['Posse'] },
    { key: '12', value: '12 (2TE/1RB)', aliases: [] },
  ]),
];

// ─── SPREAD ────────────────────────────────────────────────────────────────
export const SPREAD_PRESET = [
  ...make('route', [
    { key: 'bubble',    value: 'Bubble',    aliases: [] },
    { key: 'now',       value: 'Now',       aliases: ['Quick Screen'] },
    { key: 'go',        value: 'Go',        aliases: ['Fade'] },
    { key: 'slant',     value: 'Slant',     aliases: [] },
    { key: 'hitch',     value: 'Hitch',     aliases: ['Stop'] },
    { key: 'speed_out', value: 'Speed Out', aliases: [] },
    { key: 'dig',       value: 'Dig',       aliases: [] },
    { key: 'post',      value: 'Post',      aliases: [] },
    { key: 'corner',    value: 'Corner',    aliases: [] },
    { key: 'wheel',     value: 'Wheel',     aliases: [] },
  ]),
  ...make('formation_tag', [
    { key: 'trips', value: 'Trips', aliases: [] },
    { key: 'twins', value: '2x2',   aliases: [] },
    { key: 'empty', value: 'Empty', aliases: [] },
    { key: 'bunch', value: 'Bunch', aliases: [] },
    { key: 'stack', value: 'Stack', aliases: [] },
  ]),
  ...make('motion', [
    { key: 'jet',  value: 'Jet',  aliases: [] },
    { key: 'zip',  value: 'Zip',  aliases: [] },
    { key: 'over', value: 'Over', aliases: [] },
  ]),
  ...make('protection', [
    { key: 'slide', value: 'Slide', aliases: [] },
    { key: 'bob',   value: 'BOB',   aliases: [] },
    { key: 'rpo',   value: 'RPO',   aliases: ['Read'] },
  ]),
  ...make('concept', [
    { key: 'mesh',         value: 'Mesh',         aliases: [] },
    { key: 'stick',        value: 'Stick',        aliases: [] },
    { key: 'smash',        value: 'Smash',        aliases: [] },
    { key: 'snag',         value: 'Snag',         aliases: [] },
    { key: 'levels',       value: 'Levels',       aliases: [] },
    { key: 'four_verts',   value: '4 Verts',      aliases: [] },
    { key: 'power',        value: 'Power',        aliases: [] },
    { key: 'counter',      value: 'Counter',      aliases: [] },
    { key: 'inside_zone',  value: 'Inside Zone',  aliases: ['IZ'] },
    { key: 'outside_zone', value: 'Outside Zone', aliases: ['OZ'] },
    { key: 'rpo_glance',   value: 'RPO Glance',   aliases: [] },
    { key: 'rpo_bubble',   value: 'RPO Bubble',   aliases: [] },
  ]),
  ...make('defensive_call', [
    { key: 'cover_1', value: 'Cover 1', aliases: [] },
    { key: 'cover_2', value: 'Cover 2', aliases: [] },
    { key: 'cover_3', value: 'Cover 3', aliases: [] },
    { key: 'cover_4', value: 'Cover 4', aliases: ['Quarters'] },
    { key: 'cover_6', value: 'Cover 6', aliases: ['Quarter-Quarter-Half'] },
  ]),
  ...make('personnel', [
    { key: '10', value: '10 (4WR/1RB)', aliases: [] },
    { key: '11', value: '11 (1TE/1RB)', aliases: [] },
    { key: '20', value: '20 (2RB)',      aliases: [] },
    { key: '00', value: '00 (Empty)',    aliases: [] },
  ]),
];

// ─── WING-T ────────────────────────────────────────────────────────────────
export const WING_T_PRESET = [
  ...make('route', [
    { key: 'go',   value: 'Go',   aliases: [] },
    { key: 'post', value: 'Post', aliases: [] },
    { key: 'flag', value: 'Flag', aliases: ['Corner'] },
    { key: 'curl', value: 'Curl', aliases: [] },
    { key: 'out',  value: 'Out',  aliases: [] },
    { key: 'arrow', value: 'Arrow', aliases: ['Flat'] },
    { key: 'drag', value: 'Drag', aliases: [] },
  ]),
  ...make('formation_tag', [
    { key: 'wing_right', value: 'Wing Right', aliases: [] },
    { key: 'wing_left',  value: 'Wing Left',  aliases: [] },
    { key: 'tight',      value: 'Tight',      aliases: [] },
    { key: 'over',       value: 'Over',       aliases: [] },
    { key: 'red',        value: 'Red',        aliases: [] },
    { key: 'blue',       value: 'Blue',       aliases: [] },
  ]),
  ...make('motion', [
    { key: 'jet',    value: 'Jet',    aliases: [] },
    { key: 'rocket', value: 'Rocket', aliases: [] },
    { key: 'fly',    value: 'Fly',    aliases: [] },
  ]),
  ...make('protection', [
    { key: 'gap',   value: 'Gap',   aliases: [] },
    { key: 'down',  value: 'Down',  aliases: [] },
    { key: 'reach', value: 'Reach', aliases: [] },
  ]),
  ...make('concept', [
    { key: 'buck_sweep',   value: 'Buck Sweep',   aliases: ['Sweep'] },
    { key: 'trap',         value: 'Trap',         aliases: [] },
    { key: 'belly',        value: 'Belly',        aliases: [] },
    { key: 'counter',      value: 'Counter',      aliases: ['Criss-Cross'] },
    { key: 'jet_sweep',    value: 'Jet Sweep',    aliases: [] },
    { key: 'rocket_toss',  value: 'Rocket Toss',  aliases: [] },
    { key: 'waggle',       value: 'Waggle',       aliases: ['Bootleg'] },
  ]),
  ...make('defensive_call', [
    { key: 'cover_1', value: 'Cover 1', aliases: [] },
    { key: 'cover_3', value: 'Cover 3', aliases: [] },
    { key: '5_2',     value: '5-2',     aliases: ['Okie'] },
    { key: '4_4',     value: '4-4',     aliases: [] },
  ]),
  ...make('personnel', [
    { key: '22', value: '22 (2TE/2RB)', aliases: ['Wing-T Base'] },
    { key: '21', value: '21 (1TE/2RB)', aliases: [] },
    { key: '23', value: '23 (3TE/2RB)', aliases: ['Goal Line'] },
  ]),
];

// ─── PRO STYLE ─────────────────────────────────────────────────────────────
export const PRO_STYLE_PRESET = [
  ...make('route', [
    { key: 'go',       value: 'Go (9)',       aliases: ['Fly'] },
    { key: 'post',     value: 'Post (8)',     aliases: [] },
    { key: 'corner',   value: 'Corner (7)',   aliases: [] },
    { key: 'dig',      value: 'Dig (6)',      aliases: [] },
    { key: 'curl',     value: 'Curl (5)',     aliases: [] },
    { key: 'out',      value: 'Out (4)',      aliases: [] },
    { key: 'comeback', value: 'Comeback (3)', aliases: [] },
    { key: 'slant',    value: 'Slant (2)',    aliases: [] },
    { key: 'flat',     value: 'Flat (1)',     aliases: [] },
    { key: 'option',   value: 'Option',       aliases: ['Choice'] },
    { key: 'seam',     value: 'Seam',         aliases: [] },
  ]),
  ...make('formation_tag', [
    { key: 'pro',    value: 'Pro',    aliases: [] },
    { key: 'twins',  value: 'Twins',  aliases: ['2x2'] },
    { key: 'trips',  value: 'Trips',  aliases: [] },
    { key: 'i_form', value: 'I-Form', aliases: ['I'] },
    { key: 'strong', value: 'Strong', aliases: [] },
    { key: 'weak',   value: 'Weak',   aliases: [] },
  ]),
  ...make('motion', [
    { key: 'jet',   value: 'Jet',   aliases: [] },
    { key: 'shift', value: 'Shift', aliases: [] },
    { key: 'orbit', value: 'Orbit', aliases: [] },
  ]),
  ...make('protection', [
    { key: 'half_slide', value: 'Half Slide', aliases: [] },
    { key: 'full_slide', value: 'Full Slide', aliases: [] },
    { key: 'bob',        value: 'BOB',        aliases: ['Big On Big'] },
    { key: 'max',        value: 'Max',        aliases: ['7-Man'] },
  ]),
  ...make('concept', [
    { key: 'curl_flat',     value: 'Curl Flat',    aliases: [] },
    { key: 'smash',         value: 'Smash',        aliases: [] },
    { key: 'levels',        value: 'Levels',       aliases: [] },
    { key: 'spacing',       value: 'Spacing',      aliases: ['Snag'] },
    { key: 'west_coast',    value: 'West Coast',   aliases: [] },
    { key: 'inside_zone',   value: 'Inside Zone',  aliases: ['IZ'] },
    { key: 'outside_zone',  value: 'Outside Zone', aliases: ['OZ'] },
    { key: 'power',         value: 'Power',        aliases: [] },
    { key: 'counter',       value: 'Counter',      aliases: [] },
  ]),
  ...make('defensive_call', [
    { key: 'cover_1',   value: 'Cover 1',   aliases: [] },
    { key: 'cover_2',   value: 'Cover 2',   aliases: [] },
    { key: 'cover_3',   value: 'Cover 3',   aliases: [] },
    { key: 'cover_4',   value: 'Cover 4',   aliases: ['Quarters'] },
    { key: 'tampa_2',   value: 'Tampa 2',   aliases: [] },
    { key: 'fire_zone', value: 'Fire Zone', aliases: ['Zone Blitz'] },
  ]),
  ...make('personnel', [
    { key: '11', value: '11 (1TE/1RB)', aliases: [] },
    { key: '12', value: '12 (2TE/1RB)', aliases: [] },
    { key: '21', value: '21 (1TE/2RB)', aliases: [] },
    { key: '22', value: '22 (2TE/2RB)', aliases: ['Two-Back'] },
  ]),
];

// ─── PRESETS registry ──────────────────────────────────────────────────────
export const PRESETS = [
  {
    id: 'air_raid',
    label: 'Air Raid',
    description: 'Pass-heavy spread system with mesh concepts and 4-wide sets.',
    data: AIR_RAID_PRESET,
  },
  {
    id: 'spread',
    label: 'Spread',
    description: 'Modern spread option with RPOs, zone reads, and tempo.',
    data: SPREAD_PRESET,
  },
  {
    id: 'wing_t',
    label: 'Wing-T',
    description: 'Classic misdirection run system with jet sweeps and traps.',
    data: WING_T_PRESET,
  },
  {
    id: 'pro_style',
    label: 'Pro Style',
    description: 'Traditional pro-style system with route trees and power run game.',
    data: PRO_STYLE_PRESET,
  },
];