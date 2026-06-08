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
  ChevronRight, BarChart2
} from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CallSheetSection from '@/components/game-plan/CallSheetSection';
import WeeklyOverlapPanel from '@/components/game-plan/WeeklyOverlapPanel';
import PlayPickerForCallSheet from '@/components/game-plan/PlayPickerForCallSheet';

// ─── Section definitions ────────────────────────────────────────────────────
const CALL_SHEET_SECTIONS = [
  { key: 'openers',       name: 'Openers',              side: 'offense' },
  { key: 'base_run',      name: 'Base Runs',            side: 'offense' },
  { key: 'base_pass',     name: 'Base Passes',          side: 'offense' },
  { key: 'third_short',   name: '3rd & Short',          side: 'offense' },
  { key: 'third_medium',  name: '3rd & Medium',         side: 'offense' },
  { key: 'third_long',    name: '3rd & Long',           side: 'offense' },
  { key: 'red_zone',      name: 'Red Zone',             side: 'offense' },
  { key: 'goal_line',     name: 'Goal Line',            side: 'offense' },
  { key: 'backed_up',     name: 'Backed Up',            side: 'offense' },
  { key: 'two_point',     name: '2-Point Plays',        side: 'offense' },
  { key: 'shot_plays',    name: 'Shot Plays',           side: 'offense' },
  { key: 'specials',      name: 'Specials / Gadgets',   side: 'offense' },
  { key: 'two_minute',    name: 'End of Half / 2-Min',  side: 'offense' },
  { key: 'clock_kill',    name: 'Four-Minute / Clock Kill', side: 'offense' },
  { key: 'def_base',      name: 'Base Defense',         side: 'defense' },
  { key: 'def_pressure',  name: 'Pressure Packages',    side: 'defense' },
  { key: 'def_red_zone',  name: 'Def Red Zone',         side: 'defense' },
  { key: 'st_kickoff',    name: 'Kickoff',              side: 'special_teams' },
  { key: 'st_punt',       name: 'Punt / Return',        side: 'special_teams' },
  { key: 'st_fg',         name: 'Field Goal / PAT',     side: 'special_teams' },
];

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  finalized: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

