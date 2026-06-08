import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Target,
  Tag,
  Move,
  Film,
  ClipboardList,
  TrendingDown,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ACTION_TYPE_ICONS = {
  add_counter: Target,
  reduce_tendency: TrendingDown,
  install_tag: Tag,
  add_motion: Move,
  practice_emphasis: ClipboardList,
  callsheet_note: AlertTriangle,
  review_film: Film,
};

const ACTION_TYPE_LABELS = {
  add_counter: 'Add Counter Play',
  reduce_tendency: 'Reduce Tendency',
  install_tag: 'Install Tag',
  add_motion: 'Add Motion',
  practice_emphasis: 'Practice Emphasis',
  callsheet_note: 'Call Sheet Note',
  review_film: 'Review Film',
};

export default function ScoutActionItems({ actions = [], onUpdateActions }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);

  const handleDelete = (id) => {
    onUpdateActions?.(actions.filter((a) => a.id !== id));
  };

  const handleComplete = (id) => {
    onUpdateActions?.(
      actions.map((a) =>
        a.id === id ? { ...a, status: a.status === 'completed' ? 'open' : 'completed' } : a
      )
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Action Items</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Action
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Action Item</DialogTitle>
            </DialogHeader>
            <ActionForm
              onSubmit={(action) => {
                onUpdateActions?.([...actions, action]);
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {actions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
              <Target className="h-4.5 w-4.5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">No action items</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground text-center">
              Create action items to address tendencies and improve your game planning.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onDelete={() => handleDelete(action.id)}
              onComplete={() => handleComplete(action.id)}
              onEdit={() => setEditingAction(action)}
            />
          ))}
        </div>
      )}

      {editingAction && (
        <Dialog open={!!editingAction} onOpenChange={() => setEditingAction(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Action Item</DialogTitle>
            </DialogHeader>
            <ActionForm
              initialData={editingAction}
              onSubmit={(updated) => {
                onUpdateActions?.(
                  actions.map((a) => (a.id === updated.id ? updated : a))
                );
                setEditingAction(null);
              }}
              onCancel={() => setEditingAction(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ActionCard({ action, onDelete, onComplete, onEdit }) {
  const Icon = ACTION_TYPE_ICONS[action.actionType] || Target;
  const isCompleted = action.status === 'completed';

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background/40 p-3 transition-colors",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="mt-0.5 text-muted-foreground hover:text-primary"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/50 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {action.summary}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="h-5 text-xs">
              {ACTION_TYPE_LABELS[action.actionType]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-xs",
                action.priority === 'high' && "border-red-500/30 text-red-700 dark:text-red-300",
                action.priority === 'medium' && "border-amber-500/30 text-amber-700 dark:text-amber-300",
                action.priority === 'low' && "border-blue-500/30 text-blue-700 dark:text-blue-300"
              )}
            >
              {action.priority}
            </Badge>
            {action.sourceLabel && (
              <span className="text-muted-foreground">
                Source: <span className="font-medium text-foreground">{action.sourceLabel}</span>
              </span>
            )}
            {action.owner && (
              <span className="text-muted-foreground">
                Owner: <span className="font-medium text-foreground">{action.owner}</span>
              </span>
            )}
          </div>

          {action.notes && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {action.notes}
            </p>
          )}

          {action.linkedPlayIds && action.linkedPlayIds.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Linked plays: {action.linkedPlayIds.length}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionForm({ initialData, onSubmit, onCancel }) {
  const [actionType, setActionType] = useState(initialData?.actionType || 'add_counter');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [sourceLabel, setSourceLabel] = useState(initialData?.sourceLabel || '');
  const [owner, setOwner] = useState(initialData?.owner || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summary.trim()) return;

    onSubmit({
      id: initialData?.id || `action_${Date.now()}`,
      sourceLabel,
      actionType,
      summary,
      priority,
      owner,
      notes,
      linkedPlayIds: initialData?.linkedPlayIds || [],
      status: initialData?.status || 'open',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Summary</Label>
        <Input
          placeholder="Brief description of the action"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Source</Label>
          <Input
            placeholder="e.g., 3rd & Medium tendency"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Owner</Label>
        <Input
          placeholder="Person responsible"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional context, implementation details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Save Changes' : 'Create Action'}
        </Button>
      </div>
    </form>
  );
}