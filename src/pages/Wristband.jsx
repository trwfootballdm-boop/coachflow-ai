import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rows3, Sparkles, Save, Printer, Plus, X, Loader2,
  AlertTriangle, CheckCircle2, Copy, Trash2, ChevronDown,
  LayoutGrid, ArrowLeft, RefreshCw, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WristbandSectionEditor from '@/components/wristband/WristbandSectionEditor';
import WristbandPlayPicker from '@/components/wristband/WristbandPlayPicker';
import WristbandPrintView from '@/components/wristband/WristbandPrintView';

// ─── Call-sheet section keys that map to wristband sections ──────────────────
const CALL_SHEET_SECTIONS = [
  { key: 'openers',      name: 'Openers' },
  { key: 'base_run',     name: 'Base Runs' },
  { key: 'base_pass',    name: 'Base Passes' },
  { key: 'third_short',  name: '3rd & Short' },
  { key: 'third_medium', name: '3rd & Medium' },
  { key: 'third_long',   name: '3rd & Long' },
  { key: 'red_zone',     name: 'Red Zone' },
  { key: 'goal_line',    name: 'Goal Line' },
  { key: 'two_point',    name: '2-Point' },
  { key: 'shot_plays',   name: 'Shot Plays' },
  { key: 'two_minute',   name: '2-Minute' },
  { key: 'clock_kill',   name: 'Clock Kill' },
  { key: 'def_base',     name: 'Base Defense' },
  { key: 'def_pressure', name: 'Pressure' },
  { key: 'def_red_zone', name: 'Def Red Zone' },
  { key: 'st_kickoff',   name: 'Kickoff' },
  { key: 'st_punt',      name: 'Punt' },
  { key: 'st_fg',        name: 'FG / PAT' },
];

const TEMPLATES = [
  { value: 'standard',  label: 'Standard',      desc: '2-col sections, numbered codes' },
  { value: 'compact',   label: 'Compact',        desc: 'Dense 3-col, small text' },
  { value: 'youth',     label: 'Youth',          desc: 'Large text, simple names only' },
  { value: 'qb_only',   label: 'QB Wristband',   desc: 'Signal + formation + motion' },
  { value: 'scout',     label: 'Scout Look',     desc: 'For scout team use' },
];

const SIDE_LABELS = { offense: 'Offense', defense: 'Defense', special_teams: 'ST' };

