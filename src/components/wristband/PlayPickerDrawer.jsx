import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlayPickerDrawer({ plays, loading, existingPlayIds, sectionName, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());

  const filtered = useMemo(() => plays.filter(p => {
    if (!search) return true;
    return [p.name, p.play_name, p.short_name, p.concept, p.play_family]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
  }), [plays, search]);

  const handleAdd = (play) => {
    onAdd(play);
    setAddedIds(prev => new Set([...prev, play.id]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h3 className="font-display font-bold text-sm">Add Play</h3>
            {sectionName && <p className="text-xs text-muted-foreground">→ {sectionName}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search plays…"
              className="pl-8 h-8 text-xs bg-secondary/50 border-0" />
          </div>
        </div>

        {/* Play list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No plays found</div>
          ) : filtered.map(play => {
            const alreadyOn = existingPlayIds.has(play.id);
            const justAdded = addedIds.has(play.id);
            const playName = play.name || play.play_name;

            return (
              <button key={play.id}
                onClick={() => !alreadyOn && handleAdd(play)}
                disabled={alreadyOn}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  alreadyOn ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary/30"
                )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {play.short_name && <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>}
                    {play.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
                    {play.run_pass && (
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded",
                        play.run_pass === 'run' ? "bg-emerald-500/10 text-emerald-700" :
                        play.run_pass === 'pass' ? "bg-sky-500/10 text-sky-700" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {play.run_pass?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {alreadyOn ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : justAdded ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <Button variant="outline" className="w-full text-sm rounded-xl" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}