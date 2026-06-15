// Hook to read team terminology — used by Play Designer, Wristband, Scout Cards, etc.
// Returns a map keyed by category with the team's term values + aliases.

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/components/TeamContext';
import { useMemo } from 'react';

export function useTerminology() {
  const { activeTeamId } = useTeam();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['terminology', activeTeamId],
    queryFn: async () =>
      base44.entities.Terminology.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
    // shared cache key with Terminology page so edits propagate immediately
  });

  const byCategory = useMemo(() => {
    const out = {
      route: [],
      formation_tag: [],
      motion: [],
      protection: [],
      concept: [],
      defensive_call: [],
      personnel: [],
    };
    const sorted = [...rows].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    sorted.forEach((r) => {
      if (out[r.category]) out[r.category].push(r);
    });
    return out;
  }, [rows]);

  // Quick accessors: array of display strings per category
  const values = useMemo(() => {
    const out = {};
    Object.keys(byCategory).forEach((k) => {
      out[k] = byCategory[k].map((r) => r.value);
    });
    return out;
  }, [byCategory]);

  return { rows, byCategory, values, isLoading };
}