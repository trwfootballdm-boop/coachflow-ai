import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, CheckSquare, Square, Plus, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDES = ['offense', 'defense', 'special_teams'];

export default function PlayPickerForCallSheet({ teamId, targetSection, sectionName, practicePlayIds, existingPlayIds, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('offense');
  const [selected, setSelected] = useState([]);
  const [showPracticedOnly, setShowPracticedOnly] = useState(false);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', teamId],
    queryFn: () => base44.entities.Play.filter({ team_id: teamId }, 'play_name'),
    enabled: !!teamId,
  });

  const { data: allScriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', teamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: teamId });
      if (!scripts.length) return [];
      const items = await Promise.all(scripts.map(s =>
        base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id })
      ));
      return items.flat();
    },
    enabled: !!teamId,
  });

  const practicedPlayIds = useMemo(() => new Set(allScriptItems.map(i => i.play_id).filter(Boolean)), [allScriptItems]);

  const filtered = useMemo(() => {
    return plays.filter(p => {
      if (p.side_of_ball !== side) return false;
      if (existingPlayIds?.includes(p.id)) return false;
      if (showPracticedOnly && !practicedPlayIds.has(p.id)) return false;
      if (search) {
        const hay = [p.play_name, p.short_name, p.concept, p.play_family].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [plays, side, search, showPracticedOnly, practicedPlayIds, existingPlayIds]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const selectedPlays = plays.filter(p => selected.includes(p.id));

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display font-bold text-sm">Add to {sectionName || 'Section'}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{practicedPlayIds.size} plays practiced this week</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Side tabs */}
      <div className="flex border-b border-border shrink-0">
        {SIDES.map(s => (
          <button key={s} onClick={() => setSide(s)}
            className={cn(
              "flex-1 text-[10px] font-bold py-2.5 capitalize transition-all border-b-2",
              side === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {s === 'special_teams' ? 'ST' : s}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="px-3 py-2 border-b border-border shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plays..." className="pl-8 h-8 text-xs bg-secondary/50 border-0" />
        </div>
        <button
          onClick={() => setShowPracticedOnly(p => !p)}
          className={cn(
            "w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border transition-colors",
            showPracticedOnly ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold" :
              "border-border text-muted-foreground hover:bg-secondary/40"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Practiced this week only
        </button>
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
            {showPracticedOnly && <p className="text-xs text-muted-foreground mt-1">Try removing the practiced filter</p>}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(play => {
              const isSelected = selected.includes(play.id);
              const isPracticed = practicedPlayIds.has(play.id);
              return (
                <button key={play.id} onClick={() => toggle(play.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                  )}>
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    : <Square className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate flex-1">{play.play_name}</p>
                      {isPracticed
                        ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        : <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {play.short_name && <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>}
                      {play.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
                      {isPracticed && <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded">PREPPED</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        {selected.length > 0 ? (
          <Button onClick={() => onAdd(selectedPlays, targetSection)} className="w-full gap-2 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> Add {selected.length} Play{selected.length > 1 ? 's' : ''}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-1">Select plays to add</p>
        )}
      </div>
    </div>
  );
}