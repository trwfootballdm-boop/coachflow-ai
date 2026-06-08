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
  CheckCircle2, AlertTriangle, BookOpen, ChevronDown, LayoutGrid,
  List, Tag, EyeOff, Users, GraduationCap
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ScoutCardDetail from '@/components/scout-cards/ScoutCardDetail';
import ScoutCardPrintView from '@/components/scout-cards/ScoutCardPrintView';

const TEMPLATES = [
  { value: 'coach_card',    label: 'Coach',     icon: '📋' },
  { value: 'youth_player',  label: 'Youth',     icon: '🏈' },
  { value: 'compact_grid',  label: 'Compact',   icon: '⊞'  },
  { value: 'teaching_card', label: 'Teaching',  icon: '📖' },
  { value: 'defense_scout', label: 'Defense',   icon: '🛡️' },
  { value: 'special_teams', label: 'ST',        icon: '⚡' },
];

const SOURCE_LABELS = {
  practice_script: { label: 'Practice Script', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  game_plan:       { label: 'Game Plan',        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  play_library:    { label: 'Play Library',     color: 'bg-secondary text-muted-foreground' },
  manual:          { label: 'Manual',           color: 'bg-secondary text-muted-foreground' },
};

// ─── Individual card tile ─────────────────────────────────────────────────────
function ScoutCardTile({ card, play, practicedDays, isSelected, index, onSelect, onOpen, onRemove, template }) {
  if (!play) return null;
  const compact = template === 'compact_grid';

  return (
    <div
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-all cursor-pointer group relative",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border hover:border-primary/30 hover:shadow-sm"
      )}
      onClick={() => onOpen(card)}
    >
      {/* Card number badge */}
      <div className="absolute top-2 left-2 z-10 h-5 w-5 rounded-full bg-gray-800/70 flex items-center justify-center">
        <span className="text-[9px] font-bold text-white">{index + 1}</span>
      </div>

      {/* Select checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onSelect(); }}
        className="absolute top-2 right-2 z-10 h-6 w-6 bg-card/80 border border-border rounded flex items-center justify-center hover:bg-secondary transition-colors"
      >
        {isSelected
          ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
          : <Square className="h-3.5 w-3.5 text-muted-foreground/50" />}
      </button>

      {/* Diagram area */}
      <div className={cn(
        "relative bg-gradient-to-b from-emerald-950/20 to-emerald-900/10 border-b border-border/50 flex items-center justify-center",
        compact ? "h-20" : "h-28"
      )}>
        {/* Field lines */}
        <div className="absolute inset-0 opacity-10">
          {[25, 50, 75].map(pct => (
            <div key={pct} className="absolute top-0 bottom-0 border-l border-emerald-400/60" style={{ left: `${pct}%` }} />
          ))}
          <div className="absolute left-0 right-0 border-t border-emerald-400/40" style={{ top: '50%' }} />
        </div>
        <PenTool className={cn("text-emerald-700/25", compact ? "h-6 w-6" : "h-9 w-9")} />

        {/* Practice pill */}
        <div className="absolute bottom-1.5 left-8">
          {practicedDays && practicedDays.length > 0 ? (
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" />
              {practicedDays.map(d => d.slice(0, 3).toUpperCase()).join('·')}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> NR
            </span>
          )}
        </div>

        {/* Scout look label */}
        {card.scout_look_label && (
          <div className="absolute bottom-1.5 right-2">
            <span className="text-[9px] text-muted-foreground/70 bg-card/70 px-1 py-0.5 rounded truncate max-w-[80px] block">
              {card.scout_look_label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn("space-y-1", compact ? "p-2" : "p-3")}>
        <div className="flex items-start justify-between gap-1 min-w-0">
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold leading-tight truncate", compact ? "text-xs" : "text-sm")}>
              {play.name || play.play_name}
            </p>
            {play.short_name && !compact && (
              <code className="text-[10px] text-primary/80 font-mono">{play.short_name}</code>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onRemove(card); }}
            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {!compact && (
          <div className="flex items-center gap-1 flex-wrap">
            {play.concept && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{play.concept}</Badge>
            )}
            {play.play_family && (
              <span className="text-[9px] text-muted-foreground">{play.play_family}</span>
            )}
            {play.run_pass && (
              <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-sm",
                play.run_pass === 'run' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                play.run_pass === 'pass' ? "bg-sky-500/10 text-sky-700 dark:text-sky-400" :
                "bg-secondary text-muted-foreground"
              )}>
                {play.run_pass?.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {!compact && card.card_note && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-1">"{card.card_note}"</p>
        )}

        {template === 'coach_card' && !compact && play.coaching_points && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 border-t border-border/50 pt-1 mt-1">
            {play.coaching_points}
          </p>
        )}

        {template === 'youth_player' && !compact && play.notes && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 border-t border-border/50 pt-1 mt-1">
            {play.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Batch action bar ─────────────────────────────────────────────────────────
function BatchBar({ selected, total, onSelectAll, onClearAll, onRemoveSelected, onTogglePrint }) {
  if (selected.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xl border border-white/10">
      <span className="text-xs font-medium">{selected.length} selected</span>
      <div className="h-4 w-px bg-white/20" />
      <button onClick={onSelectAll} className="text-xs text-gray-300 hover:text-white transition-colors">All ({total})</button>
      <button onClick={onClearAll} className="text-xs text-gray-300 hover:text-white transition-colors">None</button>
      <div className="h-4 w-px bg-white/20" />
      <button onClick={onTogglePrint} className="text-xs flex items-center gap-1 text-blue-300 hover:text-blue-100 transition-colors">
        <Eye className="h-3.5 w-3.5" /> Toggle Print
      </button>
      <button onClick={onRemoveSelected} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-200 transition-colors">
        <Trash2 className="h-3.5 w-3.5" /> Remove
      </button>
      <button onClick={onClearAll} className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors ml-1">
        <X className="h-3.5 w-3.5 text-gray-400" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

  const { data: sets = [] } = useQuery({
    queryKey: ['scoutCardSets', activeTeamId],
    queryFn: () => base44.entities.ScoutCardSet.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const { data: plays = [], isLoading: playsLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'name'),
    enabled: !!activeTeamId,
  });

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
      const matchSide = !sideFilter || p.side === sideFilter || p.side_of_ball === sideFilter;
      const matchSearch = !search || [p.name, p.play_name, p.short_name, p.concept, p.play_family]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
      return matchSide && matchSearch;
    });
  }, [plays, sideFilter, search]);

  const autoGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 600));
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
      if (activeSetId) return base44.entities.ScoutCardSet.update(activeSetId, data);
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
    setSelected([]);
    setIsDirty(false);
  };

  const removeCard = (card) => {
    setLocalCards(prev => prev.filter(c => c.play_id !== card.play_id));
    setSelected(prev => prev.filter(id => id !== card.play_id));
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
    toast.success(`${play.name || play.play_name} added`);
  };

  const removeSelected = () => {
    setLocalCards(prev => prev.filter(c => !selected.includes(c.play_id)));
    setIsDirty(true);
    toast.success(`${selected.length} card${selected.length !== 1 ? 's' : ''} removed`);
    setSelected([]);
  };

  const togglePrintSelected = () => {
    setLocalCards(prev => prev.map(c =>
      selected.includes(c.play_id) ? { ...c, include_in_print: !(c.include_in_print ?? true) } : c
    ));
    setIsDirty(true);
  };

  const srcInfo = SOURCE_LABELS[sourceType] || SOURCE_LABELS.play_library;
  const printCount = localCards.filter(c => c.include_in_print !== false).length;
  const isCompact = template === 'compact_grid';

  if (showPrint) {
    return (
      <ScoutCardPrintView
        cards={localCards}
        playMap={playMap}
        practicedMap={practicedMap}
        template={template}
        title={title}
        sourceType={sourceType}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-1.5 -ml-1.5"
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5 ml-6">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-sm", srcInfo.color)}>
                {srcInfo.label}
              </span>
              {isDirty && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Side filter */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {[['offense', 'OFF'], ['defense', 'DEF'], ['special_teams', 'ST']].map(([s, l]) => (
              <button key={s} onClick={() => setSideFilter(s === sideFilter ? '' : s)}
                className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  sideFilter === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={autoGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => setShowPrint(true)} disabled={localCards.length === 0}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print ({printCount})</span>
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              onClick={() => saveSet.mutate()} disabled={saveSet.isPending || !isDirty}>
              {saveSet.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Source type */}
          <Select value={sourceType} onValueChange={v => { setSourceType(v); setIsDirty(true); }}>
            <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50 border-0">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_LABELS).map(([v, { label }]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Template pill switcher */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
            {TEMPLATES.map(t => (
              <button key={t.value} onClick={() => setTemplate(t.value)}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap",
                  template === t.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                title={t.label}
              >
                {t.icon} <span className="hidden xl:inline ml-0.5">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Saved sets */}
          {sets.length > 0 && (
            <Select onValueChange={(id) => loadSet(sets.find(s => s.id === id))}>
              <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50 border-0">
                <SelectValue placeholder="Load saved…" />
              </SelectTrigger>
              <SelectContent>
                {sets.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{localCards.length} card{localCards.length !== 1 ? 's' : ''}</span>
            {printCount !== localCards.length && (
              <span className="text-primary">{printCount} printing</span>
            )}
            {selected.length > 0 && (
              <span className="font-medium text-foreground">{selected.length} selected</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Play source sidebar ── */}
        <div className="w-52 xl:w-60 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Play Library</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search plays…" className="pl-7 h-7 text-xs bg-secondary/50 border-0" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {playsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredPlays.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground px-3">
                No plays match your filters
              </div>
            ) : filteredPlays.map(play => {
              const onSheet = localCards.some(c => c.play_id === play.id);
              const practiced = practicedMap[play.id];
              return (
                <button key={play.id} onClick={() => !onSheet && addPlayAsCard(play)}
                  disabled={onSheet}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                    onSheet ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary/40"
                  )}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{play.name || play.play_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {play.short_name && (
                        <code className="text-[9px] text-muted-foreground font-mono">{play.short_name}</code>
                      )}
                      {practiced ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-400/70" />
                      )}
                    </div>
                  </div>
                  {onSheet
                    ? <span className="text-[9px] text-primary/70 font-bold shrink-0">✓</span>
                    : <Plus className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main card grid ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-20">
          {localCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl">
              <Shield className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold text-foreground">No scout cards yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Auto-generate from your filtered plays, or click any play in the sidebar to add it.
              </p>
              <Button size="sm" className="gap-2 mt-5 rounded-xl" onClick={autoGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Auto Generate
              </Button>
            </div>
          ) : (
            <>
              {/* Select all / none strip */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => selected.length === localCards.length
                    ? setSelected([])
                    : setSelected(localCards.map(c => c.play_id))}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {selected.length === localCards.length
                    ? <><CheckSquare className="h-3 w-3" /> Deselect all</>
                    : <><Square className="h-3 w-3" /> Select all</>}
                </button>
                {localCards.some(c => c.include_in_print === false) && (
                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    {localCards.filter(c => c.include_in_print === false).length} excluded from print
                  </span>
                )}
              </div>

              <div className={cn(
                "grid gap-3",
                isCompact
                  ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {localCards.map((card, i) => (
                  <div
                    key={card.play_id}
                    className={cn(
                      "transition-opacity",
                      card.include_in_print === false && "opacity-40"
                    )}
                  >
                    <ScoutCardTile
                      card={card}
                      play={playMap[card.play_id]}
                      practicedDays={practicedMap[card.play_id]}
                      isSelected={selected.includes(card.play_id)}
                      index={i}
                      onSelect={() => toggleSelect(card.play_id)}
                      onOpen={setDetailCard}
                      onRemove={removeCard}
                      template={template}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Detail panel ── */}
        {detailCard && (
          <ScoutCardDetail
            card={detailCard}
            play={playMap[detailCard.play_id]}
            practicedDays={practicedMap[detailCard.play_id]}
            template={template}
            onClose={() => setDetailCard(null)}
            onUpdate={(updates) => {
              updateCard(detailCard.play_id, updates);
              setDetailCard(c => ({ ...c, ...updates }));
            }}
          />
        )}
      </div>

      {/* ── Batch action bar ── */}
      <BatchBar
        selected={selected}
        total={localCards.length}
        onSelectAll={() => setSelected(localCards.map(c => c.play_id))}
        onClearAll={() => setSelected([])}
        onRemoveSelected={removeSelected}
        onTogglePrint={togglePrintSelected}
      />
    </div>
  );
}