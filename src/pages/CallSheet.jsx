import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, Printer, Sparkles, Save, Star, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronRight, MoreVertical, Trash2,
  ArrowUp, ArrowDown, Loader2, X, ClipboardList, Calendar
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { toast } from "sonner";
import CallSheetSection from '@/components/call-sheet/CallSheetSection';
import WeeklySummaryPanel from '@/components/call-sheet/WeeklySummaryPanel';
import PlayPickerPanel from '@/components/practice-scripts/PlayPickerPanel';

const DEFAULT_SECTIONS = [
  { section_name: 'Openers', section_type: 'openers', order_index: 0 },
  { section_name: 'Base Runs', section_type: 'base_runs', order_index: 1 },
  { section_name: 'Base Passes', section_type: 'base_passes', order_index: 2 },
  { section_name: '3rd & Short', section_type: 'third_short', order_index: 3 },
  { section_name: '3rd & Medium', section_type: 'third_medium', order_index: 4 },
  { section_name: '3rd & Long', section_type: 'third_long', order_index: 5 },
  { section_name: 'Red Zone', section_type: 'red_zone', order_index: 6 },
  { section_name: 'Goal Line', section_type: 'goal_line', order_index: 7 },
  { section_name: 'Backed Up', section_type: 'backed_up', order_index: 8 },
  { section_name: '2-Minute', section_type: 'two_minute', order_index: 9 },
  { section_name: 'Shot Plays', section_type: 'shot_plays', order_index: 10 },
  { section_name: 'Specials / Gadgets', section_type: 'specials', order_index: 11 },
];

