import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Calendar, Shield, Zap, Loader2, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CALL_SHEET_SECTIONS = [
  ['openers', 'Openers'], ['base_run', 'Base Runs'], ['base_pass', 'Base Passes'],
  ['third_short', '3rd & Short'], ['red_zone', 'Red Zone'], ['goal_line', 'Goal Line'],
  ['shot_plays', 'Shot Plays'], ['two_minute', '2-Min'],
];

export default function WeeklyInstallPlanner() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [selectedOpponentId, setSelectedOpponentId] = useState('');
  const [selectedGamePlanId, setSelectedGamePlanId] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [generating, setGenerating] = useState(false);

  const { data: opponents = [] } = useQuery({
    queryKey: ['opponents', activeTeamId],
    queryFn: () => base44.entities.Opponent.filter({ team_id: activeTeamId }, 'game_date'),
    enabled: !!activeTeamId,
  });

  const { data: gamePlans = [] } = useQuery({
    queryKey: ['gamePlans', activeTeamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const { data: plays = [] } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'name'),
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

  const playMap = useMemo(() => {
    const m = {};
    plays.forEach(p => { m[p.id] = p; });
    return m;
  }, [plays]);

  const practicedIds = useMemo(() =>
    new Set(scriptItems.map(i => i.play_id).filter(Boolean)),
    [scriptItems]
  );

  const selectedPlan = gamePlans.find(p => p.id === selectedGamePlanId);
  const selectedOpponent = opponents.find(o => o.id === selectedOpponentId);

  // Build readiness gaps from call sheet vs practiced plays
  const readinessGaps = useMemo(() => {
    if (!selectedPlan?.call_sheet) return [];
    const callSheet = selectedPlan.call_sheet;
    const gaps = [];
    CALL_SHEET_SECTIONS.forEach(([key, label]) => {
      const entries = callSheet[key] || [];
      const unprepped = entries.filter(e => e.play_id && !practicedIds.has(e.play_id));
      if (unprepped.length > 0) {
        gaps.push({
          section: label,
          count: unprepped.length,
          plays: unprepped.map(e => playMap[e.play_id]?.name || playMap[e.play_id]?.play_name || 'Unknown'),
        });
      }
    });
    return gaps;
  }, [selectedPlan, practicedIds, playMap]);

  const totalCallSheetPlays = useMemo(() => {
    if (!selectedPlan?.call_sheet) return 0;
    const callSheet = selectedPlan.call_sheet;
    return Object.values(callSheet).flat().length;
  }, [selectedPlan]);

  const practicedOnSheet = useMemo(() => {
    if (!selectedPlan?.call_sheet) return 0;
    const callSheet = selectedPlan.call_sheet;
    return Object.values(callSheet).flat().filter(e => e.play_id && practicedIds.has(e.play_id)).length;
  }, [selectedPlan, practicedIds]);

  const handleAutoGenerate = async () => {
    if (!selectedOpponentId && !selectedGamePlanId) {
      toast.error('Select an opponent or game plan first');
      return;
    }
    setGenerating(true);
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `You are a football coaching assistant. Generate a brief weekly install plan summary for week ${weekNumber}${selectedOpponent ? ` vs ${selectedOpponent.name}` : ''}. List 3-5 install priorities as short bullet points. Keep it practical and specific.`,
      });
      toast.success('Install plan generated');
    } catch {
      toast.error('Generation failed');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Weekly Install Planner</h1>
          <p className="text-sm text-muted-foreground">Plan your weekly install priorities based on your opponent and call sheet.</p>
        </div>
        <Button onClick={handleAutoGenerate} disabled={generating} className="gap-2 rounded-xl">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI Install Plan
        </Button>
      </div>

      {/* Setup selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Week</label>
          <Select value={String(weekNumber)} onValueChange={v => setWeekNumber(parseInt(v))}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>Week {i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Opponent</label>
          <Select value={selectedOpponentId} onValueChange={setSelectedOpponentId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select opponent…" />
            </SelectTrigger>
            <SelectContent>
              {opponents.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Game Plan</label>
          <Select value={selectedGamePlanId} onValueChange={setSelectedGamePlanId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select game plan…" />
            </SelectTrigger>
            <SelectContent>
              {gamePlans.map(gp => (
                <SelectItem key={gp.id} value={gp.id}>{gp.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Readiness overview */}
      {selectedPlan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">On Call Sheet</p>
            <p className="text-2xl font-display font-bold">{totalCallSheetPlays}</p>
            <p className="text-xs text-muted-foreground">plays scripted</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Practiced</p>
            <p className="text-2xl font-display font-bold text-emerald-600">{practicedOnSheet}</p>
            <p className="text-xs text-muted-foreground">of {totalCallSheetPlays} plays</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Not Repped</p>
            <p className={cn("text-2xl font-display font-bold", totalCallSheetPlays - practicedOnSheet > 0 ? "text-amber-600" : "text-emerald-600")}>
              {totalCallSheetPlays - practicedOnSheet}
            </p>
            <p className="text-xs text-muted-foreground">plays need reps</p>
          </div>
        </div>
      )}

      {/* Readiness gaps */}
      {readinessGaps.length > 0 && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-amber-500/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-display font-semibold text-sm">Readiness Gaps</h3>
              <span className="text-xs text-muted-foreground">{readinessGaps.length} sections with unprepped plays</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {readinessGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{gap.section}</p>
                  <p className="text-xs text-muted-foreground">{gap.plays.slice(0, 3).join(', ')}{gap.plays.length > 3 ? ` +${gap.plays.length - 3} more` : ''}</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-400/30 bg-amber-400/5">
                  {gap.count} unprepped
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedGamePlanId && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="font-display font-semibold">Select a game plan to start</h3>
          <p className="text-sm text-muted-foreground mt-1">Choose a game plan above to see your weekly install readiness.</p>
        </div>
      )}
    </div>
  );
}