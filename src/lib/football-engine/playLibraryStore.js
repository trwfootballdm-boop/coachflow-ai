import { useSyncExternalStore } from 'react';
import { getSeedPlayLibrary } from '@/lib/football-engine/seedData.js';

const seed = getSeedPlayLibrary();

const initialState = {
  hydrated: false,
  concepts: [],
  calls: [],
  formations: seed.formations,
  tags: seed.tags,
  weekly: {
    opponent: 'Opponent',
    weekLabel: 'Week Plan',
    focus: ['Core menu', 'Situational answers', 'Player-fit calls'],
  },
  selectedConceptId: null,
  filters: {
    family: 'all',
    situation: 'all',
    activation: 'all',
    search: '',
    coreOnly: false,
  },
};

let store = initialState;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function setStore(next) {
  store = typeof next === 'function' ? next(store) : next;
  emit();
}

function buildSeedState() {
  return {
    ...store,
    hydrated: true,
    concepts: seed.concepts.map((concept) => ({
      ...concept,
      archived: false,
      custom: false,
      detailNotes: '',
    })),
    calls: seed.calls.map((call) => ({
      ...call,
      activation: call.weeklyDefault ? 'weekly_candidate' : 'library',
      archived: false,
      custom: false,
      detailNotes: call.notes ?? '',
      playerFitNotes: {
        featuredPlayers: [],
        preferredBallCarrier: '',
        preferredTarget: '',
        readKey: '',
        attackPlayer: '',
        avoidPlayer: '',
        matchupNotes: '',
      },
    })),
    formations: seed.formations,
    tags: seed.tags,
    selectedConceptId: seed.concepts[0]?.id ?? null,
  };
}

function mergeUnique(base, incoming) {
  return Array.from(new Set([...base, ...incoming].filter(Boolean)));
}

export const playLibraryStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot() {
    return store;
  },

  hydrateWithSeed() {
    if (store.hydrated) return;
    setStore(buildSeedState());
  },

  resetToSeed() {
    setStore({
      ...initialState,
      ...buildSeedState(),
    });
  },

  setWeeklyContext(payload) {
    setStore((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        ...payload,
      },
    }));
  },

  setSelectedConcept(conceptId) {
    setStore((prev) => ({
      ...prev,
      selectedConceptId: conceptId,
    }));
  },

  setFilter(key, value) {
    setStore((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  },

  clearFilters() {
    setStore((prev) => ({
      ...prev,
      filters: initialState.filters,
    }));
  },

  setCallActivation(callId, activation) {
    setStore((prev) => ({
      ...prev,
      calls: prev.calls.map((call) =>
        call.id === callId ? { ...call, activation } : call
      ),
    }));
  },

  updateConcept(conceptId, updates) {
    setStore((prev) => ({
      ...prev,
      concepts: prev.concepts.map((concept) => {
        if (concept.id !== conceptId) return concept;

        return {
          ...concept,
          ...updates,
          formations: updates.formations ?? concept.formations,
          motions: updates.motions ?? concept.motions,
          tags: updates.tags ?? concept.tags,
          situations: updates.situations ?? concept.situations,
          bestVs: updates.bestVs ?? concept.bestVs,
          complements: updates.complements ?? concept.complements,
          teachingPoints: updates.teachingPoints ?? concept.teachingPoints,
        };
      }),
    }));
  },

  updateCall(callId, updates) {
    setStore((prev) => ({
      ...prev,
      calls: prev.calls.map((call) => {
        if (call.id !== callId) return call;

        return {
          ...call,
          ...updates,
          tags: updates.tags ?? call.tags,
          situations: updates.situations ?? call.situations,
          notes: updates.notes ?? call.notes,
          detailNotes: updates.detailNotes ?? call.detailNotes,
        };
      }),
    }));
  },

  updatePlayerFitNotes(callId, updates) {
    setStore((prev) => ({
      ...prev,
      calls: prev.calls.map((call) => {
        if (call.id !== callId) return call;

        const current = call.playerFitNotes ?? {
          featuredPlayers: [],
          preferredBallCarrier: '',
          preferredTarget: '',
          readKey: '',
          attackPlayer: '',
          avoidPlayer: '',
          matchupNotes: '',
        };

        return {
          ...call,
          playerFitNotes: {
            ...current,
            ...updates,
            featuredPlayers: updates.featuredPlayers
              ? mergeUnique([], updates.featuredPlayers)
              : current.featuredPlayers,
          },
        };
      }),
    }));
  },

  promoteCallToCallsheet(callId) {
    setStore((prev) => ({
      ...prev,
      calls: prev.calls.map((call) => {
        if (call.id !== callId) return call;
        if (call.archived) return call;

        const allowed =
          call.activation === 'practiced' ||
          call.activation === 'installed' ||
          call.activation === 'weekly_candidate';

        return {
          ...call,
          activation: allowed ? 'callsheet' : call.activation,
        };
      }),
    }));
  },

  removeCallFromCallsheet(callId) {
    setStore((prev) => ({
      ...prev,
      calls: prev.calls.map((call) => {
        if (call.id !== callId) return call;
        if (call.activation !== 'callsheet') return call;

        return {
          ...call,
          activation: 'practiced',
        };
      }),
    }));
  },

  toggleArchiveConcept(conceptId) {
    setStore((prev) => {
      const concept = prev.concepts.find((item) => item.id === conceptId);
      const archived = !concept?.archived;

      return {
        ...prev,
        concepts: prev.concepts.map((item) =>
          item.id === conceptId ? { ...item, archived } : item
        ),
        calls: prev.calls.map((call) =>
          call.conceptId === conceptId
            ? { ...call, archived, activation: archived ? 'archived' : 'library' }
            : call
        ),
      };
    });
  },

  addCustomConcept(concept) {
    setStore((prev) => ({
      ...prev,
      concepts: [...prev.concepts, { ...concept, custom: true }],
    }));
  },

  addCustomCall(call) {
    setStore((prev) => ({
      ...prev,
      calls: [...prev.calls, { ...call, custom: true }],
    }));
  },
};

export function usePlayLibraryStore() {
  return useSyncExternalStore(
    playLibraryStore.subscribe,
    playLibraryStore.getSnapshot,
    playLibraryStore.getSnapshot
  );
}

export function getConceptCalls(conceptId, calls) {
  return calls.filter((call) => call.conceptId === conceptId && !call.archived);
}

export function getConceptById(conceptId, concepts) {
  return concepts.find((concept) => concept.id === conceptId) ?? null;
}