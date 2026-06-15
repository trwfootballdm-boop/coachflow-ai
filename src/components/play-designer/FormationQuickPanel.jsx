import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/components/TeamContext';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Search,
  ChevronRight,
  Star,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import FormationThumbnail from './FormationThumbnail';

const TYPE_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'shotgun',      label: 'Gun' },
  { value: 'under_center', label: 'UC' },
  { value: 'pistol',       label: 'Pistol' },
  { value: 'empty',        label: 'Empty' },
  { value: 'spread',       label: 'Spread' },
  { value: 'i_formation',  label: 'I' },
  { value: '4-3',          label: '4-3' },
  { value: '3-4',          label: '3-4' },
  { value: 'nickel',       label: 'Nickel' },
];

export default function FormationQuickPanel({ onLoadFormation }) {
  const { activeTeamId } = useTeam();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations', activeTeamId],
    queryFn: () => base44.entities.Formation.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return formations
      .filter((f) => {
        if (filter !== 'all' && f.formation_type !== filter) return false;
        if (!q) return true;
        return (
          f.formation_name?.toLowerCase().includes(q) ||
          f.short_name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
        return (b.usage_count || 0) - (a.usage_count || 0);
      })
      .slice(0, 24);
  }, [formations, search, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          Formations
        </div>
        <Link
          to="/formations"
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Library <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1 space-y-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-[11px]"
            placeholder="Search…"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors',
                filter === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyHint hasAny={formations.length > 0} />
        ) : (
          <div className="py-1">
            {filtered.map((formation) => (
              <FormationRow
                key={formation.id}
                formation={formation}
                onClick={() => onLoadFormation?.(formation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormationRow({ formation, onClick }) {
  const playerCount =
    formation.players?.length ||
    formation.player_count ||
    0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent/40 transition-colors text-left"
    >
      {/* Thumbnail */}
      <div className="shrink-0 rounded overflow-hidden w-14 h-10 bg-muted">
        {formation.players?.length ? (
          <FormationThumbnail
            players={formation.players}
            width={56}
            height={40}
            showLabels={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutGrid className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-foreground truncate">
            {formation.formation_name}
          </span>
          {formation.is_favorite && (
            <Star className="h-3 w-3 text-amber-500 shrink-0" fill="currentColor" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {formation.formation_type && (
            <span className="text-[10px] text-muted-foreground">
              {formation.formation_type.replace('_', ' ')}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{playerCount}p</span>
          {formation.usage_count > 0 && (
            <span className="text-[10px] text-muted-foreground">×{formation.usage_count}</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
    </button>
  );
}

function EmptyHint({ hasAny }) {
  return (
    <div className="px-3 py-6 text-center space-y-1.5">
      <p className="text-xs font-medium text-foreground">
        {hasAny ? 'No matches' : 'No saved formations'}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {hasAny
          ? 'Try a different search or filter.'
          : 'Set an alignment on the field, then click "Save Formation" in the header.'}
      </p>
      {!hasAny && (
        <Link
          to="/formations"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
        >
          Open Formation Library <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}