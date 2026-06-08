import { useSyncExternalStore } from 'react';
import {
  getSeedPlayLibrary,
} from '@/lib/football-engine/seedData.js';

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
    })),
    calls: seed.calls.map((call) => ({
      ...call,
      activation: call.weeklyDefault ? 'weekly_candidate' : 'library',
      archived: false,
      custom: false,
    })),
    formations: seed.formations,
    tags: seed.tags,
    selectedConceptId: seed.concepts[0]?.id ?? null,
  };
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
          call.conceptId === conceptId ? { ...call, archived, activation: archived ? 'archived' : 'library' } : call
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