import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ClipboardList,
  Users,
  Film,
  BookOpen,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const SOURCE_ICONS = {
  self_scout: TrendingUp,
  opponent_scout: Film,
  staff_note: Users,
  gameplan: ClipboardList,
};

const SOURCE_LABELS = {
  self_scout: 'Self Scout',
  opponent_scout: 'Opponent Scout',
  staff_note: 'Staff Note',
  gameplan: 'Game Plan',
};

const CATEGORY_LABELS = {
  install: 'Install',
  practice: 'Practice',
  callsheet: 'Call Sheet',
  personnel: 'Personnel',
  film: 'Film',
};

const STATUS_COLORS = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  planned: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  repped: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  ready: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
  done: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
};

export default function WeeklyPriorityBoard({ items = [], onUpdateItems }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleDelete = (id) => {
    onUpdateItems?.(items.filter((i) => i.id !== id));
  };

  const handleUpdateStatus = (id, newStatus) => {
    onUpdateItems?.(
      items.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
  };

  const filteredItems = filterStatus === 'all'
    ? items
    : items.filter((i) => i.status === filterStatus);

  const stats = {
    new: items.filter((i) => i.status === 'new').length,
    planned: items.filter((i) => i.status === 'planned').length,
    repped: items.filter((i) => i.status === 'repped').length,
    ready: items.filter((i) => i.status === 'ready').length,
    done: items.filter((i) => i.status === 'done').length,
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Weekly Priorities</h3>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="repped">Repped</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Priority
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Weekly Priority</DialogTitle>
              </DialogHeader>
              <PriorityForm
                onSubmit={(item) => {
                  onUpdateItems?.([...items, item]);
                  setIsAddDialogOpen(false);
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <StatBadge label="New" count={stats.new} status="new" />
        <StatBadge label="Planned" count={stats.planned} status="planned" />
        <StatBadge label="Repped" count={stats.repped} status="repped" />
        <StatBadge label="Ready" count={stats.ready} status="ready" />
        <StatBadge label="Done" count={stats.done} status="done" />
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
              <ClipboardList className="h-4.5 w-4.5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">No priorities</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground text-center">
              Add weekly priorities to track your game planning focus areas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <PriorityCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
                onStatusChange={handleUpdateStatus}
                onEdit={() => setEditingItem(item)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Weekly Priority</DialogTitle>
            </DialogHeader>
            <PriorityForm
              initialData={editingItem}
              onSubmit={(updated) => {
                onUpdateItems?.(
                  items.map((i) => (i.id === updated.id ? updated : i))
                );
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatBadge({ label, count, status }) {
  return (
    <div className={cn(
      "rounded-xl border px-3 py-2.5 text-center",
      STATUS_COLORS[status]
    )}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold">{count}</div>
    </div>
  );
}

function PriorityCard({ item, onDelete, onStatusChange, onEdit }) {
  const SourceIcon = SOURCE_ICONS[item.source] || ClipboardList;

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/50 text-muted-foreground">
              <SourceIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {item.title}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="h-5 text-xs">
              {CATEGORY_LABELS[item.category]}
            </Badge>
            <Badge
              variant="outline"
              className={cn("h-5 text-xs", STATUS_COLORS[item.status])}
            >
              {item.status}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-xs",
                item.priority === 'high' && "border-red-500/30 text-red-700 dark:text-red-300",
                item.priority === 'medium' && "border-amber-500/30 text-amber-700 dark:text-amber-300",
                item.priority === 'low' && "border-blue-500/30 text-blue-700 dark:text-blue-300"
              )}
            >
              {item.priority}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Source: <span className="font-medium text-foreground">{SOURCE_LABELS[item.source]}</span>
            </span>
            {item.owner && (
              <span>
                Owner: <span className="font-medium text-foreground">{item.owner}</span>
              </span>
            )}
            {item.linkedPlayIds && item.linkedPlayIds.length > 0 && (
              <span>
                Linked: <span className="font-medium text-foreground">{item.linkedPlayIds.length} plays</span>
              </span>
            )}
          </div>

          {item.notes && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {item.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Select value={item.status} onValueChange={(v) => onStatusChange(item.id, v)}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="repped">Repped</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityForm({ initialData, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [source, setSource] = useState(initialData?.source || 'self_scout');
  const [category, setCategory] = useState(initialData?.category || 'install');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [status, setStatus] = useState(initialData?.status || 'new');
  const [owner, setOwner] = useState(initialData?.owner || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      id: initialData?.id || `priority_${Date.now()}`,
      title,
      source,
      category,
      priority,
      status,
      owner,
      notes,
      linkedPlayIds: initialData?.linkedPlayIds || [],
      linkedActionId: initialData?.linkedActionId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          placeholder="e.g., Install red zone play-action"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="repped">Repped</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Owner</Label>
          <Input
            placeholder="Name"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>
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
          {initialData ? 'Save Changes' : 'Create Priority'}
        </Button>
      </div>
    </form>
  );
}