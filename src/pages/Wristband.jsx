import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rows3, Sparkles, Save, Printer, Plus, X, Loader2, AlertTriangle,
  Copy, ChevronDown, ChevronRight, LayoutGrid, List, Trash2,
  RefreshCw, Settings2, PenLine, GripVertical, Check, FileDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WristbandPanel from '@/components/wristband/WristbandPanel';
import WristbandPrintView from '@/components/wristband/WristbandPrintView';
import PlayPickerDrawer from '@/components/wristband/PlayPickerDrawer';

// Default section template
const DEFAULT_SECTIONS = [
  { label: 'OPENERS',   color: '#1e3a5f', plays: [] },
  { label: 'BASE RUN',  color: '#14532d', plays: [] },
  { label: 'BASE PASS', color: '#3b1f6e', plays: [] },
  { label: '3RD DOWN',  color: '#7c2d12', plays: [] },
  { label: 'RED ZONE',  color: '#991b1b', plays: [] },
  { label: 'SPECIALS',  color: '#374151', plays: [] },
];

const CALL_SHEET_SECTIONS = [
  ['openers', 'Openers'], ['base_run', 'Base Runs'], ['base_pass', 'Base Passes'],
  ['third_short', '3rd & Short'], ['third_medium', '3rd & Medium'], ['third_long', '3rd & Long'],
  ['red_zone', 'Red Zone'], ['goal_line', 'Goal Line'], ['shot_plays', 'Shot Plays'],
  ['specials', 'Specials'], ['two_minute', '2-Min'], ['backed_up', 'Backed Up'],
];

const TEMPLATES = [
  { value: 'standard',  label: 'Standard (4-col)' },
  { value: 'compact',   label: 'Compact (6-col)' },
  { value: 'large',     label: 'Large Print (3-col)' },
  { value: 'two_sided', label: 'Two-Sided' },
];

const CODE_STYLES = [
  { value: 'numeric',    label: 'Numeric (1, 2, 3…)' },
  { value: 'alpha',      label: 'Alpha (A, B, C…)' },
  { value: 'alphanumeric', label: 'Alpha-Num (A1, A2…)' },
  { value: 'custom',     label: 'Custom' },
];

function generateCode(style, sectionIdx, playIdx) {
  const alphas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (style === 'numeric') return String(playIdx + 1);
  if (style === 'alpha') return alphas[playIdx % alphas.length] || String(playIdx + 1);
  if (style === 'alphanumeric') {
    const sec = alphas[sectionIdx % alphas.length];
    return `${sec}${playIdx + 1}`;
  }
  return String(playIdx + 1);
}

