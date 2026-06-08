import { seedConcepts, seedCalls } from '@/lib/football-engine/seedData';

export function getInitialPlayLibrary() {
  return {
    concepts: seedConcepts,
    calls: seedCalls,
    customConcepts: [],
    customCalls: [],
  };
}

export function buildCallSheetForWeek(weekNumber) {
  const coreConcepts = seedConcepts.filter((c) => c.core && c.installTier === 1);
  const coreCalls = seedCalls.filter((call) =>
    coreConcepts.some((c) => c.id === call.conceptId)
  );

  return {
    weekNumber,
    concepts: coreConcepts,
    calls: coreCalls,
    generatedAt: new Date().toISOString(),
  };
}

export function getCallsBySituation(situation) {
  return seedCalls.filter((call) => call.situations.includes(situation));
}

export function getConceptById(id) {
  return seedConcepts.find((c) => c.id === id);
}

export function getCallsByConcept(conceptId) {
  return seedCalls.filter((c) => c.conceptId === conceptId);
}