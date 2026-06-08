import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Sparkles, Save, Printer, Plus, X, Search, Loader2,
  Copy, Eye, Trash2, MoreVertical, CheckSquare, Square, PenTool,
  CheckCircle2, AlertTriangle, Star, BookOpen
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ScoutCardDetail from '@/components/scout-cards/ScoutCardDetail';
import ScoutCardPrintView from '@/components/scout-cards/ScoutCardPrintView';

const TEMPLATES = [
  { value: 'coach_card', label: 'Coach Card' },
  { value: 'youth_player', label: 'Youth Player' },
  { value: 'compact_grid', label: 'Compact Grid' },
  { value: 'teaching_card', label: 'Teaching Card' },
  { value: 'defense_scout', label: 'Defense Scout Look' },
  { value: 'special_teams', label: 'Special Teams' },
];

const SOURCE_TYPES = [
  { value: 'practice_script', label: 'Practice Script' },
  { value: 'game_plan', label: 'Game Plan / Call Sheet' },
  { value: 'play_library', label: 'Play Library' },
  { value: 'manual', label: 'Manual Build' },
];

function ScoutCard({ card, play, practicedDays, isSelected, onSelect, onOpen, onRemove, template }) {
  if (!play) return null;

  return (
    <div
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-all cursor-pointer group",
        isSelected ? "border-primary/50 ring-1 ring-primary/20 shadow-sm" : "border-border hover:border-border/80 hover:shadow-sm"
      )}
      onClick={() => onOpen(card)}
    >
      {/* Diagram area */}
      <div className="h-28 bg-emerald-900/15 dark:bg-emerald-950/30 relative flex items-center justify-center border-b border-border/50">
        <PenTool className="h-8 w-8 text-emerald-800/20" />
        {card.scout_look_label && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] bg-card/80">{card.scout_look_label}</Badge>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="h-6 w-6 bg-card/70 rounded flex items-center justify-center">
            {isSelected
              ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
              : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </div>
        {practicedDays && practicedDays.length > 0 ? (
          <div className="absolute bottom-2 left-2">
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> {practicedDays.map(d => d.slice(0, 3).toUpperCase()).join('/')}
            </span>
          </div>
        ) : (
          <div className="absolute bottom-2 left-2">
            <span className="text-[9px] font-bold text-red-600 bg-red-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> Not Repped
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{play.play_name}</p>
            {play.short_name && (
              <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary">
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(card); }}>
                  <Eye className="h-3.5 w-3.5 mr-2" /> View / Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(card); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(play.concept || play.play_family) && (
          <div className="flex items-center gap-1 flex-wrap">
            {play.concept && <Badge variant="secondary" className="text-[10px]">{play.concept}</Badge>}
            {play.play_family && <span className="text-[10px] text-muted-foreground">{play.play_family}</span>}
          </div>
        )}

        {card.card_note && (
          <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{card.card_note}"</p>
        )}

        {template === 'coach_card' && play.coaching_points && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{play.coaching_points}</p>
        )}
      </div>
    </div>
  );
}

