import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, CheckSquare, Square, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDES = ['offense', 'defense', 'special_teams'];

export default function PlayPickerPanel({ teamId, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('offense');
  const [selected, setSelected] = useState([]);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', teamId],
    queryFn: () => base44.entities.Play.filter({ team_id: teamId }, 'play_name'),
    enabled: !!teamId,
  });

  const filtered = useMemo(() => {
    return plays.filter(p => {
      const matchSide = p.side_of_ball === side || p.side === side;
      const matchSearch = !search || [p.play_name, p.name, p.short_name, p.concept, p.formation]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
      return matchSide && matchSearch;
    });
  }, [plays, side, search]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const selectedPlays = plays.filter(p => selected.includes(p.id));

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-display font-bold text-sm">Add Plays</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Side tabs */}
      <div className="flex border-b border-border shrink-0">
        {SIDES.map(s => (
          <button key={s} onClick={() => setSide(s)}
            className={cn(
              "flex-1 text-xs font-medium py-2.5 capitalize transition-all border-b-2",
              side === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {s.replace('_', '\n')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plays..." className="pl-8 h-8 text-xs bg-secondary/50 border-0" />
        </div>
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
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(play => {
              const isSelected = selected.includes(play.id);
              const name = play.play_name || play.name;
              return (
                <button key={play.id} onClick={() => toggle(play.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                  )}>
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    : <Square className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {play.short_name && <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>}
                      {play.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
                      {play.is_favorite && <span className="text-[10px] text-amber-500">★</span>}
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
          <Button onClick={() => onAdd(selectedPlays)} className="w-full gap-2 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> Add {selected.length} Play{selected.length > 1 ? 's' : ''}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-1">Select plays to add to script</p>
        )}
      </div>
    </div>
  );
}