import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Save, Printer, Sparkles, Clock, Loader2, AlertCircle, ChevronDown } from "lucide-react";
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
  const [showMobileMore, setShowMobileMore] = useState(false);

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
    onError: () => toast.error('Save failed — try again'),
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
      period_name: '',
      period_type: 'team',
      duration_minutes: 10,
      order_index: displayItems.length,
      coaching_note: '',
    };
    updateItems([...displayItems, newPeriod]);
  };

  const addPlaysToScript = (plays) => {
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
    toast.success(`${plays.length} play${plays.length > 1 ? 's' : ''} added to script`);
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(displayItems);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    updateItems(next);
  };

  const totalMinutes = displayItems.reduce((sum, i) => sum + (i.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const timeLabel = totalHours > 0
    ? `${totalHours}h ${remainingMins}m`
    : `${totalMinutes}m`;

  return (
    <>
      {/* Print styles — injected as a style tag */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-zone, .print-zone * { visibility: visible; }
          .print-zone { position: absolute; inset: 0; }
          .print-header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .print-period { border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; page-break-inside: avoid; }
          .print-period-type { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
          .print-no { display: none !important; }
        }
      `}</style>

      <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden print-zone">
        {/* Main builder */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ── Header ── */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 print-no" onClick={onBack}>
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
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(script.script_date), 'EEE, MMM d')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    {timeLabel}
                    <span className="text-muted-foreground/40 font-sans">·</span>
                    <span>{displayItems.length} periods</span>
                  </span>
                  {isDirty && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="h-3 w-3" /> Unsaved
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 print-no">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden sm:flex"
                  onClick={() => toast.info('AI script generation coming soon')}>
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Draft
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden sm:flex"
                  onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button size="sm" className="gap-1.5 h-8"
                  onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Save className="h-3.5 w-3.5" />
                  }
                  Save
                </Button>
                {/* Mobile overflow */}
                <div className="relative sm:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setShowMobileMore(v => !v)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {showMobileMore && (
                    <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 min-w-[140px] py-1">
                      <button className="w-full text-left text-sm px-4 py-2 hover:bg-secondary/50 flex items-center gap-2"
                        onClick={() => { toast.info('AI draft coming soon'); setShowMobileMore(false); }}>
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Draft
                      </button>
                      <button className="w-full text-left text-sm px-4 py-2 hover:bg-secondary/50 flex items-center gap-2"
                        onClick={() => { window.print(); setShowMobileMore(false); }}>
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ── Context strip ── */}
          <div className="bg-secondary/20 border-b border-border px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">Focus</span>
              <input
                value={localScript.focus_area || ''}
                onChange={e => updateScript('focus_area', e.target.value)}
                placeholder="e.g. Red Zone Install"
                className="flex-1 text-xs bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <span className="text-muted-foreground/20 hidden sm:block">|</span>
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">Emphasis</span>
              <input
                value={localScript.coaching_emphasis || ''}
                onChange={e => updateScript('coaching_emphasis', e.target.value)}
                placeholder="e.g. Finish blocks, no mental errors"
                className="flex-1 text-xs bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* ── Script content ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
                <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <h3 className="font-display font-semibold">Script is empty</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Add timed practice periods or pull plays from your library.
                </p>
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
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
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="script-periods">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
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
                          onAddPlay={() => {
                            setTargetPeriodId(item.id || item._tempId);
                            setShowPlayPicker(true);
                          }}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* Bottom add controls */}
            {displayItems.length > 0 && (
              <div className="flex items-center gap-2 pt-4 print-no">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={addPeriod}>
                  <Plus className="h-3.5 w-3.5" /> Add Period
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs"
                  onClick={() => { setTargetPeriodId(null); setShowPlayPicker(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Add from Library
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Play picker panel ── */}
        {showPlayPicker && (
          <PlayPickerPanel
            teamId={teamId}
            onAdd={(plays) => addPlaysToScript(plays)}
            onClose={() => setShowPlayPicker(false)}
          />
        )}
      </div>
    </>
  );
}