export default function Wristband() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  // Wristband state
  const [wristbandId, setWristbandId] = useState(null);
  const [wristbandTitle, setWristbandTitle] = useState('Wristband – Week 1');
  const [opponentName, setOpponentName] = useState('');
  const [sideOfBall, setSideOfBall] = useState('offense');
  const [template, setTemplate] = useState('standard');
  const [codeStyle, setCodeStyle] = useState('alphanumeric');
  const [sections, setSections] = useState(DEFAULT_SECTIONS.map(s => ({ ...s, plays: [] })));
  const [isDirty, setIsDirty] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTargetSection, setPickerTargetSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null); // index
  const [columns, setColumns] = useState(4);

  // Queries
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
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

  const { data: savedWristbands = [] } = useQuery({
    queryKey: ['wristbands', activeTeamId],
    queryFn: () => base44.entities.Wristband.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const { data: termMappings = [] } = useQuery({
    queryKey: ['termMappings', activeTeamId],
    queryFn: () => base44.entities.TerminologyMapping.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const playMap = useMemo(() => Object.fromEntries(plays.map(p => [p.id, p])), [plays]);

  // Total play count across all sections
  const totalPlays = useMemo(() => sections.reduce((acc, s) => acc + s.plays.length, 0), [sections]);

  // Auto-populate from a game plan's call sheet
  const autoPopulateFromCallSheet = (gamePlan) => {
    const callSheet = gamePlan?.call_sheet || {};
    const newSections = CALL_SHEET_SECTIONS
      .filter(([key]) => callSheet[key] && callSheet[key].length > 0)
      .map(([key, label], i) => ({
        label: label.toUpperCase(),
        color: DEFAULT_SECTIONS[i % DEFAULT_SECTIONS.length]?.color || '#1e3a5f',
        plays: (callSheet[key] || []).map(entry => ({ play_id: entry.play_id, custom_code: '', note: '' })),
      }));

    setSections(newSections.length > 0 ? newSections : DEFAULT_SECTIONS.map(s => ({ ...s, plays: [] })));
    setOpponentName(gamePlan.opponent_name || '');
    setIsDirty(true);
    toast.success(`Auto-populated from "${gamePlan.title}"`);
  };

  // Section operations
  const addSection = () => {
    setSections(prev => [...prev, { label: 'NEW SECTION', color: '#374151', plays: [] }]);
    setIsDirty(true);
  };

  const updateSection = (idx, patch) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
    setIsDirty(true);
  };

  const removeSection = (idx) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const moveSectionUp = (idx) => {
    if (idx === 0) return;
    setSections(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
    setIsDirty(true);
  };

  // Play operations within sections
  const addPlayToSection = (sectionIdx, play) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      if (s.plays.find(p => p.play_id === play.id)) return s;
      return { ...s, plays: [...s.plays, { play_id: play.id, custom_code: '', note: '' }] };
    }));
    setIsDirty(true);
  };

  const removePlayFromSection = (sectionIdx, playId) => {
    setSections(prev => prev.map((s, i) =>
      i === sectionIdx ? { ...s, plays: s.plays.filter(p => p.play_id !== playId) } : s
    ));
    setIsDirty(true);
  };

  const updatePlayEntry = (sectionIdx, playId, patch) => {
    setSections(prev => prev.map((s, i) =>
      i === sectionIdx
        ? { ...s, plays: s.plays.map(p => p.play_id === playId ? { ...p, ...patch } : p) }
        : s
    ));
    setIsDirty(true);
  };

  const clearLayout = () => {
    setSections(DEFAULT_SECTIONS.map(s => ({ ...s, plays: [] })));
    setIsDirty(true);
    toast.info('Layout cleared');
  };

  // Save
  const saveMutation = useMutation({
    mutationFn: async (asCopy = false) => {
      const data = {
        team_id: activeTeamId,
        title: asCopy ? `${wristbandTitle} (Copy)` : wristbandTitle,
        sections: sections,
        columns,
        notes: opponentName ? `vs ${opponentName}` : '',
      };
      if (wristbandId && !asCopy) {
        return base44.entities.Wristband.update(wristbandId, data);
      }
      return base44.entities.Wristband.create(data);
    },
    onSuccess: (result) => {
      setWristbandId(result.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['wristbands', activeTeamId] });
      toast.success('Wristband set saved');
    },
  });

  const loadWristband = (wb) => {
    setWristbandId(wb.id);
    setWristbandTitle(wb.title || 'Wristband');
    setSections(wb.sections || DEFAULT_SECTIONS.map(s => ({ ...s, plays: [] })));
    setColumns(wb.columns || 4);
    setOpponentName(wb.notes?.replace('vs ', '') || '');
    setIsDirty(false);
  };

  if (showPrint) {
    return (
      <WristbandPrintView
        title={wristbandTitle}
        opponentName={opponentName}
        sideOfBall={sideOfBall}
        sections={sections}
        playMap={playMap}
        codeStyle={codeStyle}
        template={template}
        teamName={activeTeam?.team_name}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* ── TOP HEADER ── */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Title + context */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Rows3 className="h-4 w-4 text-accent shrink-0" />
              <Input
                value={wristbandTitle}
                onChange={e => { setWristbandTitle(e.target.value); setIsDirty(true); }}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-1.5 -ml-1.5 w-64"
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5 ml-6 flex-wrap">
              {activeTeam && <span className="text-[10px] text-muted-foreground font-medium">{activeTeam.team_name}</span>}
              {opponentName && <span className="text-[10px] text-muted-foreground">vs <span className="font-semibold text-foreground">{opponentName}</span></span>}
              <span className="text-[10px] text-muted-foreground capitalize">{sideOfBall}</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">{TEMPLATES.find(t => t.value === template)?.label}</Badge>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{totalPlays} plays</Badge>
              {isDirty && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Side of ball */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {[['offense', 'OFF'], ['defense', 'DEF'], ['special_teams', 'ST']].map(([s, l]) => (
              <button key={s} onClick={() => setSideOfBall(s)}
                className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  sideOfBall === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Auto populate from call sheet */}
            {gamePlans.length > 0 && (
              <Select onValueChange={(id) => {
                const gp = gamePlans.find(g => g.id === id);
                if (gp) autoPopulateFromCallSheet(gp);
              }}>
                <SelectTrigger className="h-8 text-xs w-44 gap-1.5 bg-secondary/60 border-0 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                  <SelectValue placeholder="Auto from Call Sheet" />
                </SelectTrigger>
                <SelectContent>
                  {gamePlans.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Load saved */}
            {savedWristbands.length > 0 && (
              <Select onValueChange={(id) => loadWristband(savedWristbands.find(w => w.id === id))}>
                <SelectTrigger className="h-8 text-xs w-36 bg-secondary/50 border-0">
                  <SelectValue placeholder="Load saved…" />
                </SelectTrigger>
                <SelectContent>
                  {savedWristbands.map(w => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => saveMutation.mutate(true)}>
              <Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copy</span>
            </Button>

            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowPrint(true)} disabled={totalPlays === 0}>
              <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Print</span>
            </Button>

            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending || !isDirty}>
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* ── Settings row ── */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Opponent</span>
            <Input value={opponentName} onChange={e => { setOpponentName(e.target.value); setIsDirty(true); }}
              placeholder="Team name…" className="h-7 w-32 text-xs bg-secondary/50 border-0" />
          </div>

          <Select value={template} onValueChange={v => { setTemplate(v); setIsDirty(true); }}>
            <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50 border-0">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={codeStyle} onValueChange={setCodeStyle}>
            <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50 border-0">
              <SelectValue placeholder="Code style" />
            </SelectTrigger>
            <SelectContent>
              {CODE_STYLES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={clearLayout} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
              <Trash2 className="h-3 w-3" /> Clear Layout
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {/* Empty state */}
        {totalPlays === 0 && sections.every(s => s.plays.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/10">
            <Rows3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <h3 className="font-display font-semibold">No plays added yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Auto-populate from a Game Plan Call Sheet, or add plays manually to each section.
            </p>
            {gamePlans.length > 0 ? (
              <Select onValueChange={(id) => {
                const gp = gamePlans.find(g => g.id === id);
                if (gp) autoPopulateFromCallSheet(gp);
              }}>
                <SelectTrigger className="h-9 mt-5 text-sm w-52 bg-accent text-accent-foreground border-0 font-medium rounded-xl">
                  <Sparkles className="h-4 w-4 shrink-0 mr-1" />
                  <SelectValue placeholder="Auto from Call Sheet…" />
                </SelectTrigger>
                <SelectContent>
                  {gamePlans.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.title}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Button className="mt-5 gap-2 rounded-xl" onClick={() => {
                setSections(DEFAULT_SECTIONS.map(s => ({ ...s, plays: [] })));
              }}>
                <Plus className="h-4 w-4" /> Start with Blank Template
              </Button>
            )}
          </div>
        )}

        {/* Section panels */}
        {sections.map((section, sIdx) => (
          <WristbandPanel
            key={sIdx}
            section={section}
            sectionIndex={sIdx}
            playMap={playMap}
            codeStyle={codeStyle}
            isEditing={editingSection === sIdx}
            onToggleEdit={() => setEditingSection(editingSection === sIdx ? null : sIdx)}
            onUpdate={(patch) => updateSection(sIdx, patch)}
            onRemove={() => removeSection(sIdx)}
            onMoveUp={() => moveSectionUp(sIdx)}
            canMoveUp={sIdx > 0}
            onAddPlay={() => { setPickerTargetSection(sIdx); setShowPicker(true); }}
            onRemovePlay={(playId) => removePlayFromSection(sIdx, playId)}
            onUpdatePlay={(playId, patch) => updatePlayEntry(sIdx, playId, patch)}
            termMappings={termMappings}
          />
        ))}

        {/* Add section button */}
        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Section
        </button>
      </div>

      {/* ── Play picker drawer ── */}
      {showPicker && (
        <PlayPickerDrawer
          plays={plays.filter(p => (p.side === sideOfBall || p.side_of_ball === sideOfBall))}
          loading={playsLoading}
          existingPlayIds={new Set(sections.flatMap(s => s.plays.map(p => p.play_id)))}
          sectionName={pickerTargetSection !== null ? sections[pickerTargetSection]?.label : ''}
          onAdd={(play) => {
            if (pickerTargetSection !== null) addPlayToSection(pickerTargetSection, play);
          }}
          onClose={() => { setShowPicker(false); setPickerTargetSection(null); }}
        />
      )}
    </div>
  );
}