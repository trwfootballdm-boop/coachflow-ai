import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, CheckSquare, Square, Plus, Loader2, Star, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDES = [
  { key: 'offense',       label: 'OFF' },
  { key: 'defense',       label: 'DEF' },
  { key: 'special_teams', label: 'ST'  },
];

const RUN_PASS_LABELS = {
  run:                'Run',
  pass:               'Pass',
  rpo:                'RPO',
  defense_call:       'Call',
  special_teams_call: 'ST',
};

export default function PlayPickerPanel({ teamId, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('offense');
  const [selected, setSelected] = useState([]);
  const [familyFilter, setFamilyFilter] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', teamId],
    queryFn: () => base44.entities.Play.filter({ team_id: teamId }, 'play_name'),
    enabled: !!teamId,
    staleTime: 30_000,
  });

  // Derive unique families for the active side
  const families = useMemo(() => {
    const sidePlays = plays.filter(p => p.side_of_ball === side || p.side === side);
    const set = new Set(sidePlays.map(p => p.play_family).filter(Boolean));
    return Array.from(set).sort();
  }, [plays, side]);

  const filtered = useMemo(() => {
    return plays.filter(p => {
      const matchSide   = p.side_of_ball === side || p.side === side;
      const matchSearch = !search || [p.play_name, p.name, p.short_name, p.concept, p.play_family, p.formation]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
      const matchFam    = !familyFilter || p.play_family === familyFilter;
      const matchFav    = !favOnly || p.favorite || p.is_favorite;
      return matchSide && matchSearch && matchFam && matchFav;
    });
  }, [plays, side, search, familyFilter, favOnly]);

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  const selectAll = () => {
    const ids = filtered.map(p => p.id);
    const allSelected = ids.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelected(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const selectedPlays = plays.filter(p => selected.includes(p.id));
  const filteredIds = filtered.map(p => p.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selected.includes(id));

  const switchSide = (s) => {
    setSide(s);
    setFamilyFilter('');
    setFavOnly(false);
  };

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden print:hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display font-bold text-sm">Play Library</h3>
          {selected.length > 0 && (
            <p className="text-[10px] text-primary font-medium mt-0.5">{selected.length} selected</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn("h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
              showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}
            title="Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Side tabs */}
      <div className="flex border-b border-border shrink-0">
        {SIDES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchSide(key)}
            className={cn(
              "flex-1 text-xs font-bold py-2 tracking-wider transition-all border-b-2",
              side === key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Expandable filter row */}
      {showFilters && (
        <div className="px-3 py-2.5 border-b border-border flex flex-wrap gap-2 shrink-0 bg-secondary/20">
          {/* Fav toggle */}
          <button
            onClick={() => setFavOnly(v => !v)}
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-all",
              favOnly
                ? "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300"
                : "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600"
            )}
          >
            <Star className={cn("h-3 w-3", favOnly && "fill-current")} />
            Favorites
          </button>

          {/* Family chips */}
          {families.map(fam => (
            <button
              key={fam}
              onClick={() => setFamilyFilter(v => v === fam ? '' : fam)}
              className={cn(
                "text-[10px] font-medium px-2 py-1 rounded-full border capitalize transition-all",
                familyFilter === fam
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {fam}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plays..."
            className="pl-8 h-8 text-xs bg-secondary/50 border-0"
            autoFocus
          />
        </div>
      </div>

      {/* Select-all bar */}
      {filtered.length > 0 && !isLoading && (
        <div className="px-4 py-1.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-secondary/10">
          <button onClick={selectAll} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
            {allFilteredSelected
              ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
              : <Square className="h-3.5 w-3.5" />
            }
            {allFilteredSelected ? 'Deselect all' : `Select all (${filtered.length})`}
          </button>
          <span className="text-[10px] text-muted-foreground">{filtered.length} play{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Play list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4 gap-1">
            <p className="text-sm text-muted-foreground">No plays found</p>
            {(search || familyFilter || favOnly) && (
              <button
                onClick={() => { setSearch(''); setFamilyFilter(''); setFavOnly(false); }}
                className="text-xs text-primary hover:underline mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map(play => {
              const isSelected = selected.includes(play.id);
              const name = play.play_name || play.name;
              return (
                <button
                  key={play.id}
                  onClick={() => toggle(play.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-secondary/30 border-l-2 border-transparent"
                  )}
                >
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                    : <Square className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate leading-tight">{name}</p>
                      {(play.favorite || play.is_favorite) && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {play.short_name && (
                        <code className="text-[10px] text-muted-foreground font-mono bg-secondary px-1 rounded">
                          {play.short_name}
                        </code>
                      )}
                      {play.play_family && (
                        <span className="text-[10px] text-muted-foreground capitalize">{play.play_family}</span>
                      )}
                      {play.run_pass_type && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {RUN_PASS_LABELS[play.run_pass_type] || play.run_pass_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add footer */}
      <div className="p-3 border-t border-border shrink-0">
        {selected.length > 0 ? (
          <Button onClick={() => onAdd(selectedPlays)} className="w-full gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add {selected.length} Play{selected.length > 1 ? 's' : ''}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-1">
            Select plays to add
          </p>
        )}
      </div>
    </div>
  );
}