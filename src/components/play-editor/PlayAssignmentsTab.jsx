import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Users, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const POSITIONS_OFF = ['QB', 'RB', 'FB', 'WB', 'TB', 'TE', 'WR', 'X', 'Y', 'Z', 'LT', 'LG', 'C', 'RG', 'RT'];
const POSITIONS_DEF = ['DE', 'DT', 'NG', 'MLB', 'ILB', 'OLB', 'WILL', 'MIKE', 'SAM', 'CB', 'FS', 'SS', 'NB'];
const ALL_POSITIONS = [...POSITIONS_OFF, ...POSITIONS_DEF];

const ASSIGNMENT_TYPES = [
  'block', 'kickout', 'pull', 'reach', 'down', 'seal', 'double_team',
  'fake', 'route', 'handoff', 'carry', 'lead_block',
  'blitz', 'contain', 'gap_fill', 'zone_drop', 'man_coverage', 'press',
  'rush', 'stunt', 'read_key',
];

const EMPTY_ASSIGNMENT = {
  position_code: '',
  assignment_type: '',
  assignment_text: '',
  aiming_point: '',
  read_key: '',
  motion_flag: false,
  order_index: 0,
};

function AssignmentRow({ assignment, index, onUpdate, onDelete, isExpanded, onToggle }) {
  const u = (field, val) => onUpdate({ ...assignment, [field]: val });

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden transition-all", isExpanded && "ring-1 ring-primary/20")}>
      {/* Collapsed row header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 bg-card cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={onToggle}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <span className="font-mono text-xs font-bold w-10 shrink-0 text-primary">
          {assignment.position_code || <span className="text-muted-foreground">POS</span>}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 capitalize w-24 hidden sm:block">
          {assignment.assignment_type?.replace(/_/g, ' ') || '—'}
        </span>
        <span className="flex-1 text-sm truncate text-foreground/80">
          {assignment.assignment_text || <span className="text-muted-foreground/50 italic">No assignment text</span>}
        </span>
        {assignment.motion_flag && (
          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium shrink-0">Motion</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded edit area */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/20 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Position</label>
              <Select value={assignment.position_code} onValueChange={v => u('position_code', v)}>
                <SelectTrigger className="bg-card border-border h-8 text-xs">
                  <SelectValue placeholder="Pos..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Offense</div>
                  {POSITIONS_OFF.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Defense</div>
                  {POSITIONS_DEF.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Assignment Type</label>
              <Select value={assignment.assignment_type} onValueChange={v => u('assignment_type', v)}>
                <SelectTrigger className="bg-card border-border h-8 text-xs">
                  <SelectValue placeholder="Type..." />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={assignment.motion_flag || false} onCheckedChange={v => u('motion_flag', v)} />
              <span className="text-xs text-muted-foreground">Pre-snap motion</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Assignment Description</label>
            <Input value={assignment.assignment_text || ''} onChange={e => u('assignment_text', e.target.value)}
              placeholder="e.g. Down block the 3-tech to the play-side gap..."
              className="bg-card border-border h-9 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Aiming Point</label>
              <Input value={assignment.aiming_point || ''} onChange={e => u('aiming_point', e.target.value)}
                placeholder="e.g. outside hip of guard, front pylon"
                className="bg-card border-border h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Read Key</label>
              <Input value={assignment.read_key || ''} onChange={e => u('read_key', e.target.value)}
                placeholder="e.g. safety alignment, end's gap"
                className="bg-card border-border h-9 text-sm" />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5 text-xs h-7"
              onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayAssignmentsTab({ playId }) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [localAssignments, setLocalAssignments] = useState(null);

  const { data: savedAssignments = [], isLoading } = useQuery({
    queryKey: ['assignments', playId],
    queryFn: () => playId ? base44.entities.PlayAssignment.filter({ play_id: playId }, 'order_index') : Promise.resolve([]),
    enabled: !!playId,
    onSuccess: (data) => { if (localAssignments === null) setLocalAssignments(data); },
  });

  const assignments = localAssignments ?? savedAssignments;

  const saveMutation = useMutation({
    mutationFn: async (list) => {
      const existing = savedAssignments.map(a => a.id);
      const toDelete = existing.filter(id => !list.find(a => a.id === id));
      await Promise.all(toDelete.map(id => base44.entities.PlayAssignment.delete(id)));
      await Promise.all(list.map((a, i) => {
        const payload = { ...a, play_id: playId, order_index: i };
        if (a.id) return base44.entities.PlayAssignment.update(a.id, payload);
        return base44.entities.PlayAssignment.create(payload);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', playId] });
      toast.success('Assignments saved');
    },
  });

  const addRow = () => {
    const newA = { ...EMPTY_ASSIGNMENT, _tempId: Date.now(), order_index: assignments.length };
    const updated = [...assignments, newA];
    setLocalAssignments(updated);
    setExpandedId(newA._tempId);
  };

  const updateRow = (index, data) => {
    const updated = assignments.map((a, i) => i === index ? data : a);
    setLocalAssignments(updated);
  };

  const deleteRow = (index) => {
    setLocalAssignments(assignments.filter((_, i) => i !== index));
  };

  const getRowId = (a) => a.id || a._tempId;

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Save the play first to manage assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-display font-bold">Player Assignments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{assignments.length} positions assigned</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8"
            onClick={() => saveMutation.mutate(assignments)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Assignments'}
          </Button>
          <Button size="sm" className="gap-1.5 rounded-lg text-xs h-8" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" /> Add Position
          </Button>
        </div>
      </div>

      {/* Position quick-add chips */}
      <div className="p-3 bg-secondary/30 rounded-lg">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Add Position</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_POSITIONS.filter(p => !assignments.find(a => a.position_code === p)).map(pos => (
            <button key={pos} onClick={() => {
              const newA = { ...EMPTY_ASSIGNMENT, position_code: pos, _tempId: Date.now(), order_index: assignments.length };
              const updated = [...assignments, newA];
              setLocalAssignments(updated);
              setExpandedId(newA._tempId);
            }}
              className="text-xs px-2 py-1 rounded-md bg-card border border-border font-mono font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all">
              {pos}
            </button>
          ))}
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
          <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No assignments yet. Add positions above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a, i) => (
            <AssignmentRow
              key={getRowId(a)}
              assignment={a}
              index={i}
              onUpdate={(data) => updateRow(i, data)}
              onDelete={() => deleteRow(i)}
              isExpanded={expandedId === getRowId(a)}
              onToggle={() => setExpandedId(expandedId === getRowId(a) ? null : getRowId(a))}
            />
          ))}
        </div>
      )}
    </div>
  );
}