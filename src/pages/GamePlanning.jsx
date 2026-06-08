import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ClipboardList, Calendar, Trash2, ArrowLeft,
  Printer, Save, Loader2, AlertCircle, CheckCircle2,
  ChevronRight, BarChart2, ChevronDown, AlertTriangle,
  Star, MoreHorizontal, StickyNote, X
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Section definitions ─────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'openers',      name: 'Openers',                side: 'offense' },
  { key: 'base_run',     name: 'Base Runs',              side: 'offense' },
  { key: 'base_pass',    name: 'Base Passes',            side: 'offense' },
  { key: 'third_short',  name: '3rd & Short',            side: 'offense' },
  { key: 'third_medium', name: '3rd & Medium',           side: 'offense' },
  { key: 'third_long',   name: '3rd & Long',             side: 'offense' },
  { key: 'red_zone',     name: 'Red Zone',               side: 'offense' },
  { key: 'goal_line',    name: 'Goal Line',              side: 'offense' },
  { key: 'backed_up',    name: 'Backed Up',              side: 'offense' },
  { key: 'two_point',    name: '2-Point Plays',          side: 'offense' },
  { key: 'shot_plays',   name: 'Shot Plays',             side: 'offense' },
  { key: 'specials',     name: 'Specials / Gadgets',     side: 'offense' },
  { key: 'two_minute',   name: 'End of Half / 2-Min',   side: 'offense' },
  { key: 'clock_kill',   name: 'Four-Min / Clock Kill',  side: 'offense' },
  { key: 'def_base',     name: 'Base Defense',           side: 'defense' },
  { key: 'def_pressure', name: 'Pressure Packages',      side: 'defense' },
  { key: 'def_red_zone', name: 'Def Red Zone',           side: 'defense' },
  { key: 'st_kickoff',   name: 'Kickoff',                side: 'special_teams' },
  { key: 'st_punt',      name: 'Punt / Return',          side: 'special_teams' },
  { key: 'st_fg',        name: 'Field Goal / PAT',       side: 'special_teams' },
];

const STATUS_COLORS = {
  draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  finalized: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

// ─── Helper: flat list of all call sheet entries for a plan ──────────────────
function allEntries(plan) {
  if (!plan?.call_sheet) return [];
  return Object.entries(plan.call_sheet).flatMap(([key, entries]) =>
    (entries || []).map(e => ({ ...e, section_key: key }))
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function GamePlanning() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [openPlanId, setOpenPlanId] = useState(null);
  const [form, setForm] = useState({ title: '', opponent_name: '', game_date: '', week_label: '', notes: '' });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['gamePlans', activeTeamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.GamePlan.create({
      ...form, team_id: activeTeamId, status: 'draft', call_sheet: {}
    }),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      setShowCreate(false);
      setForm({ title: '', opponent_name: '', game_date: '', week_label: '', notes: '' });
      setOpenPlanId(plan.id);
      toast.success('Game plan created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GamePlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      toast.success('Deleted');
    },
  });

  const openPlan = plans.find(p => p.id === openPlanId);

  if (openPlanId && openPlan) {
    return (
      <CallSheetEditor
        key={openPlanId}
        plan={openPlan}
        teamId={activeTeamId}
        onBack={() => setOpenPlanId(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['gamePlans'] })}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Game Planning</h1>
          <p className="text-sm text-muted-foreground">{plans.length} game plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> New Game Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4"><ClipboardList className="h-8 w-8 text-muted-foreground" /></div>
          <h3 className="text-lg font-display font-semibold">No game plans yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a game plan to start building your call sheet.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Game Plan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const entries = allEntries(plan);
            const practiced = entries.filter(e => e.practiced_this_week).length;
            return (
              <button key={plan.id} onClick={() => setOpenPlanId(plan.id)}
                className="group text-left bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold">{plan.title}</h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>
                {plan.opponent_name && <p className="text-xs text-muted-foreground mb-1">vs {plan.opponent_name}</p>}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="secondary" className={cn('text-[10px]', STATUS_COLORS[plan.status] || '')}>{plan.status?.replace('_', ' ')}</Badge>
                  {plan.week_label && <Badge variant="outline" className="text-[10px]">{plan.week_label}</Badge>}
                  {entries.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{practiced}/{entries.length} practiced</span>
                  )}
                </div>
                {plan.game_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(plan.game_date), 'EEE, MMM d, yyyy')}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                  <span className="text-xs text-primary font-medium">Open Call Sheet →</span>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(plan.id); }}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">New Game Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 3 vs Eagles" className="mt-1.5 h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Opponent</Label>
                <Input value={form.opponent_name} onChange={e => setForm(f => ({ ...f, opponent_name: e.target.value }))} placeholder="Eagles" className="mt-1.5 h-9" />
              </div>
              <div>
                <Label className="text-xs">Week</Label>
                <Input value={form.week_label} onChange={e => setForm(f => ({ ...f, week_label: e.target.value }))} placeholder="Week 3" className="mt-1.5 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Game Date</Label>
              <Input type="date" value={form.game_date} onChange={e => setForm(f => ({ ...f, game_date: e.target.value }))} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1.5 resize-none" />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending} className="w-full gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Game Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Call Sheet Editor ────────────────────────────────────────────────────────
