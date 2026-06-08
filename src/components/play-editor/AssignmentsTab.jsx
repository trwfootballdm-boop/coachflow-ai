import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const POSITIONS = [
  'QB','RB','FB','TB','WB','HB',
  'WR','TE','FL','SE',
  'LT','LG','C','RG','RT',
  'DE','DT','NG','NT',
  'MLB','ILB','OLB','WLB','SLB',
  'CB','LCB','RCB','SS','FS','S',
  'K','P','LS','KR','PR',
];

const ASSIGNMENT_TYPES = [
  'block','kickout','pull','lead','trap','double','combo',
  'route','curl','flat','wheel','seam','post','corner','out','in','go','cross',
  'handoff','pitch','fake','pass','check_release',
  'blitz','contain','gap','pursuit','fill','squeeze','spill',
  'read','option_keep','option_pitch',
];

const BLANK_ROW = { position_code: '', assignment_type: '', assignment_text: '', aiming_point: '', read_key: '', motion_flag: false, order_index: 0 };

function AssignmentRow({ row, index, onUpdate, onDelete, total }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn("border border-border rounded-xl overflow-hidden transition-all", expanded ? "bg-card" : "bg-card hover:bg-secondary/30")}>
      {/* Compact row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/50">
          <GripVertical className="h-4 w-4" />
          <span className="text-xs font-mono w-4 text-center">{index + 1}</span>
        </div>
        
        {/* Position */}
        <Select value={row.position_code} onValueChange={(v) => onUpdate('position_code', v)}>
          <SelectTrigger className="w-[90px] h-8 text-xs bg-secondary/50 border-0 font-mono font-bold">
            <SelectValue placeholder="POS" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map(p => <SelectItem key={p} value={p} className="font-mono">{p}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Assignment type */}
        <Select value={row.assignment_type} onValueChange={(v) => onUpdate('assignment_type', v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary/50 border-0">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g,' ')}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Main assignment text */}
        <Input
          value={row.assignment_text}
          onChange={(e) => onUpdate('assignment_text', e.target.value)}
          placeholder="Describe the assignment..."
          className="flex-1 h-8 text-sm bg-secondary/50 border-0 min-w-0"
        />

        {/* Motion flag */}
        {row.motion_flag && (
          <Badge variant="secondary" className="text-[10px] shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">Motion</Badge>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-secondary/10">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aiming Point</label>
            <Input value={row.aiming_point || ''} onChange={(e) => onUpdate('aiming_point', e.target.value)}
              placeholder="e.g. Outside hip of guard" className="mt-1 h-8 text-sm bg-secondary/50 border-0" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Read Key</label>
            <Input value={row.read_key || ''} onChange={(e) => onUpdate('read_key', e.target.value)}
              placeholder="e.g. First down lineman" className="mt-1 h-8 text-sm bg-secondary/50 border-0" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <Switch checked={row.motion_flag || false} onCheckedChange={(v) => onUpdate('motion_flag', v)} />
            <label className="text-sm font-medium">Pre-snap motion involved</label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssignmentsTab({ playId }) {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', playId],
    queryFn: () => playId ? base44.entities.PlayAssignment.filter({ play_id: playId }) : Promise.resolve([]),
    enabled: !!playId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlayAssignment.create({ ...data, play_id: playId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', playId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlayAssignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', playId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayAssignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', playId] });
      toast.success('Assignment removed');
    },
  });

  const handleUpdate = (assignment, field, value) => {
    updateMutation.mutate({ id: assignment.id, data: { [field]: value } });
  };

  const handleAdd = () => {
    if (!playId) { toast.error('Save the play first to add assignments.'); return; }
    createMutation.mutate({ ...BLANK_ROW, order_index: assignments.length });
  };

  const sorted = [...assignments].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Save the play first</p>
        <p className="text-xs text-muted-foreground mt-1">Assignments can be added after the play is saved.</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Column headers */}
      {sorted.length > 0 && (
        <div className="flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="w-[26px]" />
          <div className="w-[90px]">Position</div>
          <div className="w-[110px]">Type</div>
          <div className="flex-1">Assignment</div>
        </div>
      )}

      {/* Assignment rows */}
      <div className="space-y-2">
        {sorted.map((row, i) => (
          <AssignmentRow
            key={row.id}
            row={row}
            index={i}
            total={sorted.length}
            onUpdate={(field, val) => handleUpdate(row, field, val)}
            onDelete={() => deleteMutation.mutate(row.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl">
          <p className="text-sm font-medium text-muted-foreground">No assignments yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add position-by-position assignments to build your play.</p>
        </div>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={createMutation.isPending}
        className="gap-2 rounded-xl border-dashed w-full sm:w-auto"
      >
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add Assignment
      </Button>

      {sorted.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {sorted.length} assignment{sorted.length !== 1 ? 's' : ''} · Click any row to expand aiming point and read key details
        </p>
      )}
    </div>
  );
}