export default function CallSheet({ plan, onBack }) {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [sideFilter, setSideFilter] = useState('offense');
  const [showSummary, setShowSummary] = useState(false);
  const [showPlayPicker, setShowPlayPicker] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPrint, setIsPrint] = useState(false);

  // Sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['gps', plan.id],
    queryFn: () => base44.entities.GamePlanSection.filter({ game_plan_id: plan.id }, 'order_index'),
  });

  // Items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['gpi', plan.id],
    queryFn: () => base44.entities.GamePlanItem.filter({ game_plan_id: plan.id }, 'order_index'),
  });

  // All team plays
  const { data: plays = [] } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'play_name'),
    enabled: !!activeTeamId,
  });

  // Practice scripts this week (to compute practiced status)
  const { data: scriptItems = [] } = useQuery({
    queryKey: ['allScriptItems', activeTeamId],
    queryFn: async () => {
      const scripts = await base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-script_date', 10);
      if (!scripts.length) return [];
      const allItems = await Promise.all(
        scripts.map(s => base44.entities.PracticeScriptItem.filter({ practice_script_id: s.id }))
      );
      return allItems.flat().map(item => ({ ...item, _scriptDay: scripts.find(s => s.id === item.practice_script_id)?.practice_day }));
    },
    enabled: !!activeTeamId,
  });

  // Map play_id -> practiced days
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

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const allPracticed = new Set(Object.keys(practicedMap));
    const callSheetPlayIds = new Set(items.map(i => i.play_id).filter(Boolean));
    const overlap = [...callSheetPlayIds].filter(id => allPracticed.has(id));
    const unpracticed = [...callSheetPlayIds].filter(id => !allPracticed.has(id));
    return {
      totalPracticed: allPracticed.size,
      totalOnSheet: callSheetPlayIds.size,
      overlap: overlap.length,
      unpracticed: unpracticed.length,
      pct: callSheetPlayIds.size ? Math.round((overlap.length / callSheetPlayIds.size) * 100) : 0,
    };
  }, [practicedMap, items]);

  // Create sections mutation
  const createSectionMutation = useMutation({
    mutationFn: (sec) => base44.entities.GamePlanSection.create({ ...sec, game_plan_id: plan.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gps', plan.id] }),
  });

  const initializeSections = async () => {
    for (const sec of DEFAULT_SECTIONS) {
      await base44.entities.GamePlanSection.create({ ...sec, game_plan_id: plan.id });
    }
    queryClient.invalidateQueries({ queryKey: ['gps', plan.id] });
    toast.success('Call sheet sections created');
  };

  // Add plays to a section
  const addPlaysToSection = async (selectedPlays) => {
    if (!targetSectionId) return;
    const sectionItems = items.filter(i => i.game_plan_section_id === targetSectionId);
    const newItems = selectedPlays.map((play, i) => ({
      game_plan_section_id: targetSectionId,
      game_plan_id: plan.id,
      play_id: play.id,
      order_index: sectionItems.length + i,
      practiced_this_week: !!practicedMap[play.id],
      practiced_days: practicedMap[play.id] || [],
      call_sheet_priority: 0,
    }));
    await Promise.all(newItems.map(item => base44.entities.GamePlanItem.create(item)));
    queryClient.invalidateQueries({ queryKey: ['gpi', plan.id] });
    setShowPlayPicker(false);
    toast.success(`${selectedPlays.length} play${selectedPlays.length > 1 ? 's' : ''} added to section`);
  };

  const removeItem = async (itemId) => {
    await base44.entities.GamePlanItem.delete(itemId);
    queryClient.invalidateQueries({ queryKey: ['gpi', plan.id] });
  };

  const updateItem = async (itemId, data) => {
    await base44.entities.GamePlanItem.update(itemId, data);
    queryClient.invalidateQueries({ queryKey: ['gpi', plan.id] });
  };

  const savePlan = async () => {
    await base44.entities.GamePlan.update(plan.id, { status: 'in_progress' });
    toast.success('Call sheet saved');
    setIsDirty(false);
  };

  const finalizePlan = async () => {
    await base44.entities.GamePlan.update(plan.id, { status: 'finalized' });
    queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
    toast.success('Game plan finalized');
  };

  const isLoading = sectionsLoading || itemsLoading;
  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  if (isPrint) {
    return (
      <CallSheetPrintView
        plan={plan}
        sections={sortedSections}
        items={items}
        playMap={playMap}
        practicedMap={practicedMap}
        onClose={() => setIsPrint(false)}
      />
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-base truncate">{plan.title}</h2>
              {plan.opponent_name && (
                <span className="text-sm text-muted-foreground">vs {plan.opponent_name}</span>
              )}
              {plan.game_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(plan.game_date), 'EEE, MMM d')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="secondary" className={cn("text-[10px]",
                plan.status === 'finalized' ? 'bg-emerald-500/10 text-emerald-700' :
                plan.status === 'in_progress' ? 'bg-blue-500/10 text-blue-700' : '')}>
                {plan.status?.replace('_', ' ')}
              </Badge>
              {isDirty && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Offense/Defense toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            {['offense', 'defense', 'special_teams'].map(s => (
              <button key={s} onClick={() => setSideFilter(s)}
                className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize",
                  sideFilter === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                {s === 'special_teams' ? 'ST' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden sm:flex"
              onClick={() => setShowSummary(!showSummary)}>
              <ClipboardList className="h-3.5 w-3.5" />
              <span className={cn("font-mono text-xs px-1 py-0.5 rounded",
                weeklyStats.pct >= 80 ? "text-emerald-600" : weeklyStats.pct >= 50 ? "text-amber-600" : "text-red-600")}>
                {weeklyStats.pct}%
              </span>
              Practiced
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden sm:flex"
              onClick={() => setIsPrint(true)}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={savePlan}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main call sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
              <ClipboardList className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold">No call sheet sections</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Initialize default situational sections or add one manually.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl"
                  onClick={initializeSections}>
                  <Sparkles className="h-4 w-4" /> Initialize Sections
                </Button>
                <Button size="sm" className="gap-1.5 rounded-xl"
                  onClick={() => createSectionMutation.mutate({ section_name: 'Custom', section_type: 'custom', order_index: 0 })}>
                  <Plus className="h-4 w-4" /> Add Section
                </Button>
              </div>
            </div>
          ) : (
            <>
              {sortedSections.map(section => {
                const sectionItems = items
                  .filter(i => i.game_plan_section_id === section.id)
                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                return (
                  <CallSheetSection
                    key={section.id}
                    section={section}
                    items={sectionItems}
                    playMap={playMap}
                    practicedMap={practicedMap}
                    onAddPlays={() => { setTargetSectionId(section.id); setShowPlayPicker(true); }}
                    onRemoveItem={removeItem}
                    onUpdateItem={updateItem}
                  />
                );
              })}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs"
                  onClick={() => createSectionMutation.mutate({ section_name: 'Custom', section_type: 'custom', order_index: sections.length })}>
                  <Plus className="h-3.5 w-3.5" /> Add Section
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Summary panel */}
        {showSummary && (
          <WeeklySummaryPanel
            stats={weeklyStats}
            items={items}
            playMap={playMap}
            practicedMap={practicedMap}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Play picker */}
        {showPlayPicker && (
          <PlayPickerPanel
            teamId={activeTeamId}
            onAdd={addPlaysToSection}
            onClose={() => setShowPlayPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

function CallSheetPrintView({ plan, sections, items, playMap, practicedMap, onClose }) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="p-4 no-print flex items-center gap-2 border-b border-gray-200">
        <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
          <X className="h-4 w-4" /> Close
        </Button>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>
      <div className="max-w-5xl mx-auto p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{plan.title}</h1>
          {plan.opponent_name && <p className="text-sm text-gray-600">vs {plan.opponent_name}</p>}
          {plan.game_date && <p className="text-xs text-gray-500">{format(new Date(plan.game_date), 'EEEE, MMMM d, yyyy')}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {sections.map(section => {
            const sectionItems = items.filter(i => i.game_plan_section_id === section.id);
            if (!sectionItems.length) return null;
            return (
              <div key={section.id} className="border border-gray-300 rounded">
                <div className="bg-gray-800 text-white px-3 py-1.5 font-bold text-xs uppercase tracking-wide">
                  {section.section_name}
                </div>
                <div className="divide-y divide-gray-200">
                  {sectionItems.map((item, i) => {
                    const play = playMap[item.play_id];
                    if (!play) return null;
                    const practiced = practicedMap[item.play_id];
                    return (
                      <div key={item.id} className="px-3 py-1.5 flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-4 shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold">{play.play_name}</span>
                          {play.short_name && <span className="text-gray-500 ml-1 font-mono">({play.short_name})</span>}
                          {play.formation_id && <span className="text-gray-500 ml-1">{play.concept}</span>}
                        </div>
                        {practiced && (
                          <span className="text-[9px] font-bold text-emerald-700 uppercase">{practiced.join('/')}</span>
                        )}
                        {!practiced && <span className="text-[9px] text-red-500 font-bold">!</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}