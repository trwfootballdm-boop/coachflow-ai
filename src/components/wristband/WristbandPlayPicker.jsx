import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WristbandPlayPicker({ plays, usedPlayIds, practicedMap, sideFilter, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');

  const families = useMemo(() => {
    const set = new Set();
    plays.forEach(p => { if (p.play_family) set.add(p.play_family); });
    return Array.from(set).sort();
  }, [plays]);

  const filtered = useMemo(() => {
    return plays.filter(p => {
      const side = p.side || p.side_of_ball;
      if (sideFilter && side !== sideFilter) return false;
      if (familyFilter && p.play_family !== familyFilter) return false;
      if (!search) return true;
      return [p.name, p.play_name, p.short_name, p.concept, p.play_family]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    });
  }, [plays, sideFilter, familyFilter, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Plays</p>
          {onClose && (
            <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plays…" className="pl-7 h-7 text-xs bg-secondary/50 border-0" />
        </div>
        {families.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFamilyFilter('')}
              className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full transition-all",
                !familyFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}
            >
              All
            </button>
            {families.map(f => (
              <button key={f}
                onClick={() => setFamilyFilter(f === familyFilter ? '' : f)}
                className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full transition-all",
                  familyFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">No plays match</div>
        )}
        {filtered.map(play => {
          const used = usedPlayIds.has(play.id);
          const practiced = practicedMap[play.id];
          const name = play.name || play.play_name;
          return (
            <button
              key={play.id}
              onClick={() => !used && onAdd(play)}
              disabled={used}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                used ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary/40"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {play.short_name && (
                    <code className="text-[9px] text-primary/70 font-mono">{play.short_name}</code>
                  )}
                  {play.concept && (
                    <span className="text-[9px] text-muted-foreground">{play.concept}</span>
                  )}
                  {practiced
                    ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 ml-auto shrink-0" />
                    : <AlertTriangle className="h-2.5 w-2.5 text-amber-400/70 ml-auto shrink-0" />}
                </div>
              </div>
              {used
                ? <span className="text-[9px] text-primary/60 font-bold shrink-0">✓</span>
                : <Plus className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}