// ─── Live wristband mini-preview (screen-side) ───────────────────────────────
function WristbandMiniPreview({ sections, playMap, sideOfBall, title }) {
  const sideColor = sideOfBall === 'defense' ? 'bg-red-900' :
    sideOfBall === 'special_teams' ? 'bg-yellow-800' : 'bg-emerald-900';

  const resolved = sections.map(s => ({
    ...s,
    entries: (s.entries || []).map(e => ({
      ...e,
      label: e.label || playMap[e.play_id]?.short_name || playMap[e.play_id]?.name || playMap[e.play_id]?.play_name || '?',
    })).filter(e => e.label && e.label !== '?'),
  })).filter(s => s.entries.length > 0);

  if (resolved.length === 0) return (
    <div className="flex items-center justify-center h-full text-muted-foreground/30 text-xs">
      Add plays to preview
    </div>
  );

  return (
    <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm text-left"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', minWidth: 220 }}>
      <div className={cn("px-2 py-1 flex items-center justify-between", sideColor)}>
        <span className="text-white font-bold text-[9px] uppercase tracking-wider truncate">{title || 'Wristband'}</span>
        <span className="text-white/50 text-[7px] uppercase">{SIDE_LABELS[sideOfBall]}</span>
      </div>
      {resolved.map((section, si) => (
        <div key={si} className="border-t border-gray-200 first:border-0">
          {section.label && (
            <div className="bg-gray-100 px-1.5 py-0.5">
              <span className="text-[7px] font-bold uppercase tracking-wider text-gray-600">{section.label}</span>
            </div>
          )}
          <div className={cn("grid px-1.5 py-0.5 gap-x-1 gap-y-0",
            section.columns === 3 ? "grid-cols-3" : section.columns === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {section.entries.map((e, ei) => (
              <div key={ei} className="flex items-baseline gap-0.5 min-w-0">
                {e.code && (
                  <span className="text-[8px] font-black text-gray-900 shrink-0 tabular-nums" style={{ minWidth: 14 }}>{e.code}</span>
                )}
                <span className="text-[8px] font-semibold text-gray-800 truncate leading-tight">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="border-t border-gray-100 px-1.5 py-0.5">
        <span className="text-[6px] text-gray-400">CoachFlow AI</span>
      </div>
    </div>
  );
}

// ─── Saved wristband card ─────────────────────────────────────────────────────
function WristbandCard({ wb, playMap, onLoad, onDelete }) {
  const totalPlays = (wb.sections || []).reduce((a, s) => a + (s.entries || []).length, 0);
  return (
    <button
      onClick={() => onLoad(wb)}
      className="group text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm truncate">{wb.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {wb.side_of_ball && (
              <Badge variant="secondary" className="text-[10px]">{SIDE_LABELS[wb.side_of_ball] || wb.side_of_ball}</Badge>
            )}
            {wb.columns && (
              <span className="text-[10px] text-muted-foreground">{wb.columns}-col</span>
            )}
            <span className="text-[10px] text-muted-foreground">{totalPlays} plays</span>
            <span className="text-[10px] text-muted-foreground">{(wb.sections || []).length} sections</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(wb.id); }}
          className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 text-xs text-primary font-medium">Open →</div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Wristband() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  // Active wristband state
  const [activeWbId, setActiveWbId] = useState(null);
  const [title, setTitle] = useState('Game Day Wristband');
  const [sideOfBall, setSideOfBall] = useState('offense');
  const [template, setTemplate] = useState('standard');
  const [sections, setSections] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTargetSection, setPickerTargetSection] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [gamePlanId, setGamePlanId] = useState('');

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: wristbands = [], isLoading: wbLoading } = useQuery({
    queryKey: ['wristbands', activeTeamId],
    queryFn: () => base44.entities.Wristband.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

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

  const { data: scriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', activeTeamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-script_date', 8);
      if (!scripts.length) return [];
      const nested = await Promise.all(scripts.map(s => base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id })));
      return nested.flat();
    },
    enabled: !!activeTeamId,
  });

  const playMap = useMemo(() => {
    const m = {};
    plays.forEach(p => { m[p.id] = p; });
    return m;
  }, [plays]);

  const practicedMap = useMemo(() => {
    const m = {};
    scriptItems.forEach(item => {
      if (item.play_id) m[item.play_id] = true;
    });
    return m;
  }, [scriptItems]);

  const team = useMemo(() => teams.find(t => t.id === activeTeamId), [teams, activeTeamId]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (asCopy = false) => {
      const data = {
        team_id: activeTeamId,
        title: asCopy ? `${title} (Copy)` : title,
        sections,
        columns: template === 'compact' ? 3 : 2,
        side_of_ball: sideOfBall,
        notes: template,
      };
      if (activeWbId && !asCopy) return base44.entities.Wristband.update(activeWbId, data);
      return base44.entities.Wristband.create(data);
    },
    onSuccess: (result, asCopy) => {
      if (!asCopy) setActiveWbId(result.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['wristbands', activeTeamId] });
      toast.success(asCopy ? 'Saved as copy' : 'Wristband saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Wristband.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wristbands', activeTeamId] });
      toast.success('Deleted');
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateSections = useCallback((newSections) => {
    setSections(newSections);
    setIsDirty(true);
  }, []);

  const loadWristband = (wb) => {
    setActiveWbId(wb.id);
    setTitle(wb.title || 'Wristband');
    setSections(wb.sections || []);
    setSideOfBall(wb.side_of_ball || 'offense');
    setTemplate(wb.notes || 'standard');
    setIsDirty(false);
  };

  const startNew = () => {
    setActiveWbId(null);
    setTitle('Game Day Wristband');
    setSections([]);
    setSideOfBall('offense');
    setTemplate('standard');
    setIsDirty(false);
  };

  // Auto-populate from game plan call sheet
  const autoPopulateFromCallSheet = () => {
    const plan = gamePlans.find(p => p.id === gamePlanId) || gamePlans[0];
    if (!plan?.call_sheet) {
      toast.error('No game plan call sheet found');
      return;
    }
    const side = sideOfBall;
    // Filter CALL_SHEET_SECTIONS by side
    const relevantKeys = CALL_SHEET_SECTIONS.filter(cs => {
      if (side === 'offense') return !cs.key.startsWith('def_') && !cs.key.startsWith('st_');
      if (side === 'defense') return cs.key.startsWith('def_');
      return cs.key.startsWith('st_');
    });

    let codeCounter = 1;
    const newSections = [];
    relevantKeys.forEach(cs => {
      const entries = plan.call_sheet[cs.key];
      if (!entries || entries.length === 0) return;
      const sectionEntries = entries.map(e => {
        const play = playMap[e.play_id];
        return {
          play_id: e.play_id,
          code: String(codeCounter++),
          label: play?.short_name || play?.name || play?.play_name || '',
          note: '',
        };
      });
      newSections.push({ label: cs.name, columns: 2, entries: sectionEntries });
    });

    if (newSections.length === 0) {
      toast.error('No plays found in call sheet for this side of ball');
      return;
    }
    setSections(newSections);
    setIsDirty(true);
    toast.success(`${newSections.reduce((a, s) => a + s.entries.length, 0)} plays populated from call sheet`);
  };

  // Add play from picker
  const addPlayFromPicker = (play, sectionIdx = null) => {
    const code = String(sections.reduce((a, s) => a + (s.entries?.length || 0), 0) + 1);
    const entry = {
      play_id: play.id,
      code,
      label: play.short_name || play.name || play.play_name || '',
      note: '',
    };

    if (sectionIdx !== null && sections[sectionIdx]) {
      const updated = sections.map((s, i) =>
        i === sectionIdx ? { ...s, entries: [...(s.entries || []), entry] } : s
      );
      updateSections(updated);
    } else if (sections.length === 0) {
      updateSections([{ label: 'Main', columns: 2, entries: [entry] }]);
    } else {
      // Add to last section
      const updated = sections.map((s, i) =>
        i === sections.length - 1 ? { ...s, entries: [...(s.entries || []), entry] } : s
      );
      updateSections(updated);
    }
    toast.success(`${play.short_name || play.name || play.play_name} added`);
  };

  const usedPlayIds = useMemo(() => {
    const s = new Set();
    sections.forEach(sec => (sec.entries || []).forEach(e => { if (e.play_id) s.add(e.play_id); }));
    return s;
  }, [sections]);

  const totalPlays = sections.reduce((a, s) => a + (s.entries?.length || 0), 0);

  // ── Print view ────────────────────────────────────────────────────────────
  if (showPrint) {
    return (
      <WristbandPrintView
        wristband={{ title, sections, sideOfBall, template }}
        playMap={playMap}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  // ── Dashboard (no active wristband) ───────────────────────────────────────
  if (!activeWbId && sections.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Wristband Generator</h1>
            <p className="text-sm text-muted-foreground">
              Build coded play-call inserts from your call sheet
              {team ? ` · ${team.team_name}` : ''}
            </p>
          </div>
          <Button className="gap-2 rounded-xl" onClick={startNew}>
            <Plus className="h-4 w-4" /> New Wristband
          </Button>
        </div>

        {/* Saved sets */}
        {wbLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : wristbands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl text-center">
            <div className="p-4 rounded-2xl bg-accent/10 mb-4">
              <Rows3 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-1">No wristbands yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create your first wristband insert by pulling plays from your call sheet or play library.
            </p>
            <Button className="gap-2 mt-5 rounded-xl" onClick={startNew}>
              <Sparkles className="h-4 w-4" /> Create Wristband
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wristbands.map(wb => (
              <WristbandCard
                key={wb.id}
                wb={wb}
                playMap={playMap}
                onLoad={loadWristband}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
            <button
              onClick={startNew}
              className="border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 p-4 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all min-h-[100px] text-sm"
            >
              <Plus className="h-4 w-4" /> New Wristband
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => { if (!isDirty || confirm('Discard unsaved changes?')) startNew(); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Rows3 className="h-4 w-4 text-accent shrink-0" />
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-1.5 -ml-1.5"
              />
            </div>
            <div className="flex items-center gap-2 ml-6 mt-0.5 flex-wrap">
              {team && <span className="text-[10px] text-muted-foreground">{team.team_name}</span>}
              <span className="text-[10px] text-muted-foreground">{totalPlays} plays · {sections.length} sections</span>
              {isDirty && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Side toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {[['offense','OFF'],['defense','DEF'],['special_teams','ST']].map(([s, l]) => (
              <button key={s} onClick={() => { setSideOfBall(s); setIsDirty(true); }}
                className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  sideOfBall === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          {/* Template */}
          <Select value={template} onValueChange={v => { setTemplate(v); setIsDirty(true); }}>
            <SelectTrigger className="h-8 text-xs w-36 bg-secondary/50 border-0 shrink-0">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground ml-1 text-[10px] hidden sm:inline"> — {t.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={autoPopulateFromCallSheet} disabled={gamePlans.length === 0}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">From Call Sheet</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => setShowPicker(p => !p)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Play</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => setShowPrint(true)} disabled={totalPlays === 0}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Copy</span>
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending || !isDirty}>
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* Call sheet source selector */}
        {gamePlans.length > 0 && (
          <div className="flex items-center gap-2 mt-2 ml-10">
            <span className="text-[10px] text-muted-foreground">Game plan:</span>
            <Select value={gamePlanId} onValueChange={setGamePlanId}>
              <SelectTrigger className="h-6 text-[10px] w-48 bg-secondary/50 border-0">
                <SelectValue placeholder="Select game plan…" />
              </SelectTrigger>
              <SelectContent>
                {gamePlans.map(gp => (
                  <SelectItem key={gp.id} value={gp.id}>{gp.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sections.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all sections?')) { setSections([]); setIsDirty(true); } }}
                className="text-[10px] text-destructive hover:underline"
              >
                Clear layout
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Play picker (collapsible) ── */}
        {showPicker && (
          <div className="w-52 xl:w-60 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
            <WristbandPlayPicker
              plays={plays}
              usedPlayIds={usedPlayIds}
              practicedMap={practicedMap}
              sideFilter={sideOfBall}
              onAdd={(play) => addPlayFromPicker(play, pickerTargetSection)}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}

        {/* ── Main: Section editor ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-w-0">
          {/* Empty state */}
          {sections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-2xl">
              <Rows3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold">No sections yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Auto-populate from your call sheet, or add plays manually from the play library.
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <Button size="sm" className="gap-2 rounded-xl" onClick={autoPopulateFromCallSheet}
                  disabled={gamePlans.length === 0}>
                  <RefreshCw className="h-4 w-4" /> From Call Sheet
                </Button>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl"
                  onClick={() => setShowPicker(true)}>
                  <Plus className="h-4 w-4" /> Add Plays
                </Button>
              </div>
              {gamePlans.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-3">
                  No game plans found. Create one in Game Planning first.
                </p>
              )}
            </div>
          )}

          {sections.length > 0 && (
            <>
              {/* Renumber codes button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{totalPlays} total entries across {sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => {
                    let counter = 1;
                    const renumbered = sections.map(s => ({
                      ...s,
                      entries: (s.entries || []).map(e => ({ ...e, code: String(counter++) })),
                    }));
                    updateSections(renumbered);
                    toast.success('Codes renumbered');
                  }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Renumber codes
                </button>
              </div>

              <WristbandSectionEditor
                sections={sections}
                playMap={playMap}
                onChange={updateSections}
              />
            </>
          )}
        </div>

        {/* ── Right: Live mini-preview ── */}
        <div className="hidden xl:flex w-56 shrink-0 border-l border-border bg-card/30 flex-col p-3 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Live Preview</p>
          <WristbandMiniPreview
            sections={sections}
            playMap={playMap}
            sideOfBall={sideOfBall}
            title={title}
          />
          {totalPlays > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 gap-1.5 text-xs w-full"
              onClick={() => setShowPrint(true)}
            >
              <Printer className="h-3.5 w-3.5" /> Open Print View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}