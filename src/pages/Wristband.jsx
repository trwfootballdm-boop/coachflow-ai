import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rows3, Plus, Save, Printer, Sparkles, Trash2, Search,
  AlertTriangle, CheckCircle2, ChevronRight, Loader2, X,
  Copy, RefreshCw, LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WristbandSection from '@/components/wristband/WristbandPanel';
import WristbandPrintView from '@/components/wristband/WristbandPrintView';

// ─── Default section templates ────────────────────────────────────────────────
const DEFAULT_SECTIONS_OFFENSE = [
  { id: 'openers',     label: 'Openers',       plays: [] },
  { id: 'base_run',    label: 'Base Runs',      plays: [] },
  { id: 'base_pass',   label: 'Base Passes',    plays: [] },
  { id: 'third_short', label: '3rd & Short',    plays: [] },
  { id: 'red_zone',    label: 'Red Zone',       plays: [] },
  { id: 'two_point',   label: '2-Pt Plays',     plays: [] },
  { id: 'shot_plays',  label: 'Shot Plays',     plays: [] },
  { id: 'specials',    label: 'Specials',        plays: [] },
];

const DEFAULT_SECTIONS_DEFENSE = [
  { id: 'def_base',     label: 'Base D',          plays: [] },
  { id: 'def_pressure', label: 'Pressure',        plays: [] },
  { id: 'def_red_zone', label: 'Def Red Zone',    plays: [] },
  { id: 'def_goal_line','label': 'Goal Line D',   plays: [] },
];

const DEFAULT_SECTIONS_ST = [
  { id: 'st_kickoff', label: 'Kickoff',     plays: [] },
  { id: 'st_punt',    label: 'Punt',        plays: [] },
  { id: 'st_fg',      label: 'FG / PAT',    plays: [] },
];

const TEMPLATES = {
  standard: 'Standard (10–40 plays)',
  condensed: 'Condensed (≤20 plays)',
  two_col: '2-Column Layout',
  youth: 'Youth Simplified',
};

const CODE_STYLES = [
  { value: 'number', label: 'Numbers (1, 2, 3…)' },
  { value: 'alpha', label: 'Alpha (A, B, C…)' },
  { value: 'short_code', label: 'Short Codes (IZL, PA…)' },
  { value: 'short_only', label: 'Short Name Only' },
];

function getDefaultSections(side) {
  if (side === 'defense') return DEFAULT_SECTIONS_DEFENSE;
  if (side === 'special_teams') return DEFAULT_SECTIONS_ST;
  return DEFAULT_SECTIONS_OFFENSE;
}

// ─── Play source sidebar ──────────────────────────────────────────────────────
function PlaySourcePanel({ plays, playsLoading, sections, sideFilter, onAddPlay, practicedMap }) {
  const [search, setSearch] = useState('');
  const allOnWristband = new Set(sections.flatMap(s => s.plays.map(e => e.play_id)));

  const filtered = useMemo(() => plays.filter(p => {
    const side = p.side || p.side_of_ball;
    if (sideFilter && side !== sideFilter) return false;
    if (!search) return true;
    return [p.name, p.play_name, p.short_name, p.concept, p.play_family]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
  }), [plays, sideFilter, search]);

  return (
    <div className="w-56 xl:w-64 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          Play Library
        </p>
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
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground px-3">
            No plays match filters
          </div>
        ) : filtered.map(play => {
          const onSheet = allOnWristband.has(play.id);
          const practiced = practicedMap[play.id];
          return (
            <button key={play.id} onClick={() => !onSheet && onAddPlay(play)}
              disabled={onSheet}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                onSheet ? "opacity-35 cursor-not-allowed" : "hover:bg-secondary/40"
              )}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{play.short_name || play.name || play.play_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {(play.name || play.play_name) && play.short_name && (
                    <span className="text-[9px] text-muted-foreground truncate">{play.name || play.play_name}</span>
                  )}
                  {practiced
                    ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="h-2.5 w-2.5 text-amber-400/60 shrink-0" />}
                </div>
              </div>
              {onSheet
                ? <span className="text-[9px] text-primary font-bold shrink-0">✓</span>
                : <Plus className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add section dialog ───────────────────────────────────────────────────────
function AddSectionRow({ onAdd }) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
        <Plus className="h-3.5 w-3.5" /> Add section
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); setShow(false); }
          if (e.key === 'Escape') setShow(false);
        }}
        placeholder="Section label…"
        className="h-7 text-xs flex-1"
      />
      <Button size="sm" className="h-7 text-xs px-2"
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); setShow(false); } }}>
        Add
      </Button>
      <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ─── Wristband preview card ───────────────────────────────────────────────────
