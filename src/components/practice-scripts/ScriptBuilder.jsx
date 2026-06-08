import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Save, Copy, Printer, Sparkles, Clock, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ScriptPeriod from './ScriptPeriod';
import PlayPickerPanel from './PlayPickerPanel';

export default function ScriptBuilder({ script, onBack, teamId }) {
  const queryClient = useQueryClient();
  const [localScript, setLocalScript] = useState(script);
  const [showPlayPicker, setShowPlayPicker] = useState(false);
  const [targetPeriodId, setTargetPeriodId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showPushToGamePlan, setShowPushToGamePlan] = useState(false);
  const [selectedGamePlanId, setSelectedGamePlanId] = useState('');
  const [pushingToGamePlan, setPushingToGamePlan] = useState(false);

  const { data: gamePlans = [] } = useQuery({
    queryKey: ['gamePlans', teamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: teamId }, '-updated_date'),
    enabled: !!teamId && showPushToGamePlan,
  });

  const pushToGamePlan = async () => {
    if (!selectedGamePlanId) return;
    setPushingToGamePlan(true);
    const playIds = [...new Set(displayItems.map(i => i.play_id).filter(Boolean))];
    const sections = await base44.entities.GamePlanSection.filter({ game_plan_id: selectedGamePlanId }, 'order_index');
    const targetSection = sections[0];
    if (!targetSection) {
      toast.error('Game plan has no sections. Open the Call Sheet and initialize sections first.');
      setPushingToGamePlan(false);
      return;
    }
    const existingItems = await base44.entities.GamePlanItem.filter({ game_plan_section_id: targetSection.id });
    const existingPlayIds = new Set(existingItems.map(i => i.play_id));
    const newPlayIds = playIds.filter(id => !existingPlayIds.has(id));
    await Promise.all(newPlayIds.map((playId, i) =>
      base44.entities.GamePlanItem.create({
        game_plan_section_id: targetSection.id,
        game_plan_id: selectedGamePlanId,
        play_id: playId,
        practiced_this_week: true,
        practiced_days: [script.practice_day?.split('_')[0] || 'practice'],
        order_index: existingItems.length + i,
      })
    ));
    toast.success(`${newPlayIds.length} play${newPlayIds.length !== 1 ? 's' : ''} pushed to game plan`);
    setPushingToGamePlan(false);
    setShowPushToGamePlan(false);
  };

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['scriptItems', script.id],
    queryFn: () => base44.entities.PracticeScriptItem.filter({ practice_script_id: script.id }, 'order_index'),
  });

  const [localItems, setLocalItems] = useState(null);
  const displayItems = localItems ?? items;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PracticeScript.update(script.id, {
        title: localScript.title,
        focus_area: localScript.focus_area,
        coaching_emphasis: localScript.coaching_emphasis,
        notes: localScript.notes,
      });
      if (localItems) {
        const existing = items.map(i => i.id);
        const toDelete = existing.filter(id => !localItems.find(i => i.id === id));
        await Promise.all(toDelete.map(id => base44.entities.PracticeScriptItem.delete(id)));
        await Promise.all(localItems.map((item, idx) => {
          const payload = { ...item, practice_script_id: script.id, order_index: idx };
          if (item.id && !item._temp) return base44.entities.PracticeScriptItem.update(item.id, payload);
          const { id, _temp, ...rest } = payload;
          return base44.entities.PracticeScriptItem.create(rest);
        }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptItems', script.id] });
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      setIsDirty(false);
      toast.success('Script saved');
    },
  });

  const updateScript = (field, val) => {
    setLocalScript(s => ({ ...s, [field]: val }));
    setIsDirty(true);
  };

  const updateItems = (newItems) => {
    setLocalItems(newItems);
    setIsDirty(true);
  };

  const addPeriod = () => {
    const newPeriod = {
      _temp: true,
      _tempId: Date.now(),
      practice_script_id: script.id,
      period_name: 'New Period',
      period_type: 'team',
      duration_minutes: 10,
      order_index: displayItems.length,
      coaching_note: '',
    };
    updateItems([...displayItems, newPeriod]);
  };

  const addPlaysToScript = (plays, periodId) => {
    const newItems = plays.map((play, i) => ({
      _temp: true,
      _tempId: Date.now() + i,
      practice_script_id: script.id,
      play_id: play.id,
      period_name: play.play_name || play.name || 'Play',
      period_type: 'rep',
      duration_minutes: 2,
      order_index: displayItems.length + i,
      coaching_note: '',
    }));
    updateItems([...displayItems, ...newItems]);
    setShowPlayPicker(false);
    toast.success(`${plays.length} play${plays.length > 1 ? 's' : ''} added`);
  };

  const totalMinutes = displayItems.reduce((sum, i) => sum + (i.duration_minutes || 0), 0);

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main builder */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                value={localScript.title || ''}
                onChange={e => updateScript('title', e.target.value)}
                className="font-display font-bold text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:bg-secondary/40 rounded px-2 -ml-2"
                placeholder="Script title..."
              />
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {script.practice_day && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {script.practice_day.replace(/_/g, ' ')}
                  </Badge>
                )}
                {script.script_date && (
                  <span className="text-xs text-muted-foreground">{format(new Date(script.script_date), 'EEE, MMM d')}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {totalMinutes} min total
                </span>
                {isDirty && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="h-3 w-3" /> Unsaved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8 hidden sm:flex"
                onClick={() => toast.info('AI script generation coming soon')}>
                <Sparkles className="h-3.5 w-3.5" /> AI Draft
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8 hidden sm:flex"
                onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8 hidden sm:flex"
                onClick={() => setShowPushToGamePlan(true)}>
                <ClipboardList className="h-3.5 w-3.5" /> Push to Game Plan
              </Button>
              <Button size="sm" className="gap-1.5 rounded-lg h-8"
                onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
        </header>

        {/* Script setup strip */}
        <div className="bg-secondary/30 border-b border-border px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 shrink-0">
          <input
            value={localScript.focus_area || ''}
            onChange={e => updateScript('focus_area', e.target.value)}
            placeholder="Focus area (e.g. Red Zone, Install)"
            className="text-xs bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/50 min-w-[160px]"
          />
          <span className="text-muted-foreground/30 hidden sm:block">·</span>
          <input
            value={localScript.coaching_emphasis || ''}
            onChange={e => updateScript('coaching_emphasis', e.target.value)}
            placeholder="Coaching emphasis (e.g. Finish blocks)"
            className="text-xs bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/50 flex-1 min-w-[180px]"
          />
        </div>

        {/* Script content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
              <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <h3 className="font-display font-semibold">Script is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add practice periods or pull plays directly from your playbook.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={addPeriod}>
                  <Plus className="h-4 w-4" /> Add Period
                </Button>
                <Button size="sm" className="gap-1.5 rounded-xl"
                  onClick={() => { setTargetPeriodId(null); setShowPlayPicker(true); }}>
                  <Plus className="h-4 w-4" /> Add Plays
                </Button>
              </div>
            </div>
          ) : (
            <>
              {displayItems.map((item, index) => (
                <ScriptPeriod
                  key={item.id || item._tempId}
                  item={item}
                  index={index}
                  onUpdate={(updated) => {
                    const next = displayItems.map((it, i) => i === index ? updated : it);
                    updateItems(next);
                  }}
                  onDelete={() => updateItems(displayItems.filter((_, i) => i !== index))}
                  onMoveUp={() => {
                    if (index === 0) return;
                    const next = [...displayItems];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    updateItems(next);
                  }}
                  onMoveDown={() => {
                    if (index === displayItems.length - 1) return;
                    const next = [...displayItems];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    updateItems(next);
                  }}
                  onAddPlay={() => { setTargetPeriodId(item.id || item._tempId); setShowPlayPicker(true); }}
                />
              ))}

              {/* Add controls */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={addPeriod}>
                  <Plus className="h-3.5 w-3.5" /> Add Period
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs"
                  onClick={() => { setTargetPeriodId(null); setShowPlayPicker(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Add Plays from Library
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Play picker panel */}
      {showPlayPicker && (
        <PlayPickerPanel
          teamId={teamId}
          onAdd={(plays) => addPlaysToScript(plays, targetPeriodId)}
          onClose={() => setShowPlayPicker(false)}
        />
      )}

      {/* Push to Game Plan dialog */}
      <Dialog open={showPushToGamePlan} onOpenChange={setShowPushToGamePlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Push Plays to Game Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              All plays in this script ({[...new Set(displayItems.map(i => i.play_id).filter(Boolean))].length} plays) will be added to the selected game plan's first section and marked as practiced.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Select Game Plan</label>
              <Select value={selectedGamePlanId} onValueChange={setSelectedGamePlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game plan…" />
                </SelectTrigger>
                <SelectContent>
                  {gamePlans.map(gp => (
                    <SelectItem key={gp.id} value={gp.id}>
                      {gp.title}{gp.opponent_name ? ` — vs ${gp.opponent_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPushToGamePlan(false)}>
                Cancel
              </Button>
              <Button className="flex-1 gap-1.5" onClick={pushToGamePlan}
                disabled={!selectedGamePlanId || pushingToGamePlan}>
                {pushingToGamePlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                Push Plays
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}