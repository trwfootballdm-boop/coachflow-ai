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
    id: 'call-iz-doubles-bubble',
    conceptId: 'inside-zone',
    callName: 'Doubles Right Inside Zone Bubble',
    formation: 'Doubles Right',
    motion: '',
    personnel: '10',
    tags: ['Bubble'],
    situations: ['first_and_ten', 'base'],
    notes: 'Conflict apex defender pre-snap.',
  },
  {
    id: 'call-iz-trips-slice',
    conceptId: 'inside-zone',
    callName: 'Trips Left Inside Zone Slice',
    formation: 'Trips Left',
    personnel: '11',
    tags: ['Slice'],
    situations: ['base', 'red_zone'],
    notes: 'Useful versus even front with backside chase.',
  },
  {
    id: 'call-counter-jet',
    conceptId: 'gt-counter',
    callName: 'Doubles Jet GT Counter',
    formation: 'Doubles',
    motion: 'Jet',
    personnel: '10',
    tags: ['Kick'],
    situations: ['first_and_ten', 'shot'],
    notes: 'Use after showing jet sweep action.',
  },
  {
    id: 'call-stick-2x2',
    conceptId: 'stick',
    callName: '2x2 Gun Stick',
    formation: '2x2 Gun',
    personnel: '10',
    tags: ['Arrow'],
    situations: ['third_short', 'second_short'],
    notes: 'Simple access throw versus zone.',
  },
  {
    id: 'call-mesh-bunch-wheel',
    conceptId: 'mesh',
    callName: 'Bunch Right Mesh Wheel',
    formation: 'Bunch Right',
    personnel: '11',
    tags: ['Wheel'],
    situations: ['third_medium', 'two_minute'],
    notes: 'Good man answer with run-after-catch potential.',
  },
  {
    id: 'call-verts-trips-bender',
    conceptId: 'four-verts',
    callName: 'Trips Right 4 Verts Bender',
    formation: 'Trips Right',
    personnel: '10',
    tags: ['Bender'],
    situations: ['third_long', 'shot', 'two_minute'],
    notes: 'Attack MOFO or isolate inside safety leverage.',
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