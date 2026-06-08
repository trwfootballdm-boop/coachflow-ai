import { useEffect } from 'react';
import { playLibraryStore, usePlayLibraryStore } from './playLibraryStore.js';

export function useSeedLibrary() {
  const state = usePlayLibraryStore();

  useEffect(() => {
    if (!state.hydrated) {
      playLibraryStore.hydrateWithSeed();
    }
  }, [state.hydrated]);

  return state;
}