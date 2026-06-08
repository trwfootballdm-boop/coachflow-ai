import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SECTION_TYPES = [
  ['openers', 'Openers'],
  ['base_runs', 'Base Runs'],
  ['base_passes', 'Base Passes'],
  ['third_short', '3rd & Short'],
  ['third_medium', '3rd & Medium'],
  ['third_long', '3rd & Long'],
  ['red_zone', 'Red Zone'],
  ['goal_line', 'Goal Line'],
  ['backed_up', 'Backed Up'],
  ['two_point', '2-Point Plays'],
  ['shot_plays', 'Shot Plays'],
  ['specials', 'Specials / Gadgets'],
  ['two_minute', 'End of Half / 2-Min'],
  ['four_minute', '4-Minute / Clock Kill'],
];

export default function AddToGamePlanDialog({ open, onClose, teamId, plays = [], practicedDay = '' }) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [newSectionType, setNewSectionType] = useState('');

  const { data: plans = [] } = useQuery({
    queryKey: ['gamePlans', teamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: teamId }, '-updated_date'),
    enabled: !!teamId && open,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['gamePlanSections', selectedPlanId],
    queryFn: () => base44.entities.GamePlanSection.filter({ game_plan_id: selectedPlanId }, 'order_index'),
    enabled: !!selectedPlanId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let sectionId = selectedSectionId;

      // Create section if using "new section" flow
      if (!sectionId && newSectionType && selectedPlanId) {
        const label = SECTION_TYPES.find(([v]) => v === newSectionType)?.[1] || newSectionType;
        const newSection = await base44.entities.GamePlanSection.create({
          game_plan_id: selectedPlanId,
          section_name: label,
          section_type: newSectionType,
          order_index: sections.length,
        });
        sectionId = newSection.id;
      }

      if (!sectionId) throw new Error('Select a section');

      // Fetch existing items to determine order
      const existing = await base44.entities.GamePlanItem.filter({ section_id: sectionId }, 'order_index');
      let startIdx = existing.length;

      await Promise.all(plays.map((play, i) =>
        base44.entities.GamePlanItem.create({
          game_plan_id: selectedPlanId,
          section_id: sectionId,
          play_id: play.id,
          order_index: startIdx + i,
          practiced_this_week: !!practicedDay,
          practiced_day: practicedDay || '',
          call_sheet_priority: startIdx + i,
          included_in_weekly_plan: true,
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlanItems'] });
      queryClient.invalidateQueries({ queryKey: ['gamePlanSections'] });
      toast.success(`${plays.length} play${plays.length > 1 ? 's' : ''} added to game plan`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const canAdd = selectedPlanId && (selectedSectionId || newSectionType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Add to Game Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Plays being added */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Plays</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {plays.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm truncate">{p.play_name}</span>
                  {p.short_name && <code className="text-[10px] text-muted-foreground">{p.short_name}</code>}
                </div>
              ))}
            </div>
            {practicedDay && (
              <Badge variant="secondary" className="mt-2 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                Practiced: {practicedDay}
              </Badge>
            )}
          </div>

          {/* Game plan selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Game Plan</label>
            <Select value={selectedPlanId} onValueChange={v => { setSelectedPlanId(v); setSelectedSectionId(''); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select game plan..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plans.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No game plans yet — create one in Game Planning.</p>
            )}
          </div>

          {/* Section selector */}
          {selectedPlanId && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Section</label>
              <Select value={selectedSectionId || newSectionType}
                onValueChange={v => {
                  if (sections.find(s => s.id === v)) {
                    setSelectedSectionId(v); setNewSectionType('');
                  } else {
                    setNewSectionType(v); setSelectedSectionId('');
                  }
                }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select or create section..." />
                </SelectTrigger>
                <SelectContent>
                  {sections.length > 0 && sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.section_name}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Create new section
                  </div>
                  {SECTION_TYPES.map(([v, l]) => (
                    <SelectItem key={`new-${v}`} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => addMutation.mutate()}
            disabled={!canAdd || addMutation.isPending}
            className="w-full gap-2"
          >
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add to Game Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}