import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Library, Loader2, ChevronLeft, ChevronRight, Download, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import PlayLibraryFilters from '@/components/play-library/PlayLibraryFilters';
import PlayTable from '@/components/play-library/PlayTable';
import PlayDetailPanel from '@/components/play-library/PlayDetailPanel';
import BulkActionBar from '@/components/play-library/BulkActionBar';
import SavedViews from '@/components/play-library/SavedViews';
import PlayCardList from '@/components/play-library/PlayCardList';

const SIDE_TABS = [
  { value: 'offense', label: 'Offense' },
  { value: 'defense', label: 'Defense' },
  { value: 'special_teams', label: 'Special Teams' },
];

const PAGE_SIZES = [10, 25, 50];

const DEFAULT_FILTERS = {
  search: '', formation: 'all', playFamily: 'all', concept: 'all',
  installDay: 'all', difficulty: 'all', status: 'all', favoritesOnly: false,
  downDistance: [], fieldZone: [], fronts: [], coverages: [], situations: [],
};

const DEFAULT_SORT = { field: 'updated_date', dir: 'desc' };

function applySort(plays, sort) {
  return [...plays].sort((a, b) => {
    let av = a[sort.field] ?? '';
    let bv = b[sort.field] ?? '';
    if (sort.field === 'updated_date') {
      av = new Date(av).getTime() || 0;
      bv = new Date(bv).getTime() || 0;
    }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function applyFilters(plays, filters, side) {
  return plays.filter(play => {
    // Side of ball
    if (play.side !== side) return false;

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [play.name, play.play_name, play.short_name, play.formation, play.concept, play.play_family]
        .filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Dropdowns
    if (filters.formation !== 'all' && play.formation !== filters.formation) return false;
    if (filters.playFamily !== 'all' && play.play_family !== filters.playFamily) return false;
    if (filters.concept !== 'all' && play.concept !== filters.concept) return false;
    if (filters.installDay !== 'all' && String(play.install_day) !== filters.installDay) return false;
    if (filters.difficulty !== 'all' && play.age_level_difficulty !== filters.difficulty) return false;
    if (filters.status === 'active' && play.is_active === false) return false;
    if (filters.status === 'inactive' && play.is_active !== false) return false;
    if (filters.favoritesOnly && !play.is_favorite) return false;

    // Tag filters — any match within each active group
    const matchTag = (selectedTags, playTags) => {
      if (!selectedTags.length) return true;
      if (!playTags?.length) return false;
      return selectedTags.some(t => playTags.includes(t));
    };
    if (!matchTag(filters.downDistance, play.down_distance_tags)) return false;
    if (!matchTag(filters.fieldZone, play.field_zone_tags)) return false;
    if (!matchTag(filters.fronts, play.opponent_front_tags)) return false;
    if (!matchTag(filters.coverages, play.coverage_tags)) return false;

    return true;
  });
}

export default function PlayLibrary() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [side, setSide] = useState('offense');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [detailPlay, setDetailPlay] = useState(null);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const toggleFavMutation = useMutation({
    mutationFn: (play) => base44.entities.Play.update(play.id, { is_favorite: !play.is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plays'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (play) => base44.entities.Play.update(play.id, { is_active: play.is_active === false ? true : false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Status updated');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (play) => {
      const { id, created_date, updated_date, created_by_id, ...data } = play;
      return base44.entities.Play.create({ ...data, name: `${data.name || data.play_name} (Copy)` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Play duplicated');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => base44.entities.Play.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      setSelected([]);
      toast.success('Plays updated');
    },
  });

  const handleSort = (field) => {
    setSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setSelected([]);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    setPage(1);
    setSelected([]);
    setDetailPlay(null);
  };

  const filteredSorted = useMemo(() => {
    return applySort(applyFilters(plays, filters, side), sort);
  }, [plays, filters, side, sort]);

  const totalPages = Math.ceil(filteredSorted.length / pageSize);
  const pagePlays = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSelectAll = () => {
    setSelected(selected.length === pagePlays.length ? [] : pagePlays.map(p => p.id));
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleApplySavedView = (viewFilters) => {
    setFilters(prev => ({ ...DEFAULT_FILTERS, ...viewFilters }));
    if (viewFilters.side) setSide(viewFilters.side);
    setPage(1);
  };

  const handleAddToScript = (play) => {
    toast.info(`"${play.name || play.play_name}" — select a script in Practice Scripts to add it.`);
  };
  const handleAddToGamePlan = (play) => {
    toast.info(`"${play.name || play.play_name}" — select a game plan to add it.`);
  };

  const sideCounts = useMemo(() => {
    const counts = { offense: 0, defense: 0, special_teams: 0 };
    plays.forEach(p => { if (counts[p.side] !== undefined) counts[p.side]++; });
    return counts;
  }, [plays]);

  const activeFilterCount = [
    filters.search, filters.formation !== 'all' && filters.formation,
    filters.playFamily !== 'all', filters.concept !== 'all',
    filters.installDay !== 'all', filters.difficulty !== 'all',
    filters.status !== 'all', filters.favoritesOnly,
    ...filters.downDistance, ...filters.fieldZone, ...filters.fronts, ...filters.coverages, ...filters.situations,
  ].filter(Boolean).length;

  return (
    <div className={cn("flex gap-0 h-[calc(100vh-64px)] -m-6 overflow-hidden", detailPlay && "")}>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold">Play Library</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {plays.length} total plays · {filteredSorted.length} matching
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">{activeFilterCount} filters active</Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs hidden sm:flex">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button onClick={() => navigate('/play-designer')} size="sm" className="gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" /> New Play
              </Button>
            </div>
          </div>

          {/* Side-of-ball tabs */}
          <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl w-fit">
            {SIDE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => handleSideChange(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  side === tab.value
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  side === tab.value ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {sideCounts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Saved views */}
          <SavedViews activeView={null} onApply={handleApplySavedView} />

          {/* Filters */}
          <PlayLibraryFilters
            filters={filters}
            onChange={handleFilterChange}
            plays={plays.filter(p => p.side === side)}
            side={side}
          />

          {/* Content area */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Library className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold">
                {plays.filter(p => p.side === side).length === 0 ? `No ${side.replace('_', ' ')} plays yet` : 'No plays match your filters'}
              </h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {plays.filter(p => p.side === side).length === 0
                  ? 'Build your playbook by creating plays organized by formation, concept, and situation.'
                  : 'Try adjusting or clearing your filters to see more plays.'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleFilterChange(DEFAULT_FILTERS)}>
                    Clear All Filters
                  </Button>
                )}
                <Button size="sm" className="rounded-xl gap-1.5" onClick={() => navigate('/play-designer')}>
                  <Plus className="h-4 w-4" /> New Play
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <PlayTable
                  plays={pagePlays}
                  sort={sort}
                  onSort={handleSort}
                  selected={selected}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onOpen={(play) => setDetailPlay(play)}
                  onEdit={(play) => navigate(`/play-designer?id=${play.id}`)}
                  onDuplicate={(play) => duplicateMutation.mutate(play)}
                  onToggleFav={(play) => toggleFavMutation.mutate(play)}
                  onToggleActive={(play) => toggleActiveMutation.mutate(play)}
                  onAddToScript={handleAddToScript}
                  onAddToGamePlan={handleAddToGamePlan}
                />
              </div>
              {/* Mobile cards */}
              <div className="md:hidden">
                <PlayCardList
                  plays={pagePlays}
                  selected={selected}
                  onSelect={handleSelect}
                  onOpen={(play) => setDetailPlay(play)}
                  onEdit={(play) => navigate(`/play-designer?id=${play.id}`)}
                  onDuplicate={(play) => duplicateMutation.mutate(play)}
                  onToggleFav={(play) => toggleFavMutation.mutate(play)}
                  onToggleActive={(play) => toggleActiveMutation.mutate(play)}
                  onAddToScript={handleAddToScript}
                  onAddToGamePlan={handleAddToGamePlan}
                />
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <div className="flex items-center gap-1">
                    {PAGE_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => { setPageSize(size); setPage(1); }}
                        className={cn(
                          "h-7 w-9 text-xs rounded-md font-medium transition-colors",
                          pageSize === size ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <span>· {filteredSorted.length} plays</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                    disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                    disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right detail panel */}
      {detailPlay && (
        <div className="w-80 xl:w-96 shrink-0 overflow-hidden">
          <PlayDetailPanel
            play={detailPlay}
            onClose={() => setDetailPlay(null)}
            onEdit={(play) => navigate(`/play-designer?id=${play.id}`)}
            onDuplicate={(play) => duplicateMutation.mutate(play)}
            onToggleFav={(play) => toggleFavMutation.mutate(play)}
            onAddToScript={handleAddToScript}
            onAddToGamePlan={handleAddToGamePlan}
          />
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selected.length}
        onClear={() => setSelected([])}
        onAddToScript={() => handleAddToScript({ name: `${selected.length} plays` })}
        onAddToGamePlan={() => handleAddToGamePlan({ name: `${selected.length} plays` })}
        onFavorite={() => bulkMutation.mutate({ ids: selected, data: { is_favorite: true } })}
        onActivate={() => bulkMutation.mutate({ ids: selected, data: { is_active: true } })}
        onDeactivate={() => bulkMutation.mutate({ ids: selected, data: { is_active: false } })}
        onDuplicate={async () => {
          const selectedPlays = plays.filter(p => selected.includes(p.id));
          for (const play of selectedPlays) await duplicateMutation.mutateAsync(play);
          setSelected([]);
        }}
      />
    </div>
  );
}