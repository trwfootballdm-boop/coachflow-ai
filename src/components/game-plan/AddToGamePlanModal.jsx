import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: 'openers', label: 'Openers' },
  { key: 'base_runs', label: 'Base Runs' },
  { key: 'base_passes', label: 'Base Passes' },
  { key: 'third_short', label: '3rd & Short' },
  { key: 'third_medium', label: '3rd & Medium' },
  { key: 'third_long', label: '3rd & Long' },
  { key: 'red_zone', label: 'Red Zone' },
  { key: 'goal_line', label: 'Goal Line' },
  { key: 'backed_up', label: 'Backed Up' },
  { key: 'two_point', label: '2-Point Plays' },
  { key: 'shots', label: 'Shot Plays' },
  { key: 'specials', label: 'Specials / Gadgets' },
  { key: 'two_minute', label: 'End of Half / 2-Min' },
  { key: 'four_minute', label: '4-Minute / Clock Kill' },
];

export default function AddToGamePlanModal({ open, onClose, teamId, plays, practicedDays = [] }) {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['gamePlans', teamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: teamId }, '-updated_date'),
    enabled: !!teamId && open,
  });

  const handleAdd = async () => {
    if (!selectedPlan || !selectedSection || plays.length === 0) return;
    setAdding(true);
    const existing = await base44.entities.GamePlanItem.filter({ game_plan_id: selectedPlan });
    const sectionItems = existing.filter(i => i.section_key === selectedSection);
    const baseIndex = sectionItems.length;

    await Promise.all(plays.map((play, i) => base44.entities.GamePlanItem.create({
      game_plan_id: selectedPlan,
      section_key: selectedSection,
      play_id: play.id,
      order_index: baseIndex + i,
      call_sheet_priority: 2,
      practiced_this_week: practicedDays.length > 0,
      practiced_days: practicedDays,
      included_in_weekly_plan: true,
    })));

    toast.success(`${plays.length} play${plays.length > 1 ? 's' : ''} added to game plan`);
    setAdding(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Add to Game Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Plays being added */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {plays.length} play{plays.length !== 1 ? 's' : ''} to add
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {plays.map(p => (
                <Badge key={p.id} variant="secondary" className="text-xs">{p.play_name || p.name}</Badge>
              ))}
            </div>
          </div>

          {/* Game plan selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Game Plan</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No game plans yet. Create one first.</p>
            ) : (
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select game plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                      {plan.game_date && <span className="text-muted-foreground ml-2 text-xs">· {format(new Date(plan.game_date), 'MMM d')}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Section selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Call Sheet Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select section..." />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {practicedDays.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
              <span>✓ Will be marked as <b>practiced</b> ({practicedDays.join(', ')})</span>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!selectedPlan || !selectedSection || adding || plays.length === 0}
            className="w-full gap-2"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add to Call Sheet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}