function CallSheetEditor({ plan, teamId, onBack, onSaved }) {
  const [sideFilter, setSideFilter] = useState('offense');
  const [isDirty, setIsDirty] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSection, setPickerSection] = useState(null);
  const [showOverlap, setShowOverlap] = useState(true);

  // Local call_sheet state (object keyed by section_key, values are arrays of entries)
  const [callSheet, setCallSheet] = useState(plan.call_sheet || {});

  const { data: plays = [] } = useQuery({
    queryKey: ['plays', teamId],
    queryFn: () => base44.entities.Play.filter({ team_id: teamId }, 'play_name'),
    enabled: !!teamId,
  });

  const { data: allScriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', teamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: teamId });
      if (!scripts.length) return [];
      const nested = await Promise.all(scripts.map(s =>
        base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id })
      ));
      return nested.flat();
    },
    enabled: !!teamId,
  });

  const practicedPlayIds = useMemo(() =>
    new Set(allScriptItems.map(i => i.play_id).filter(Boolean)),
    [allScriptItems]
  );

  const playMap = useMemo(() => Object.fromEntries(plays.map(p => [p.id, p])), [plays]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.GamePlan.update(plan.id, { call_sheet: callSheet }),
    onSuccess: () => {
      setIsDirty(false);
      onSaved();
      toast.success('Call sheet saved');
    },
  });

  const updateCallSheet = (newSheet) => {
    setCallSheet(newSheet);
    setIsDirty(true);
  };

  const addPlays = (selectedPlays, sectionKey) => {
    const existing = callSheet[sectionKey] || [];
    const existingIds = new Set(existing.map(e => e.play_id));
    const toAdd = selectedPlays
      .filter(p => !existingIds.has(p.id))
      .map((p, i) => ({
        play_id: p.id,
        call_sheet_priority: 3,
        practiced_this_week: practicedPlayIds.has(p.id),
        order_index: existing.length + i,
      }));
    updateCallSheet({ ...callSheet, [sectionKey]: [...existing, ...toAdd] });
    setShowPicker(false);
    toast.success(`${toAdd.length} play${toAdd.length !== 1 ? 's' : ''} added`);
  };

  const removeEntry = (sectionKey, playId) => {
    const updated = (callSheet[sectionKey] || []).filter(e => e.play_id !== playId);
    updateCallSheet({ ...callSheet, [sectionKey]: updated });
  };

  const updateEntry = (sectionKey, playId, patch) => {
    const updated = (callSheet[sectionKey] || []).map(e =>
      e.play_id === playId ? { ...e, ...patch } : e
    );
    updateCallSheet({ ...callSheet, [sectionKey]: updated });
  };

  const moveEntry = (sectionKey, idx, dir) => {
    const arr = [...(callSheet[sectionKey] || [])];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    updateCallSheet({ ...callSheet, [sectionKey]: arr });
  };

  const sectionsToShow = SECTIONS.filter(s => s.side === sideFilter);

  const allEntryList = Object.values(callSheet).flat();
  const totalOnSheet = allEntryList.length;
  const totalPracticed = allEntryList.filter(e => e.practiced_this_week || practicedPlayIds.has(e.play_id)).length;
  const pct = totalOnSheet > 0 ? Math.round(totalPracticed / totalOnSheet * 100) : 0;

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-base truncate">{plan.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {plan.opponent_name && <span className="text-xs text-muted-foreground">vs {plan.opponent_name}</span>}
                {plan.game_date && <span className="text-xs text-muted-foreground">{format(new Date(plan.game_date), 'EEE, MMM d')}</span>}
                {plan.week_label && <Badge variant="secondary" className="text-[10px]">{plan.week_label}</Badge>}
                <span className="text-xs text-muted-foreground">{totalPracticed}/{totalOnSheet} practiced</span>
                {isDirty && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <AlertCircle className="h-3 w-3" /> Unsaved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden sm:flex" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowOverlap(o => !o)}>
                <BarChart2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="gap-1.5 h-8" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !isDirty}>
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>

          {/* Side tabs */}
          <div className="flex gap-1 mt-3 -mb-3 border-b border-border pb-0">
            {[['offense', 'Offense'], ['defense', 'Defense'], ['special_teams', 'ST']].map(([s, l]) => (
              <button key={s} onClick={() => setSideFilter(s)}
                className={cn("text-xs font-bold px-3 py-2 border-b-2 transition-colors",
                  sideFilter === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* Prep overlap strip */}
        {showOverlap && totalOnSheet > 0 && (
          <div className="bg-secondary/20 border-b border-border px-4 sm:px-6 py-2 flex items-center gap-3 shrink-0">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden max-w-xs">
              <div className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">
              <b className="text-foreground">{totalPracticed}</b>/{totalOnSheet} practiced ({pct}%)
            </span>
            {(totalOnSheet - totalPracticed) > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                <AlertCircle className="h-3 w-3" />{totalOnSheet - totalPracticed} unprepped
              </span>
            )}
          </div>
        )}

        {/* Sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 print:p-2">
          {sectionsToShow.map(section => {
            const entries = (callSheet[section.key] || [])
              .map(e => ({ ...e, _play: playMap[e.play_id], practiced_this_week: e.practiced_this_week || practicedPlayIds.has(e.play_id) }))
              .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99));
            const unpracticed = entries.filter(e => !e.practiced_this_week).length;

            return (
              <CallSheetSectionBlock
                key={section.key}
                sectionKey={section.key}
                sectionName={section.name}
                entries={entries}
                unpracticed={unpracticed}
                onAdd={() => { setPickerSection(section); setShowPicker(true); }}
                onRemove={(playId) => removeEntry(section.key, playId)}
                onUpdate={(playId, patch) => updateEntry(section.key, playId, patch)}
                onMoveUp={(idx) => moveEntry(section.key, idx, -1)}
                onMoveDown={(idx) => moveEntry(section.key, idx, 1)}
              />
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      {showOverlap && (
        <div className="hidden lg:flex w-56 xl:w-64 shrink-0 border-l border-border bg-card/50 flex-col p-3 space-y-3 overflow-y-auto print:hidden">
          <OverlapSummary practiced={totalPracticed} total={totalOnSheet} pct={pct} />
          <Legend />
        </div>
      )}

      {/* Play picker */}
      {showPicker && (
        <PlayPicker
          teamId={teamId}
          sectionName={pickerSection?.name}
          practicedPlayIds={practicedPlayIds}
          existingIds={new Set((callSheet[pickerSection?.key] || []).map(e => e.play_id))}
          plays={plays}
          onAdd={(sel) => addPlays(sel, pickerSection.key)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Call Sheet Section Block ─────────────────────────────────────────────────
function CallSheetSectionBlock({ sectionKey, sectionName, entries, unpracticed, onAdd, onRemove, onUpdate, onMoveUp, onMoveDown }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card print:break-inside-avoid">
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border-b border-border cursor-pointer hover:bg-secondary/60 transition-colors"
        onClick={() => setCollapsed(c => !c)}>
        {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <span className="font-display font-bold text-xs uppercase tracking-wider flex-1">{sectionName}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{entries.length}</span>
        {unpracticed > 0 && (
          <div className="flex items-center gap-1 text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-bold hidden sm:block">{unpracticed} NP</span>
          </div>
        )}
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors print:hidden"
          onClick={e => { e.stopPropagation(); onAdd(); }}>
          <Plus className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {!collapsed && (
        <div className="divide-y divide-border/50">
          {entries.length === 0 ? (
            <button onClick={onAdd}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground hover:bg-secondary/20 transition-colors print:hidden">
              <Plus className="h-3.5 w-3.5" /> Add plays to {sectionName}
            </button>
          ) : (
            entries.map((entry, idx) => (
              <CallSheetEntryRow
                key={entry.play_id}
                entry={entry}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === entries.length - 1}
                onRemove={() => onRemove(entry.play_id)}
                onUpdate={(patch) => onUpdate(entry.play_id, patch)}
                onMoveUp={() => onMoveUp(idx)}
                onMoveDown={() => onMoveDown(idx)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Call Sheet Entry Row ─────────────────────────────────────────────────────
function CallSheetEntryRow({ entry, index, isFirst, isLast, onRemove, onUpdate, onMoveUp, onMoveDown }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(entry.coach_note || '');
  const play = entry._play;

  return (
    <div className={cn("group flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/20 transition-colors",
      entry.call_sheet_priority === 1 && "border-l-2 border-amber-400 pl-2.5")}>
      {/* Priority */}
      <button
        onClick={() => onUpdate({ call_sheet_priority: (entry.call_sheet_priority || 3) === 1 ? 3 : (entry.call_sheet_priority || 3) - 1 })}
        className={cn("text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
          entry.call_sheet_priority === 1 ? "bg-amber-500 text-white" :
          entry.call_sheet_priority === 2 ? "bg-secondary text-muted-foreground" :
          "bg-secondary/50 text-muted-foreground/50"
        )}>
        {entry.call_sheet_priority || 3}
      </button>

      {/* Opener badge */}
      {entry.is_opener && (
        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
      )}

      {/* Play info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{play?.play_name || <span className="text-muted-foreground italic text-xs">Unknown play</span>}</span>
          {play?.short_name && <code className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{play.short_name}</code>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {play?.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
          {play?.run_pass_type && (
            <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded",
              play.run_pass_type === 'run' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
              play.run_pass_type === 'pass' ? "bg-sky-500/10 text-sky-700 dark:text-sky-400" :
              "bg-secondary text-muted-foreground"
            )}>
              {play.run_pass_type.toUpperCase()}
            </span>
          )}
          {entry.situational_role && <span className="text-[10px] text-muted-foreground italic">{entry.situational_role}</span>}
          {editingNote ? (
            <div className="flex items-center gap-1">
              <Input autoFocus value={noteVal} onChange={e => setNoteVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ coach_note: noteVal }); setEditingNote(false); } if (e.key === 'Escape') setEditingNote(false); }}
                className="h-5 py-0 px-1.5 text-[10px] bg-secondary border-0 w-36" placeholder="Add note..." />
              <button onClick={() => { onUpdate({ coach_note: noteVal }); setEditingNote(false); }} className="text-[10px] text-primary font-bold">✓</button>
              <button onClick={() => setEditingNote(false)}><X className="h-3 w-3 text-muted-foreground" /></button>
            </div>
          ) : (
            entry.coach_note && <span className="text-[10px] text-muted-foreground/70 italic truncate max-w-[120px]">"{entry.coach_note}"</span>
          )}
        </div>
      </div>

      {/* Practiced status */}
      <div className="shrink-0 flex items-center gap-1">
        {entry.practiced_this_week ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        )}
        {entry.practiced_this_week && entry.practiced_day && (
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hidden md:block">{entry.practiced_day}</span>
        )}
        {!entry.practiced_this_week && (
          <span className="text-[9px] font-bold text-amber-500 hidden md:block">NP</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
        <button onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary disabled:opacity-20">
          <ChevronRight className="h-3 w-3 rotate-[-90deg] text-muted-foreground" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary disabled:opacity-20">
          <ChevronRight className="h-3 w-3 rotate-90 text-muted-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => { setNoteVal(entry.coach_note || ''); setEditingNote(true); }}>
              <StickyNote className="h-3.5 w-3.5 mr-2" /> Add note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate({ is_opener: !entry.is_opener })}>
              <Star className="h-3.5 w-3.5 mr-2" /> {entry.is_opener ? 'Remove opener' : 'Mark as opener'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate({ practiced_this_week: !entry.practiced_this_week })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> {entry.practiced_this_week ? 'Mark unpracticed' : 'Mark practiced'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Play Picker ──────────────────────────────────────────────────────────────
function PlayPicker({ teamId, sectionName, practicedPlayIds, existingIds, plays, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('offense');
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => plays.filter(p => {
    if (p.side_of_ball !== side) return false;
    if (existingIds.has(p.id)) return false;
    if (!search) return true;
    return [p.play_name, p.short_name, p.concept, p.play_family].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
  }), [plays, side, search, existingIds]);

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 print:hidden">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h3 className="font-display font-bold text-sm">Add Plays</h3>
            {sectionName && <p className="text-xs text-muted-foreground">→ {sectionName}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex border-b border-border shrink-0">
          {['offense', 'defense', 'special_teams'].map(s => (
            <button key={s} onClick={() => setSide(s)}
              className={cn("flex-1 text-[10px] font-bold py-2 transition-all border-b-2",
                side === s ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
              {s === 'special_teams' ? 'ST' : s}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-b border-border shrink-0">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plays..."
            className="h-8 text-xs bg-secondary/50 border-0" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filtered.map(play => {
            const isPracticed = practicedPlayIds.has(play.id);
            const isSel = selected.includes(play.id);
            return (
              <button key={play.id} onClick={() => toggle(play.id)}
                className={cn("w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors",
                  isSel ? "bg-primary/5" : "hover:bg-secondary/30")}>
                <div className={cn("h-4 w-4 rounded border shrink-0 mt-0.5 flex items-center justify-center",
                  isSel ? "bg-primary border-primary" : "border-border")}>
                  {isSel && <span className="text-[10px] text-white font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{play.play_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {play.short_name && <code className="text-[10px] text-muted-foreground font-mono">{play.short_name}</code>}
                    {play.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
                    {isPracticed
                      ? <span className="text-[9px] text-emerald-500 font-bold">✓ practiced</span>
                      : <span className="text-[9px] text-amber-500">not practiced</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-muted-foreground">No plays found</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border shrink-0">
          {selected.length > 0 ? (
            <Button onClick={() => onAdd(plays.filter(p => selected.includes(p.id)))} className="w-full gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Add {selected.length} Play{selected.length > 1 ? 's' : ''}
            </Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-1">Select plays to add</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overlap Summary ──────────────────────────────────────────────────────────
function OverlapSummary({ practiced, total, pct }) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weekly Prep</p>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        {[['On Sheet', total, ''], ['Practiced', practiced, 'text-emerald-500'], ['Unprepped', total - practiced, total - practiced > 0 ? 'text-amber-500' : '']].map(([l, v, c]) => (
          <div key={l}>
            <div className={cn("text-base font-bold font-display", c)}>{v}</div>
            <div className="text-[9px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <div className={cn("text-center text-xs font-bold", pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500")}>
        {pct}% prepped
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legend</p>
      {[
        [<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, 'Practiced this week'],
        [<AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, 'Not practiced (NP)'],
        [<Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />, 'Opener'],
        [<span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.5 rounded">1</span>, 'Priority 1 = must run'],
        [<span className="text-[9px] font-bold bg-secondary text-muted-foreground px-1 py-0.5 rounded">3</span>, 'Priority 3 = if open'],
      ].map(([icon, label], i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {icon}
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}