// ═══════════════════════════════════════════════════════════════════════════
// GamePlanning — index + call sheet
// ═══════════════════════════════════════════════════════════════════════════
export default function GamePlanning() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [openPlanId, setOpenPlanId] = useState(null);
  const [newPlan, setNewPlan] = useState({ title: '', opponent_name: '', game_date: '', week_label: '', notes: '' });

  const { data: plans = [] } = useQuery({
    queryKey: ['gamePlans', activeTeamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GamePlan.create({
      ...data, team_id: activeTeamId, status: 'draft', play_ids: []
    }),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      setShowCreate(false);
      setNewPlan({ title: '', opponent_name: '', game_date: '', week_label: '', notes: '' });
      setOpenPlanId(plan.id);
      toast.success('Game plan created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GamePlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      toast.success('Game plan deleted');
    },
  });

  const openPlan = plans.find(p => p.id === openPlanId);

  if (openPlanId && openPlan) {
    return (
      <CallSheetEditor
        plan={openPlan}
        teamId={activeTeamId}
        onBack={() => setOpenPlanId(null)}
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

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No game plans yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a game plan to build your call sheet.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> New Game Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setOpenPlanId(plan.id)}
              className="group text-left bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold">{plan.title}</h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
              {plan.opponent_name && (
                <p className="text-sm text-muted-foreground mb-2">vs {plan.opponent_name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="secondary" className={statusColors[plan.status] || ''}>
                  {plan.status?.replace('_', ' ')}
                </Badge>
                {plan.week_label && <Badge variant="outline" className="text-[10px]">{plan.week_label}</Badge>}
              </div>
              {plan.game_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(plan.game_date), 'EEE, MMM d, yyyy')}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {plan.updated_date ? `Updated ${format(new Date(plan.updated_date), 'MMM d')}` : 'Draft'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete this game plan?')) deleteMutation.mutate(plan.id); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New Game Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                placeholder="e.g. Week 3 vs Eagles" className="mt-1.5 h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Opponent</Label>
                <Input value={newPlan.opponent_name} onChange={e => setNewPlan({ ...newPlan, opponent_name: e.target.value })}
                  placeholder="Opponent name" className="mt-1.5 h-9" />
              </div>
              <div>
                <Label className="text-xs">Week</Label>
                <Input value={newPlan.week_label} onChange={e => setNewPlan({ ...newPlan, week_label: e.target.value })}
                  placeholder="e.g. Week 3, Playoffs" className="mt-1.5 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Game Date</Label>
              <Input type="date" value={newPlan.game_date} onChange={e => setNewPlan({ ...newPlan, game_date: e.target.value })}
                className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newPlan.notes} onChange={e => setNewPlan({ ...newPlan, notes: e.target.value })}
                placeholder="Game plan notes..." className="mt-1.5 min-h-[80px]" />
            </div>
            <Button onClick={() => createMutation.mutate(newPlan)} disabled={!newPlan.title || createMutation.isPending} className="w-full gap-2">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Game Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CallSheetEditor — full game-day call sheet
// ═══════════════════════════════════════════════════════════════════════════
function CallSheetEditor({ plan, teamId, onBack }) {
  const queryClient = useQueryClient();
  const [sideFilter, setSideFilter] = useState('offense');
  const [isDirty, setIsDirty] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSection, setPickerSection] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [showOverlap, setShowOverlap] = useState(true);

  // Data
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['gamePlanItems', plan.id],
    queryFn: () => base44.entities.GamePlanItem.filter({ game_plan_id: plan.id }, 'order_index'),
  });

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

  const [localItems, setLocalItems] = useState(null);
  const displayItems = localItems ?? items;

  const practicedPlayIds = useMemo(() =>
    new Set(allScriptItems.map(i => i.play_id).filter(Boolean)), [allScriptItems]);

  // Enrich items with practiced status from scripts
  const enrichedItems = useMemo(() => displayItems.map(item => ({
    ...item,
    practiced_this_week: item.practiced_this_week || practicedPlayIds.has(item.play_id),
  })), [displayItems, practicedPlayIds]);

  const updateLocalItem = (itemId, patch) => {
    setLocalItems(prev => (prev ?? items).map(i => i.id === itemId ? { ...i, ...patch } : i));
    setIsDirty(true);
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        (localItems ?? []).map(item => {
          if (item._temp) {
            const { id, _temp, ...rest } = item;
            return base44.entities.GamePlanItem.create(rest);
          }
          return base44.entities.GamePlanItem.update(item.id, item);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlanItems', plan.id] });
      setIsDirty(false);
      setLocalItems(null);
      toast.success('Call sheet saved');
    },
  });

  const addItemsMutation = useMutation({
    mutationFn: async ({ plays: playsToAdd, sectionKey }) => {
      const existingInSection = enrichedItems.filter(i => i.section_key === sectionKey);
      const created = await Promise.all(playsToAdd.map((play, idx) =>
        base44.entities.GamePlanItem.create({
          game_plan_id: plan.id,
          section_key: sectionKey,
          play_id: play.id,
          call_sheet_priority: 3,
          practiced_this_week: practicedPlayIds.has(play.id),
          included_in_weekly_plan: true,
          order_index: existingInSection.length + idx,
        })
      ));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlanItems', plan.id] });
      setShowPicker(false);
      toast.success('Plays added to call sheet');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (item) => base44.entities.GamePlanItem.delete(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlanItems', plan.id] });
      toast.success('Removed from call sheet');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ item, patch }) => base44.entities.GamePlanItem.update(item.id, { ...item, ...patch }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamePlanItems', plan.id] }),
  });

  const sectionsToShow = CALL_SHEET_SECTIONS.filter(s => s.side === sideFilter);

  const handleOpenDetail = (play) => {
    if (!play) return;
    window.open(`/play-designer?id=${play.id}`, '_blank');
  };

  const totalOnSheet = enrichedItems.length;
  const totalPracticed = enrichedItems.filter(i => i.practiced_this_week).length;

  if (printMode) {
    return (
      <div className="p-4 bg-white text-black font-body">
        {/* Print header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
          <div>
            <h1 className="text-base font-bold font-display">{plan.title}</h1>
            {plan.opponent_name && <p className="text-xs text-gray-600">vs {plan.opponent_name}</p>}
          </div>
          <div className="text-right text-xs text-gray-600">
            {plan.game_date && <p>{format(new Date(plan.game_date), 'EEE, MMM d, yyyy')}</p>}
            {plan.week_label && <p>{plan.week_label}</p>}
          </div>
        </div>

        {/* Print legend */}
        <div className="flex items-center gap-4 text-[10px] text-gray-600 mb-3">
          <span className="font-bold text-emerald-600">PREP</span> = practiced this week
          <span className="font-bold text-amber-600">NP</span> = not practiced
          <span>Priority: 1=high 2=med 3=low</span>
        </div>

        {/* Print sections */}
        <div className="space-y-2">
          {CALL_SHEET_SECTIONS.filter(s => s.side === 'offense').map(section => {
            const sItems = enrichedItems.filter(i => i.section_key === section.key);
            if (!sItems.length) return null;
            return (
              <CallSheetSection
                key={section.key}
                sectionKey={section.key}
                sectionName={section.name}
                items={sItems}
                plays={plays}
                onAdd={() => {}}
                onRemove={() => {}}
                onUpdate={() => {}}
                onOpenDetail={() => {}}
                printMode={true}
              />
            );
          })}
        </div>

        {/* Print footer */}
        <div className="mt-4 pt-2 border-t border-gray-300 text-[10px] text-gray-500 flex justify-between">
          <span>{totalPracticed}/{totalOnSheet} plays practiced this week</span>
          <span>Printed {format(new Date(), 'MMM d, yyyy h:mm a')}</span>
        </div>

        <div className="mt-4 no-print">
          <Button onClick={() => { setPrintMode(false); window.print(); }} className="gap-2">
            Print
          </Button>
          <Button variant="outline" onClick={() => setPrintMode(false)} className="ml-2 gap-2">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main call sheet */}
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
                {plan.game_date && (
                  <span className="text-xs text-muted-foreground">{format(new Date(plan.game_date), 'EEE, MMM d')}</span>
                )}
                {plan.week_label && <Badge variant="secondary" className="text-[10px]">{plan.week_label}</Badge>}
                <span className="text-xs text-muted-foreground">{totalPracticed}/{totalOnSheet} plays practiced</span>
                {isDirty && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <AlertCircle className="h-3 w-3" /> Unsaved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden sm:flex"
                onClick={() => setPrintMode(true)}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                onClick={() => setShowOverlap(o => !o)}>
                <BarChart2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Overlap</span>
              </Button>
              {isDirty && (
                <Button size="sm" className="gap-1.5 h-8"
                  onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Side of ball tabs */}
          <div className="flex gap-1 mt-3 border-b border-border -mb-3 pb-0">
            {[['offense', 'Offense'], ['defense', 'Defense'], ['special_teams', 'Special Teams']].map(([s, l]) => (
              <button key={s} onClick={() => setSideFilter(s)}
                className={cn(
                  "text-xs font-bold px-3 py-2 border-b-2 transition-colors",
                  sideFilter === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* Overlap summary strip (collapsed inline) */}
        {showOverlap && (
          <div className="bg-secondary/20 border-b border-border px-4 sm:px-6 py-2 flex items-center gap-4 shrink-0">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden max-w-xs">
              <div
                className={cn("h-full rounded-full",
                  totalOnSheet === 0 ? "w-0" :
                  (totalPracticed / totalOnSheet) >= 0.8 ? "bg-emerald-500" :
                  (totalPracticed / totalOnSheet) >= 0.5 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: totalOnSheet > 0 ? `${Math.round(totalPracticed / totalOnSheet * 100)}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{totalPracticed}</span>/{totalOnSheet} plays practiced
              {totalOnSheet > 0 && ` (${Math.round(totalPracticed / totalOnSheet * 100)}%)`}
            </span>
            {(totalOnSheet - totalPracticed) > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                <AlertCircle className="h-3 w-3" />
                {totalOnSheet - totalPracticed} unprepped
              </span>
            )}
          </div>
        )}

        {/* Call sheet sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            sectionsToShow.map(section => {
              const sItems = enrichedItems.filter(i => i.section_key === section.key);
              return (
                <CallSheetSection
                  key={section.key}
                  sectionKey={section.key}
                  sectionName={section.name}
                  items={sItems}
                  plays={plays}
                  onAdd={(key) => { setPickerSection(section); setShowPicker(true); }}
                  onRemove={(item) => removeMutation.mutate(item)}
                  onUpdate={(item, patch) => updateItemMutation.mutate({ item, patch })}
                  onOpenDetail={handleOpenDetail}
                  printMode={false}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Weekly overlap sidebar */}
      {showOverlap && (
        <div className="w-56 xl:w-64 shrink-0 border-l border-border bg-card overflow-y-auto p-3 space-y-3 hidden lg:block">
          <WeeklyOverlapPanel callSheetItems={enrichedItems} scriptItems={allScriptItems} />

          {/* Quick legend */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Practiced this week</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-500 text-base leading-none">⚠</span>
                <span>Not practiced (NP)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">1</span>
                <span>Priority 1 = must run</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.5 rounded">2</span>
                <span>Priority 2 = situational</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[9px] font-bold bg-secondary text-muted-foreground px-1 py-0.5 rounded">3</span>
                <span>Priority 3 = if open</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Play picker */}
      {showPicker && (
        <PlayPickerForCallSheet
          teamId={teamId}
          targetSection={pickerSection?.key}
          sectionName={pickerSection?.name}
          practicePlayIds={[...practicedPlayIds]}
          existingPlayIds={enrichedItems.filter(i => i.section_key === pickerSection?.key).map(i => i.play_id)}
          onAdd={(playsToAdd, sectionKey) => addItemsMutation.mutate({ plays: playsToAdd, sectionKey })}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}