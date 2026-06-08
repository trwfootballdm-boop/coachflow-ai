import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DOWN_DISTANCE = ['1st-10', '2nd-short', '2nd-medium', '2nd-long', '3rd-short', '3rd-medium', '3rd-long', '4th-short', 'Goal-to-go', '2pt'];
const FIELD_ZONES = ['backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line'];
const FRONTS = ['4-3', '3-4', 'Bear', 'Odd', 'Even', '4-2-5', '3-3-5', '6-2', '5-3', '4-4'];
const COVERAGES = ['Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man', 'Cover 3', 'Cover 4', 'Quarters', 'Man', 'Zone'];
const SITUATIONS = ['opener', 'backed_up', 'two_minute', 'red_zone', 'goal_line', 'short_yardage', 'must_pass'];
const DIFFICULTIES = ['easy', 'moderate', 'advanced'];
const PLAY_FAMILIES_OFF = ['Zone', 'Power', 'Counter', 'Trap', 'Sweep', 'Jet', 'Toss', 'Option', 'Bootleg', 'Play Action', 'Mesh', 'Flood', 'Curl Flat', 'Smash', 'Y Cross', 'Screen', 'RPO'];
const PLAY_FAMILIES_DEF = ['Base', 'Blitz', 'Stunt', 'Zone', 'Man', 'Press', 'Cover 2', 'Cover 3', 'Cover 4'];

function TagChips({ options, selected, onChange, label }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all font-medium",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayLibraryFilters({ filters, onChange, plays, side }) {
  const [expanded, setExpanded] = useState(false);

  const update = (key, val) => onChange({ ...filters, [key]: val });

  const activeCount = [
    filters.search,
    filters.formation !== 'all' && filters.formation,
    filters.playFamily !== 'all' && filters.playFamily,
    filters.concept !== 'all' && filters.concept,
    filters.installDay !== 'all' && filters.installDay,
    filters.difficulty !== 'all' && filters.difficulty,
    filters.status !== 'all' && filters.status,
    filters.favoritesOnly,
    ...filters.downDistance,
    ...filters.fieldZone,
    ...filters.fronts,
    ...filters.coverages,
    ...filters.situations,
  ].filter(Boolean).length;

  const clearAll = () => onChange({
    search: '', formation: 'all', playFamily: 'all', concept: 'all',
    installDay: 'all', difficulty: 'all', status: 'all', favoritesOnly: false,
    downDistance: [], fieldZone: [], fronts: [], coverages: [], situations: [],
  });

  // Derive unique values from actual plays
  const formations = [...new Set(plays.map(p => p.formation).filter(Boolean))];
  const concepts = [...new Set(plays.map(p => p.concept).filter(Boolean))];
  const installDays = [...new Set(plays.map(p => p.install_day).filter(Boolean))].sort((a, b) => a - b);
  const playFamilies = side === 'defense' ? PLAY_FAMILIES_DEF : PLAY_FAMILIES_OFF;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Main filter row */}
      <div className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search play name or short code..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="pl-8 h-8 text-sm bg-secondary/50 border-0"
          />
        </div>

        <Select value={filters.formation} onValueChange={(v) => update('formation', v)}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Formation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formations</SelectItem>
            {formations.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.playFamily} onValueChange={(v) => update('playFamily', v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Play Family" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Families</SelectItem>
            {playFamilies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.concept} onValueChange={(v) => update('concept', v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Concept" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Concepts</SelectItem>
            {concepts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.installDay} onValueChange={(v) => update('installDay', v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Install Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Day</SelectItem>
            {installDays.map(d => <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.difficulty} onValueChange={(v) => update('difficulty', v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Level</SelectItem>
            {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => update('favoritesOnly', !filters.favoritesOnly)}
          className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all",
            filters.favoritesOnly
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", filters.favoritesOnly && "fill-current")} />
          Favorites
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {activeCount > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
              Clear {activeCount}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all",
              expanded
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Tags
            {(filters.downDistance.length + filters.fieldZone.length + filters.fronts.length + filters.coverages.length + filters.situations.length) > 0 && (
              <Badge className="ml-0.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                {filters.downDistance.length + filters.fieldZone.length + filters.fronts.length + filters.coverages.length + filters.situations.length}
              </Badge>
            )}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Expanded tag section */}
      {expanded && (
        <div className="border-t border-border p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <TagChips label="Down & Distance" options={DOWN_DISTANCE} selected={filters.downDistance} onChange={(v) => update('downDistance', v)} />
          <TagChips label="Field Zone" options={FIELD_ZONES} selected={filters.fieldZone} onChange={(v) => update('fieldZone', v)} />
          <TagChips label="Opp. Front" options={FRONTS} selected={filters.fronts} onChange={(v) => update('fronts', v)} />
          <TagChips label="Coverage" options={COVERAGES} selected={filters.coverages} onChange={(v) => update('coverages', v)} />
          <TagChips label="Situation" options={SITUATIONS} selected={filters.situations} onChange={(v) => update('situations', v)} />
        </div>
      )}
    </div>
  );
}