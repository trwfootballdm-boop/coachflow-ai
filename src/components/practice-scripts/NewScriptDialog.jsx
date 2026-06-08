import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRACTICE_DAY_PRESETS = [
  { value: 'monday_install', label: 'Monday Install', description: 'Introduce new plays and schemes' },
  { value: 'tuesday_team', label: 'Tuesday Team', description: 'Full team reps at practice speed' },
  { value: 'wednesday_polish', label: 'Wednesday Polish', description: 'Fix mistakes, sharpen execution' },
  { value: 'thursday_walkthrough', label: 'Thursday Walkthrough', description: 'Mental reps and review' },
  { value: 'custom', label: 'Custom', description: 'Define your own practice focus' },
];

export default function NewScriptDialog({ open, onClose, teamId, onCreated }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', practice_day: '', script_date: '', focus_area: '', coaching_emphasis: '',
  });

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PracticeScript.create({ ...data, team_id: teamId }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      onCreated(created.id);
      setForm({ title: '', practice_day: '', script_date: '', focus_area: '', coaching_emphasis: '' });
    },
  });

  const selectPreset = (preset) => {
    u('practice_day', preset.value);
    if (!form.title) u('title', preset.label);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">New Practice Script</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Practice day presets */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Practice Day</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRACTICE_DAY_PRESETS.map(preset => (
                <button key={preset.value} onClick={() => selectPreset(preset)}
                  className={cn(
                    "flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-all text-sm",
                    form.practice_day === preset.value
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/20 hover:bg-secondary/30 text-muted-foreground"
                  )}>
                  <div>
                    <p className="font-medium text-sm">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Script Title</Label>
            <Input value={form.title} onChange={e => u('title', e.target.value)}
              placeholder="e.g. Week 3 Tuesday Team Period" className="bg-secondary/50 border-0" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Practice Date</Label>
              <Input type="date" value={form.script_date} onChange={e => u('script_date', e.target.value)}
                className="bg-secondary/50 border-0" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Focus Area</Label>
              <Input value={form.focus_area} onChange={e => u('focus_area', e.target.value)}
                placeholder="e.g. Red Zone, Install" className="bg-secondary/50 border-0" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Coaching Emphasis</Label>
            <Input value={form.coaching_emphasis} onChange={e => u('coaching_emphasis', e.target.value)}
              placeholder="e.g. Finishing blocks, mesh point" className="bg-secondary/50 border-0" />
          </div>

          <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="w-full gap-2 rounded-xl">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Script
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}