import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Filter,
  Plus,
  Target,
  Wand2,
} from 'lucide-react';

const COLUMNS = [
  { key: 'new', label: 'New' },
  { key: 'planned', label: 'Planned' },
  { key: 'repped', label: 'Repped' },
  { key: 'ready', label: 'Ready' },
  { key: 'done', label: 'Done' },
];

const DEFAULT_PERIOD_OPTIONS = [
  'Indy',
  'Pod',
  'Group',
  'Inside Run',
  '7-on-7',
  'Team',
  'Red Zone',
  '3rd Down',
  '2-Minute',
  'Walkthrough',
];

function makeItemId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `priority-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankItem() {
  return {
    id: makeItemId(),
    title: '',
    source: 'self_scout',
    category: 'practice',
    priority: 'medium',
    status: 'new',
    owner: '',
    linkedPlayIds: [],
    linkedActionId: '',
    notes: '',
    periods: [],
    createdAt: new Date().toISOString(),
  };
}

export default function WeeklyPriorityBoard({
  items,
  weekLabel = 'This Week',
  onChange,
  onCreateItem,
  onOpenItem,
}) {
  const [draft, setDraft] = useState(createBlankItem());
  const [sourceFilter, setSourceFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (sourceFilter === 'all') return items;
    return items.filter((item) => item.source === sourceFilter);
  }, [items, sourceFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const item of filteredItems) {
      map.get(item.status)?.push(item);
    }
    return map;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const high = items.filter((i) => i.priority === 'high').length;
    const ready = items.filter((i) => i.status === 'ready').length;
    const done = items.filter((i) => i.status === 'done').length;
    return { total, high, ready, done };
  }, [items]);

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const togglePeriod = (period) => {
    setDraft((prev) => {
      const current = prev.periods || [];
      const next = current.includes(period)
        ? current.filter((p) => p !== period)
        : [...current, period];
      return { ...prev, periods: next };
    });
  };

  const resetDraft = () => setDraft(createBlankItem());

  const commitDraft = () => {
    if (!draft.title.trim()) return;

    const nextItem = {
      ...draft,
      title: draft.title.trim(),
      owner: draft.owner?.trim() || '',
      notes: draft.notes?.trim() || '',
      linkedActionId: draft.linkedActionId?.trim() || '',
    };

    onCreateItem?.(nextItem);
    onChange?.([...items, nextItem]);
    resetDraft();
  };

  const moveItem = (itemId, status) => {
    const next = items.map((item) => (item.id === itemId ? { ...item, status } : item));
    onChange?.(next);
  };

  const cyclePriority = (item) => {
    const order = ['low', 'medium', 'high'];
    const currentIndex = order.indexOf(item.priority);
    const nextPriority = order[(currentIndex + 1) % order.length];
    const next = items.map((entry) =>
      entry.id === item.id ? { ...entry, priority: nextPriority } : entry
    );
    onChange?.(next);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Weekly priorities
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Game plan execution board
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {weekLabel} · move findings from self-scout into install, practice, and call-sheet work
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Week workflow
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-5 py-4">
        <StatCard label="Total items" value={String(stats.total)} icon={ClipboardList} />
        <StatCard label="High priority" value={String(stats.high)} icon={AlertTriangle} />
        <StatCard label="Ready" value={String(stats.ready)} icon={Target} />
        <StatCard label="Done" value={String(stats.done)} icon={CheckCircle2} />
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Source filter
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={sourceFilter === 'all'}
            onClick={() => setSourceFilter('all')}
            label="All"
          />
          <FilterChip
            active={sourceFilter === 'self_scout'}
            onClick={() => setSourceFilter('self_scout')}
            label="Self scout"
          />
          <FilterChip
            active={sourceFilter === 'opponent_scout'}
            onClick={() => setSourceFilter('opponent_scout')}
            label="Opponent scout"
          />
          <FilterChip
            active={sourceFilter === 'gameplan'}
            onClick={() => setSourceFilter('gameplan')}
            label="Game plan"
          />
          <FilterChip
            active={sourceFilter === 'staff_note'}
            onClick={() => setSourceFilter('staff_note')}
            label="Staff note"
          />
        </div>
      </div>

      <div className="border-b border-border px-5 py-5">
        <SectionTitle
          icon={Wand2}
          title="Add weekly priority"
          subtitle="Create a focused item and tie it to install, practice periods, or the call sheet."
        />

        <div className="mt-4 grid grid-cols-12 gap-3">
          <Field label="Title" className="col-span-5">
            <input
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Install Trips Right 2nd-and-medium run counter"
              className={inputClass}
            />
          </Field>

          <Field label="Owner" className="col-span-2">
            <input
              value={draft.owner || ''}
              onChange={(e) => updateDraft({ owner: e.target.value })}
              placeholder="OC"
              className={inputClass}
            />
          </Field>

          <Field label="Source" className="col-span-2">
            <select
              value={draft.source}
              onChange={(e) => updateDraft({ source: e.target.value })}
              className={inputClass}
            >
              <option value="self_scout">Self scout</option>
              <option value="opponent_scout">Opponent scout</option>
              <option value="gameplan">Game plan</option>
              <option value="staff_note">Staff note</option>
            </select>
          </Field>

          <Field label="Category" className="col-span-2">
            <select
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
              className={inputClass}
            >
              <option value="install">Install</option>
              <option value="practice">Practice</option>
              <option value="callsheet">Call sheet</option>
              <option value="personnel">Personnel</option>
              <option value="film">Film</option>
            </select>
          </Field>

          <Field label="Priority" className="col-span-1">
            <select
              value={draft.priority}
              onChange={(e) => updateDraft({ priority: e.target.value })}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
          </Field>

          <Field label="Notes" className="col-span-8">
            <input
              value={draft.notes || ''}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder="Tie to Tuesday team + Wednesday red zone. Add note to call sheet."
              className={inputClass}
            />
          </Field>

          <Field label="Linked action ID" className="col-span-2">
            <input
              value={draft.linkedActionId || ''}
              onChange={(e) => updateDraft({ linkedActionId: e.target.value })}
              placeholder="action-24"
              className={inputClass}
            />
          </Field>

          <Field label="Status" className="col-span-2">
            <select
              value={draft.status}
              onChange={(e) => updateDraft({ status: e.target.value })}
              className={inputClass}
            >
              <option value="new">New</option>
              <option value="planned">Planned</option>
              <option value="repped">Repped</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Attach practice periods
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PERIOD_OPTIONS.map((period) => {
              const active = (draft.periods || []).includes(period);
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => togglePeriod(period)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/12 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {period}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={commitDraft}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add priority
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto p-5">
        <div className="grid min-w-[1100px] grid-cols-5 gap-4">
          {COLUMNS.map((column) => (
            <div
              key={column.key}
              className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-background/35"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-foreground">{column.label}</div>
                <div className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                  {grouped.get(column.key)?.length || 0}
                </div>
              </div>

              <div className="flex-1 space-y-3 p-3">
                {(grouped.get(column.key) || []).length ? (
                  grouped.get(column.key).map((item) => (
                    <PriorityCard
                      key={item.id}
                      item={item}
                      onMove={moveItem}
                      onCyclePriority={() => cyclePriority(item)}
                      onOpen={() => onOpenItem?.(item)}
                    />
                  ))
                ) : (
                  <EmptyLane label={`No ${column.label.toLowerCase()} items`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriorityCard({ item, onMove, onCyclePriority, onOpen }) {
  const nextStatus = getNextStatus(item.status);

  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="text-left"
        >
          <div className="text-sm font-semibold text-foreground">{item.title}</div>
        </button>

        <button
          type="button"
          onClick={onCyclePriority}
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
            priorityClass(item.priority)
          )}
        >
          {item.priority}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <MetaPill label={sourceLabel(item.source)} />
        <MetaPill label={categoryLabel(item.category)} />
        {item.owner ? <MetaPill label={`Owner: ${item.owner}`} /> : null}
      </div>

      {item.notes ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {item.notes}
        </p>
      ) : null}

      {(item.periods || []).length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.periods.map((period) => (
            <span
              key={period}
              className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-foreground"
            >
              {period}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <StatusIcon status={item.status} />
          {statusLabel(item.status)}
        </div>

        {nextStatus ? (
          <button
            type="button"
            onClick={() => onMove(item.id, nextStatus)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            Move to {statusLabel(nextStatus)}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground">Complete</span>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary/30 bg-primary/12 text-primary'
          : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/50 text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, className, children }) {
  return (
    <label className={cn('block', className)}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function MetaPill({ label }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </span>
  );
}

function EmptyLane({ label }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'ready') return <Target className="h-3.5 w-3.5" />;
  if (status === 'repped') return <ClipboardList className="h-3.5 w-3.5" />;
  if (status === 'planned') return <CalendarDays className="h-3.5 w-3.5" />;
  return <CircleDashed className="h-3.5 w-3.5" />;
}

function getNextStatus(status) {
  if (status === 'new') return 'planned';
  if (status === 'planned') return 'repped';
  if (status === 'repped') return 'ready';
  if (status === 'ready') return 'done';
  return null;
}

function statusLabel(status) {
  switch (status) {
    case 'new':
      return 'New';
    case 'planned':
      return 'Planned';
    case 'repped':
      return 'Repped';
    case 'ready':
      return 'Ready';
    case 'done':
      return 'Done';
  }
}

function sourceLabel(source) {
  switch (source) {
    case 'self_scout':
      return 'Self Scout';
    case 'opponent_scout':
      return 'Opponent';
    case 'staff_note':
      return 'Staff Note';
    case 'gameplan':
      return 'Game Plan';
  }
}

function categoryLabel(category) {
  switch (category) {
    case 'install':
      return 'Install';
    case 'practice':
      return 'Practice';
    case 'callsheet':
      return 'Call Sheet';
    case 'personnel':
      return 'Personnel';
    case 'film':
      return 'Film';
  }
}

function priorityClass(priority) {
  if (priority === 'high') {
    return 'bg-red-500/10 text-red-700 dark:text-red-300';
  }
  if (priority === 'medium') {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }
  return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20';