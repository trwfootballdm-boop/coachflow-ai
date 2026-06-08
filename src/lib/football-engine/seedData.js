export const seedConcepts = [
  {
    id: 'inside-zone',
    name: 'Inside Zone',
    family: 'run',
    description: 'Core zone run with flexible tags and formation presentation.',
    installTier: 1,
    core: true,
    formations: ['2x2 Gun', '3x1 Gun', 'Trips Open', 'Doubles', 'Pistol'],
    motions: ['Jet', 'Orbit', 'YoYo'],
    tags: ['Read', 'Slice', 'Lock', 'Arc', 'Bubble', 'Cap'],
    situations: ['base', 'first_and_ten', 'second_medium', 'backed_up', 'red_zone'],
    bestVs: ['Even box', 'Over front', 'Light box'],
    complements: ['Stick', 'Bubble', 'Boot', 'Counter'],
  },
  {
    id: 'gt-counter',
    name: 'GT Counter',
    family: 'run',
    description: 'Gap-scheme misdirection run with pullers and tag flexibility.',
    installTier: 1,
    core: true,
    formations: ['2x2 Gun', '3x1 Gun', 'Pistol'],
    motions: ['Jet', 'Return'],
    tags: ['Read', 'Wrap', 'Kick', 'Bubble'],
    situations: ['base', 'first_and_ten', 'third_short', 'red_zone', 'shot'],
    bestVs: ['Fast flow teams', 'Odd front', 'Pressure edge'],
    complements: ['Power', 'Counter Pass', 'Boot'],
  },
  {
    id: 'stick',
    name: 'Stick',
    family: 'quick',
    description: 'High-percentage quick concept that stresses underneath coverage.',
    installTier: 1,
    core: true,
    formations: ['2x2 Gun', '3x1 Gun', 'Doubles', 'Trips'],
    motions: ['Zip', 'Short', 'Trade'],
    tags: ['Out', 'Nod', 'Choice', 'Arrow'],
    situations: ['base', 'first_and_ten', 'second_short', 'third_short', 'red_zone'],
    bestVs: ['Underneath zone', 'Soft apex', 'Cushion'],
    complements: ['Inside Zone', 'Snag', 'Smash'],
  },
  {
    id: 'mesh',
    name: 'Mesh',
    family: 'dropback',
    description: 'Crossing concept that creates horizontal stress and man/zone answers.',
    installTier: 2,
    core: true,
    formations: ['2x2 Gun', '3x1 Gun', 'Bunch'],
    motions: ['Zip', 'Return'],
    tags: ['Sit', 'Wheel', 'Rail', 'Shallow'],
    situations: ['second_medium', 'third_medium', 'two_minute', 'red_zone'],
    bestVs: ['Man', 'Pressure man', 'Match coverage'],
    complements: ['Snag', 'Drive', 'Shallow'],
  },
  {
    id: 'four-verts',
    name: '4 Verticals',
    family: 'dropback',
    description: 'Vertical stretch concept for explosive plays and coverage stress.',
    installTier: 2,
    core: true,
    formations: ['2x2 Gun', '3x1 Gun', 'Trips'],
    motions: ['Trade'],
    tags: ['Bender', 'Switch', 'Hitch-seam'],
    situations: ['shot', 'first_and_ten', 'two_minute', 'third_long'],
    bestVs: ['Middle open', 'Quarters', 'Aggressive safeties'],
    complements: ['Stick', 'Sail', 'Snag'],
  },
  {
    id: 'bubble-tunnel',
    name: 'Bubble / Tunnel',
    family: 'screen',
    description: 'Perimeter screen family to punish leverage and steal easy grass.',
    installTier: 1,
    core: true,
    formations: ['Trips', 'Doubles', '3x1 Gun'],
    motions: ['Fast', 'Orbit'],
    tags: ['Bubble', 'Tunnel', 'Now'],
    situations: ['base', 'first_and_ten', 'backed_up', 'pressure'],
    bestVs: ['Off coverage', 'Overhang conflict', 'Pressure look'],
    complements: ['Inside Zone', 'Stick', 'Counter'],
  },
];

export const seedCalls = [
  {
    id: 'iz-2x2-read',
    conceptId: 'inside-zone',
    callName: 'Iz Read',
    formation: '2x2 Gun',
    motion: 'Jet',
    personnel: '11',
    tags: ['Read', 'Bubble'],
    situations: ['base', 'first_and_ten', 'backed_up'],
    notes: 'Primary opener. Read DE/OLB. Bubble tag for conflict.',
  },
  {
    id: 'iz-trips-lock',
    conceptId: 'inside-zone',
    callName: 'Iz Lock',
    formation: 'Trips Open',
    personnel: '11',
    tags: ['Lock', 'Cap'],
    situations: ['red_zone', 'second_medium'],
    notes: 'Red zone look. Lock backside. Cap for QB scramble.',
  },
  {
    id: 'counter-2x2-wrap',
    conceptId: 'gt-counter',
    callName: 'GT Counter Wrap',
    formation: '2x2 Gun',
    motion: 'Return',
    personnel: '11',
    tags: ['Wrap', 'Kick'],
    situations: ['first_and_ten', 'third_short', 'red_zone'],
    notes: 'Counter look with wrap pull. Kick end for QB.',
  },
  {
    id: 'stick-2x2-out',
    conceptId: 'stick',
    callName: 'Stick Out',
    formation: '2x2 Gun',
    motion: 'Zip',
    personnel: '11',
    tags: ['Out', 'Arrow'],
    situations: ['base', 'second_short', 'third_short'],
    notes: 'Quick game. Out route vs off coverage.',
  },
  {
    id: 'mesh-sit',
    conceptId: 'mesh',
    callName: 'Mesh Sit',
    formation: '2x2 Gun',
    motion: 'Return',
    personnel: '11',
    tags: ['Sit', 'Wheel'],
    situations: ['second_medium', 'third_medium', 'two_minute'],
    notes: 'Crossers + sit. Wheel for check.',
  },
  {
    id: '4verts-bender',
    conceptId: 'four-verts',
    callName: '4 Verts Bender',
    formation: '3x1 Gun',
    personnel: '11',
    tags: ['Bender', 'Hitch-seam'],
    situations: ['shot', 'third_long', 'two_minute'],
    notes: 'Shot play. Bender route for middle window.',
  },
  {
    id: 'bubble-trips',
    conceptId: 'bubble-tunnel',
    callName: 'Bubble Trips',
    formation: 'Trips',
    motion: 'Fast',
    personnel: '11',
    tags: ['Bubble', 'Now'],
    situations: ['base', 'first_and_ten', 'pressure'],
    notes: 'Quick perimeter. Punish off leverage.',
  },
];

export function getConceptsByTier(tier) {
  return seedConcepts.filter((c) => c.installTier === tier);
}

export function getConceptsByFamily(family) {
  return seedConcepts.filter((c) => c.family === family);
}

export function getConceptsForSituation(situation) {
  return seedConcepts.filter((c) => c.situations.includes(situation));
}

export function getCallsForConcept(conceptId) {
  return seedCalls.filter((c) => c.conceptId === conceptId);
}

export function getCallsForSituation(situation) {
  return seedCalls.filter((c) => c.situations.includes(situation));
}

export function getCoreConcepts() {
  return seedConcepts.filter((c) => c.core);
}