function WristbandPreviewCard({ sections, playMap, title, sideOfBall, codeStyle }) {
  const sideLabel = sideOfBall === 'special_teams' ? 'ST' : (sideOfBall || 'OFF').slice(0, 3).toUpperCase();
  const totalPlays = sections.reduce((a, s) => a + s.plays.filter(e => playMap[e.play_id]).length, 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="bg-gray-900 text-white px-3 py-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{title || 'Wristband Insert'}</p>
          <p className="text-[10px] text-gray-400 font-mono">{totalPlays} plays</p>
        </div>
        <Badge variant="secondary" className="text-[9px] font-bold">{sideLabel}</Badge>
      </div>
      <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
        {sections.map(section => {
          const plays = section.plays.filter(e => playMap[e.play_id]);
          if (plays.length === 0) return null;
          return (
            <div key={section.id}>
              <div className="bg-secondary/60 px-2 py-0.5 rounded mb-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{section.label}</p>
              </div>
              {plays.map((entry, i) => {
                const play = playMap[entry.play_id];
                const code = entry.code || (
                  codeStyle === 'number' ? String(i + 1).padStart(2, '0') :
                  codeStyle === 'alpha' ? String.fromCharCode(65 + i) :
                  play?.short_name?.slice(0, 4).toUpperCase() || String(i + 1)
                );
                return (
                  <div key={entry.play_id} className="flex items-baseline gap-2 px-2 py-0.5">
                    <span className="text-[10px] font-mono font-black text-foreground shrink-0 w-8 tabular-nums">{code}</span>
                    <span className="text-[10px] font-medium text-foreground truncate">
                      {play?.short_name || play?.name || play?.play_name}
                    </span>
                    {play?.run_pass && (
                      <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                        {play.run_pass === 'run' ? 'R' : play.run_pass === 'pass' ? 'P' : 'S'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Wristband() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [activeSetId, setActiveSetId] = useState(null);
  const [title, setTitle] = useState('Game Day Wristband');
  const [sideOfBall, setSideOfBall] = useState('offense');
  const [template, setTemplate] = useState('standard');
  const [codeStyle, setCodeStyle] = useState('number');
  const [sections, setSections] = useState(getDefaultSections('offense'));
  const [isDirty, setIsDirty] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [pickerSection, setPickerSection] = useState(null); // section id to add play to

  // ── Data ──
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });
  const activeTeam = teams.find(t => t.id === activeTeamId);

  const { data: plays = [], isLoading: playsLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'name'),
    enabled: !!activeTeamId,
  });

  const { data: gamePlans = [] } = useQuery({
    queryKey: ['gamePlans', activeTeamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const { data: wristbandSets = [] } = useQuery({
    queryKey: ['wristbands', activeTeamId],
    queryFn: () => base44.entities.Wristband.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const { data: scriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', activeTeamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-script_date', 5);
      if (!scripts.length) return [];
      const all = await Promise.all(scripts.map(s => base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id })));
      return all.flat();
    },
    enabled: !!activeTeamId,
  });

  const practicedMap = useMemo(() => {
    const m = {};
    scriptItems.forEach(i => { if (i.play_id) m[i.play_id] = true; });
    return m;
  }, [scriptItems]);

  const playMap = useMemo(() => {
    const m = {};
    plays.forEach(p => { m[p.id] = p; });
    return m;
  }, [plays]);

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        team_id: activeTeamId,
        title,
        sections: sections.map(s => ({ label: s.label, play_ids: s.plays.map(e => e.play_id) })),
        columns: 4,
        notes: JSON.stringify({ codeStyle, template, sideOfBall, sections_full: sections }),
      };
      if (activeSetId) return base44.entities.Wristband.update(activeSetId, data);
      return base44.entities.Wristband.create(data);
    },
    onSuccess: (result) => {
      setActiveSetId(result.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['wristbands', activeTeamId] });
      toast.success('Wristband set saved');
    },
  });

  // ── Helpers ──
  const markDirty = () => setIsDirty(true);

  const loadSet = (set) => {
    setActiveSetId(set.id);
    setTitle(set.title);
    try {
      const meta = JSON.parse(set.notes || '{}');
      setSideOfBall(meta.sideOfBall || 'offense');
      setTemplate(meta.template || 'standard');
      setCodeStyle(meta.codeStyle || 'number');
      setSections(meta.sections_full || getDefaultSections(meta.sideOfBall || 'offense'));
    } catch {
      setSections(getDefaultSections('offense'));
    }
    setIsDirty(false);
    toast.success(`Loaded: ${set.title}`);
  };

  const handleSideChange = (side) => {
    setSideOfBall(side);
    setSections(getDefaultSections(side));
    markDirty();
  };

  // Auto-populate from most recent game plan call sheet
  const autoPopulate = () => {
    if (!gamePlans.length) { toast.error('No game plans found'); return; }
    const plan = gamePlans[0];
    const callSheet = plan.call_sheet || {};
    const newSections = getDefaultSections(sideOfBall).map(section => {
      const entries = (callSheet[section.id] || []).map((e, i) => ({
        play_id: e.play_id,
        code: String(i + 1).padStart(2, '0'),
      })).filter(e => e.play_id && playMap[e.play_id]);
      return { ...section, plays: entries };
    });
    setSections(newSections);
    markDirty();
    toast.success(`Populated from: ${plan.title}`);
  };

  const addSection = (label) => {
    const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setSections(prev => [...prev, { id, label, plays: [] }]);
    markDirty();
  };

  const updateSection = (updated) => {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    markDirty();
  };

  const removeSection = (sectionId) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    markDirty();
  };

  const addPlayToSection = useCallback((sectionId, play) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      if (s.plays.find(e => e.play_id === play.id)) return s;
      const newIdx = s.plays.length + 1;
      const code = codeStyle === 'number' ? String(newIdx).padStart(2, '0')
        : codeStyle === 'alpha' ? String.fromCharCode(64 + newIdx)
        : play.short_name?.slice(0, 4).toUpperCase() || String(newIdx);
      return { ...s, plays: [...s.plays, { play_id: play.id, code }] };
    }));
    markDirty();
  }, [codeStyle]);

  // Add a play from sidebar: if pickerSection is set, add there; else add to first section
  const handleSidebarAdd = (play) => {
    const target = pickerSection || sections[0]?.id;
    if (!target) { toast.error('No section to add to'); return; }
    addPlayToSection(target, play);
  };

  const removePlayFromSection = (sectionId, playId) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, plays: s.plays.filter(e => e.play_id !== playId) } : s
    ));
    markDirty();
  };

  const updateEntry = (sectionId, updated) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, plays: s.plays.map(e => e.play_id === updated.play_id ? updated : e) }
        : s
    ));
    markDirty();
  };

  const clearAll = () => {
    setSections(getDefaultSections(sideOfBall));
    markDirty();
  };

  const totalPlays = sections.reduce((a, s) => a + s.plays.length, 0);
  const totalCoded = sections.reduce((a, s) => a + s.plays.filter(e => e.code).length, 0);

  // ── Print mode ──
  if (showPrint) {
    return (
      <WristbandPrintView
        title={title}
        teamName={activeTeam?.team_name}
        opponentName=""
        sideOfBall={sideOfBall}
        sections={sections}
        playMap={playMap}
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
              <Rows3 className="h-4 w-4 text-primary shrink-0" />
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); markDirty(); }}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-1.5 -ml-1.5"
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5 ml-6">
              {activeTeam && <span className="text-[10px] text-muted-foreground">{activeTeam.team_name}</span>}
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">{totalPlays} plays</span>
              {totalCoded > 0 && <span className="text-[10px] text-primary">{totalCoded} coded</span>}
              {isDirty && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                  <AlertTriangle className="h-3 w-3" /> Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Side toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {[['offense', 'OFF'], ['defense', 'DEF'], ['special_teams', 'ST']].map(([s, l]) => (
              <button key={s} onClick={() => handleSideChange(s)}
                className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  sideOfBall === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={autoPopulate}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">From Call Sheet</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => setShowPrint(true)} disabled={totalPlays === 0}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !isDirty}>
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Template */}
          <Select value={template} onValueChange={v => { setTemplate(v); markDirty(); }}>
            <SelectTrigger className="h-7 text-xs w-44 bg-secondary/50 border-0">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Code style */}
          <Select value={codeStyle} onValueChange={v => { setCodeStyle(v); markDirty(); }}>
            <SelectTrigger className="h-7 text-xs w-44 bg-secondary/50 border-0">
              <SelectValue placeholder="Code Style" />
            </SelectTrigger>
            <SelectContent>
              {CODE_STYLES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Load saved */}
          {wristbandSets.length > 0 && (
            <Select onValueChange={(id) => loadSet(wristbandSets.find(s => s.id === id))}>
              <SelectTrigger className="h-7 text-xs w-44 bg-secondary/50 border-0">
                <SelectValue placeholder="Load saved set…" />
              </SelectTrigger>
              <SelectContent>
                {wristbandSets.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <button onClick={clearAll}
            className="ml-auto text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Play source sidebar ── */}
        <PlaySourcePanel
          plays={plays}
          playsLoading={playsLoading}
          sections={sections}
          sideFilter={sideOfBall}
          practicedMap={practicedMap}
          onAddPlay={handleSidebarAdd}
        />

        {/* ── Section editor ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-w-0">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl">
              <Rows3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold">No sections yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Add sections to organize your wristband, or auto-populate from your call sheet.
              </p>
              <Button size="sm" className="gap-2 mt-5 rounded-xl" onClick={autoPopulate}>
                <RefreshCw className="h-4 w-4" /> From Call Sheet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map(section => (
                <div key={section.id} className="group">
                  <div className="relative">
                    <WristbandSection
                      section={section}
                      playMap={playMap}
                      codeStyle={codeStyle}
                      onUpdateSection={updateSection}
                      onAddPlay={(sectionId) => setPickerSection(sectionId)}
                      onRemovePlay={removePlayFromSection}
                      onUpdateEntry={updateEntry}
                    />
                    {/* Highlight selected section for sidebar adds */}
                    {pickerSection === section.id && (
                      <div className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-primary/40" />
                    )}
                    <button
                      onClick={() => removeSection(section.id)}
                      className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-1">
                <AddSectionRow onAdd={addSection} />
              </div>
            </div>
          )}

          {/* Active section indicator */}
          {pickerSection && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-primary text-primary-foreground rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl text-xs font-semibold">
              <ChevronRight className="h-3.5 w-3.5" />
              Click plays in sidebar to add to "{sections.find(s => s.id === pickerSection)?.label}"
              <button onClick={() => setPickerSection(null)} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* ── Preview panel ── */}
        <div className="hidden xl:flex w-60 shrink-0 border-l border-border bg-card/30 flex-col p-3 overflow-y-auto gap-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Insert Preview</p>
          <WristbandPreviewCard
            sections={sections}
            playMap={playMap}
            title={title}
            sideOfBall={sideOfBall}
            codeStyle={codeStyle}
          />
          <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
            <div className="flex justify-between">
              <span>Total plays</span>
              <span className="font-bold text-foreground">{totalPlays}</span>
            </div>
            <div className="flex justify-between">
              <span>With codes</span>
              <span className="font-bold text-foreground">{totalCoded}</span>
            </div>
            <div className="flex justify-between">
              <span>Sections</span>
              <span className="font-bold text-foreground">{sections.filter(s => s.plays.length > 0).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}