export default function ScoutCards() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [activeSetId, setActiveSetId] = useState(null);
  const [localCards, setLocalCards] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [template, setTemplate] = useState('coach_card');
  const [sourceType, setSourceType] = useState('play_library');
  const [sideFilter, setSideFilter] = useState('offense');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [detailCard, setDetailCard] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState('Scout Card Set');

  // Scout card sets
  const { data: sets = [] } = useQuery({
    queryKey: ['scoutCardSets', activeTeamId],
    queryFn: () => base44.entities.ScoutCardSet.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  // Plays
  const { data: plays = [], isLoading: playsLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'play_name'),
    enabled: !!activeTeamId,
  });

  // Practice scripts (for practiced status)
  const { data: scriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', activeTeamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-script_date', 10);
      if (!scripts.length) return [];
      const allItems = await Promise.all(
        scripts.map(s => base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id }))
      );
      return allItems.flat().map(item => ({
        ...item,
        _scriptDay: scripts.find(s => s.id === item.practice_script_id)?.practice_day
      }));
    },
    enabled: !!activeTeamId,
  });

  const practicedMap = useMemo(() => {
    const map = {};
    scriptItems.forEach(item => {
      if (!item.play_id) return;
      if (!map[item.play_id]) map[item.play_id] = [];
      const day = item._scriptDay ? item._scriptDay.split('_')[0] : 'rep';
      if (!map[item.play_id].includes(day)) map[item.play_id].push(day);
    });
    return map;
  }, [scriptItems]);

  const playMap = useMemo(() => {
    const m = {};
    plays.forEach(p => { m[p.id] = p; });
    return m;
  }, [plays]);

  const filteredPlays = useMemo(() => {
    return plays.filter(p => {
      const matchSide = !sideFilter || p.side_of_ball === sideFilter;
      const matchSearch = !search || [p.play_name, p.short_name, p.concept, p.play_family]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
      return matchSide && matchSearch;
    });
  }, [plays, sideFilter, search]);

  const autoGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // simulate
    const source = filteredPlays.slice(0, 24);
    const cards = source.map((play, i) => ({
      play_id: play.id,
      include_in_print: true,
      order_index: i,
      card_note: '',
      scout_look_label: '',
    }));
    setLocalCards(cards);
    setIsDirty(true);
    setGenerating(false);
    toast.success(`${cards.length} scout cards generated`);
  };

  const saveSet = useMutation({
    mutationFn: async () => {
      const data = {
        team_id: activeTeamId,
        title,
        template,
        source_type: sourceType,
        side_of_ball: sideFilter,
        cards: localCards,
        active: true,
      };
      if (activeSetId) {
        return base44.entities.ScoutCardSet.update(activeSetId, data);
      }
      return base44.entities.ScoutCardSet.create(data);
    },
    onSuccess: (result) => {
      setActiveSetId(result.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['scoutCardSets', activeTeamId] });
      toast.success('Scout card set saved');
    },
  });

  const loadSet = (set) => {
    setActiveSetId(set.id);
    setTitle(set.title);
    setTemplate(set.template || 'coach_card');
    setSourceType(set.source_type || 'play_library');
    setSideFilter(set.side_of_ball || 'offense');
    setLocalCards(set.cards || []);
    setIsDirty(false);
  };

  const removeCard = (card) => {
    setLocalCards(prev => prev.filter(c => c.play_id !== card.play_id));
    setIsDirty(true);
  };

  const updateCard = (playId, updates) => {
    setLocalCards(prev => prev.map(c => c.play_id === playId ? { ...c, ...updates } : c));
    setIsDirty(true);
  };

  const toggleSelect = (playId) => {
    setSelected(prev => prev.includes(playId) ? prev.filter(s => s !== playId) : [...prev, playId]);
  };

  const addPlayAsCard = (play) => {
    if (localCards.find(c => c.play_id === play.id)) {
      toast.info('Already in card set');
      return;
    }
    setLocalCards(prev => [...prev, {
      play_id: play.id,
      include_in_print: true,
      order_index: prev.length,
      card_note: '',
      scout_look_label: '',
    }]);
    setIsDirty(true);
  };

  if (showPrint) {
    return (
      <ScoutCardPrintView
        cards={localCards}
        playMap={playMap}
        practicedMap={practicedMap}
        template={template}
        title={title}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-2 -ml-2"
              />
            </div>
            {isDirty && (
              <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 ml-7 mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Unsaved changes
              </span>
            )}
          </div>

          {/* Side toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {['offense', 'defense', 'special_teams'].map(s => (
              <button key={s} onClick={() => setSideFilter(s === sideFilter ? '' : s)}
                className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize",
                  sideFilter === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                {s === 'special_teams' ? 'ST' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={autoGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Auto Generate
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden sm:flex"
              onClick={() => setShowPrint(true)}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              onClick={() => saveSet.mutate()} disabled={saveSet.isPending}>
              {saveSet.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Set
            </Button>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger className="h-7 text-xs w-44 bg-secondary/50 border-0">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50 border-0">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {sets.length > 0 && (
            <Select onValueChange={(id) => loadSet(sets.find(s => s.id === id))}>
              <SelectTrigger className="h-7 text-xs w-44 bg-secondary/50 border-0">
                <SelectValue placeholder="Load saved set…" />
              </SelectTrigger>
              <SelectContent>
                {sets.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            {localCards.length} card{localCards.length !== 1 ? 's' : ''}
            {selected.length > 0 && ` · ${selected.length} selected`}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Play source list */}
        <div className="w-56 xl:w-64 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Play Library</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…" className="pl-7 h-7 text-xs bg-secondary/50 border-0" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {playsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredPlays.map(play => {
              const onSheet = localCards.some(c => c.play_id === play.id);
              const practiced = practicedMap[play.id];
              return (
                <button key={play.id} onClick={() => addPlayAsCard(play)}
                  className={cn("w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-secondary/30 transition-colors",
                    onSheet && "opacity-50 cursor-not-allowed")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{play.play_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {play.short_name && <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>}
                      {practiced ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-500/70" />
                      )}
                    </div>
                  </div>
                  {onSheet ? <Badge variant="secondary" className="text-[9px] shrink-0">Added</Badge>
                    : <Plus className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main card grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {localCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
              <Shield className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold">No scout cards yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Auto Generate from your play library, or click individual plays to add them.
              </p>
              <Button size="sm" className="gap-1.5 mt-4 rounded-xl" onClick={autoGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Auto Generate
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-3",
              template === 'compact_grid'
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {localCards.map(card => (
                <ScoutCard
                  key={card.play_id}
                  card={card}
                  play={playMap[card.play_id]}
                  practicedDays={practicedMap[card.play_id]}
                  isSelected={selected.includes(card.play_id)}
                  onSelect={() => toggleSelect(card.play_id)}
                  onOpen={setDetailCard}
                  onRemove={removeCard}
                  template={template}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {detailCard && (
          <ScoutCardDetail
            card={detailCard}
            play={playMap[detailCard.play_id]}
            practicedDays={practicedMap[detailCard.play_id]}
            onClose={() => setDetailCard(null)}
            onUpdate={(updates) => {
              updateCard(detailCard.play_id, updates);
              setDetailCard(c => ({ ...c, ...updates }));
            }}
          />
        )}
      </div>
    </div>
  );
}