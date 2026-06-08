import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, CheckSquare, Square, Plus, Loader2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIDES = ['offense', 'defense', 'special_teams'];
const SIDE_LABELS = { offense: 'OFF', defense: 'DEF', special_teams: 'ST' };

export default function PlayPickerPanel({ teamId, onAdd, onClose, practicedPlayIds = [] }) {
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('offense');
  const [familyFilter, setFamilyFilter] = useState('');
  const [selected, setSelected] = useState([]);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', teamId],
    queryFn: () => base44.entities.Play.filter({ team_id: teamId }, 'play_name'),
    enabled: !!teamId,
    staleTime: 60_000,
  });

  const families = useMemo(() => {
    const set = new Set(plays.filter(p => p.side_of_ball === side && p.play_family).map(p => p.play_family));
    return Array.from(set).sort();
  }, [plays, side]);

  const filtered = useMemo(() => {
    return plays.filter(p => {
      const matchSide = p.side_of_ball === side;
      const matchFamily = !familyFilter || p.play_family === familyFilter;
      const matchSearch = !search || [p.play_name, p.short_name, p.concept, p.play_family]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
      return matchSide && matchFamily && matchSearch;
    });
  }, [plays, side, search, familyFilter]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const selectedPlays = plays.filter(p => selected.includes(p.id));

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-display font-bold text-sm">Play Library</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Side tabs */}
      <div className="flex border-b border-border shrink-0">
        {SIDES.map(s => (
          <button key={s} onClick={() => { setSide(s); setFamilyFilter(''); }}
            className={cn(
              "flex-1 text-xs font-bold py-2 transition-all border-b-2",
              side === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {SIDE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="px-3 py-2.5 border-b border-border space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plays..." className="pl-8 h-8 text-xs bg-secondary/50 border-0" />
        </div>
        {families.length > 1 && (
          <Select value={familyFilter || '__all'} onValueChange={v => setFamilyFilter(v === '__all' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs bg-secondary/50 border-0">
              <Filter className="h-3 w-3 text-muted-foreground mr-1 shrink-0" />
              <SelectValue placeholder="All families" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All families</SelectItem>
              {families.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Play list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <p className="text-sm text-muted-foreground">No {side} plays found</p>
            {familyFilter && <button className="text-xs text-primary mt-1" onClick={() => setFamilyFilter('')}>Clear filter</button>}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(play => {
              const isSelected = selected.includes(play.id);
              const isPracticed = practicedPlayIds.includes(play.id);
              return (
                <button key={play.id} onClick={() => toggle(play.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                  )}>
                  <div className="shrink-0 mt-0.5">
                    {isSelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{play.play_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {play.short_name && (
                        <code className="text-[10px] text-muted-foreground font-mono bg-secondary px-1 rounded">{play.short_name}</code>
                      )}
                      {play.play_family && (
                        <span className="text-[10px] text-muted-foreground capitalize">{play.play_family}</span>
                      )}
                      {play.concept && (
                        <span className="text-[10px] text-muted-foreground/70">· {play.concept}</span>
                      )}
                      {play.favorite && <span className="text-[10px] text-amber-500">★</span>}
                    </div>
                  </div>
                  {isPracticed && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">
                      ✓ Rep'd
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        {selected.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] text-center text-muted-foreground">{selected.length} selected · tap to deselect</p>
            <Button onClick={() => { onAdd(selectedPlays); setSelected([]); }} className="w-full gap-2 rounded-xl text-sm h-9">
              <Plus className="h-4 w-4" /> Add {selected.length} Play{selected.length > 1 ? 's' : ''}
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-1">Tap plays to select</p>
        )}
      </div>
    </div>
  );
}