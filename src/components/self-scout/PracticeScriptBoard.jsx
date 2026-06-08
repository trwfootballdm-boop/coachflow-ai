import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CalendarRange,
  Clock3,
  GripVertical,
  ListTodo,
  MoveRight,
  Route,
  TriangleAlert,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
};

export default function PracticeScriptBoard({
  plan,
  onChange,
  onOpenEntry,
}) {
  const [selectedDay, setSelectedDay] = useState('monday');

  const activeDay = useMemo(
    () => plan.days.find((day) => day.day === selectedDay) ?? plan.days[0],
    [plan.days, selectedDay]
  );

  const totals = useMemo(() => {
    const allPeriods = plan.days.flatMap((day) => day.periods);
    const totalMinutes = allPeriods.reduce((sum, period) => sum + period.durationMinutes, 0);
    const totalEntries = allPeriods.reduce((sum, period) => sum + period.entries.length, 0);

    return {
      totalMinutes,
      totalEntries,
      unscheduled: plan.unscheduled.length,
      totalDays: plan.days.length,
    };
  }, [plan]);

  const moveEntry = (fromDay, fromPeriodId, entryId, direction) => {
    if (!onChange) return;

    const next = {
      ...plan,
      days: plan.days.map((day) => {
        if (day.day !== fromDay) return day;

        return {
          ...day,
          periods: day.periods.map((period) => {
            if (period.id !== fromPeriodId) return period;

            const currentIndex = period.entries.findIndex((entry) => entry.id === entryId);
            if (currentIndex < 0) return period;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= period.entries.length) return period;

            const nextEntries = [...period.entries];
            const [moved] = nextEntries.splice(currentIndex, 1);
            nextEntries.splice(targetIndex, 0, moved);

            return {
              ...period,
              entries: nextEntries,
            };
          }),
        };
      }),
    };

    onChange(next);
  };

  const moveToNextPeriod = (fromDay, fromPeriodId, entryId) => {
    if (!onChange) return;

    const sourceDay = plan.days.find((day) => day.day === fromDay);
    if (!sourceDay) return;

    const periodIndex = sourceDay.periods.findIndex((period) => period.id === fromPeriodId);
    if (periodIndex < 0 || periodIndex === sourceDay.periods.length - 1) return;

    const sourcePeriod = sourceDay.periods[periodIndex];
    const targetPeriod = sourceDay.periods[periodIndex + 1];
    const entry = sourcePeriod.entries.find((item) => item.id === entryId);
    if (!entry) return;

    const next = {
      ...plan,
      days: plan.days.map((day) => {
        if (day.day !== fromDay) return day;

        return {
          ...day,
          periods: day.periods.map((period) => {
            if (period.id === sourcePeriod.id) {
              return {
                ...period,
                entries: period.entries.filter((item) => item.id !== entryId),
              };
            }

            if (period.id === targetPeriod.id) {
              return {
                ...period,
                entries: [...period.entries, entry],
              };
            }

            return period;
          }),
        };
      }),
    };

    onChange(next);
  };

  const placeUnscheduled = (priorityId, targetDay, targetPeriodId) => {
    if (!onChange) return;

    const pending = plan.unscheduled.find((item) => item.id === priorityId);
    if (!pending) return;

    const newEntry = {
      id: `entry-${priorityId}`,
      title: pending.title,
      priorityId: pending.id,
      source: pending.source,
      emphasis: 'review',
      coachingPoints: pending.notes ? [pending.notes] : ['Manually placed from unscheduled list.'],
      linkedPlayIds: pending.linkedPlayIds || [],
      notes: pending.notes,
    };

    const next = {
      ...plan,
      unscheduled: plan.unscheduled.filter((item) => item.id !== priorityId),
      days: plan.days.map((day) => {
        if (day.day !== targetDay) return day;
        return {
          ...day,
          periods: day.periods.map((period) =>
            period.id === targetPeriodId
              ? { ...period, entries: [...period.entries, newEntry] }
              : period
          ),
        };
      }),
    };

    onChange(next);
  };

  if (!activeDay) {
    return null;
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Practice script
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Weekly board
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organized by day, period, and scripted emphasis.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          Practice workflow
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-5 py-4">
        <StatCard
          label="Days"
          value={String(totals.totalDays)}
          icon={CalendarRange}
        />
        <StatCard
          label="Minutes"
          value={String(totals.totalMinutes)}
          icon={Clock3}
        />
        <StatCard
          label="Entries"
          value={String(totals.totalEntries)}
          icon={ListTodo}
        />
        <StatCard
          label="Unscheduled"
          value={String(totals.unscheduled)}
          icon={TriangleAlert}
          tone={totals.unscheduled > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {plan.days.map((day) => (
            <button
              key={day.day}
              type="button"
              onClick={() => setSelectedDay(day.day)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedDay === day.day
                  ? 'border-primary/30 bg-primary/12 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {DAY_LABELS[day.day]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-y-auto border-r border-border p-5">
          <DayHeader day={activeDay.day} focus={activeDay.focus} />

          <div className="mt-4 space-y-4">
            {activeDay.periods.map((period, periodIndex) => (
              <div
                key={period.id}
                className="rounded-2xl border border-border bg-background/40"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {period.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {period.durationMinutes} min · {formatPeriodType(period.periodType)}
                    </div>
                  </div>

                  <div className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                    {period.entries.length} entries
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  {period.entries.length ? (
                    period.entries.map((entry, entryIndex) => (
                      <PracticeEntryCard
                        key={entry.id}
                        entry={entry}
                        canMoveUp={entryIndex > 0}
                        canMoveDown={entryIndex < period.entries.length - 1}
                        canMoveNextPeriod={periodIndex < activeDay.periods.length - 1}
                        onOpen={() => onOpenEntry?.(entry, period)}
                        onMoveUp={() => moveEntry(activeDay.day, period.id, entry.id, 'up')}
                        onMoveDown={() => moveEntry(activeDay.day, period.id, entry.id, 'down')}
                        onMoveNextPeriod={() =>
                          moveToNextPeriod(activeDay.day, period.id, entry.id)
                        }
                      />
                    ))
                  ) : (
                    <EmptyPeriod />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto p-5">
          <SideTitle
            icon={ClipboardCheck}
            title="Week summary"
            subtitle="Quick coaching context for the script"
          />

          <div className="mt-3 space-y-2">
            {plan.weekSummary.length ? (
              plan.weekSummary.map((line, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
                >
                  {line}
                </div>
              ))
            ) : (
              <EmptySidebarBlock text="No weekly summary yet." />
            )}
          </div>

          <div className="mt-6">
            <SideTitle
              icon={TriangleAlert}
              title="Unscheduled items"
              subtitle="Manual placement for anything not yet assigned"
            />

            <div className="mt-3 space-y-2">
              {plan.unscheduled.length ? (
                plan.unscheduled.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-background/40 p-3"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatPriority(item.priority)} · {formatSource(item.source)}
                    </div>
                    {item.notes ? (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.notes}
                      </p>
                    ) : null}

                    <div className="mt-3 space-y-2">
                      <label className="block">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Place into
                        </div>
                        <select
                          className={inputClass}
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            const [day, periodId] = value.split('::');
                            placeUnscheduled(item.id, day, periodId);
                            e.currentTarget.value = '';
                          }}
                        >
                          <option value="">Select day / period</option>
                          {plan.days.map((day) =>
                            day.periods.map((period) => (
                              <option
                                key={`${day.day}-${period.id}`}
                                value={`${day.day}::${period.id}`}
                              >
                                {DAY_LABELS[day.day]} · {period.label}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <EmptySidebarBlock text="Everything is currently scheduled." />
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DayHeader({ day, focus }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {DAY_LABELS[day]}
      </div>
      <h3 className="mt-1 text-lg font-semibold text-foreground">
        {focus}
      </h3>
    </div>
  );
}

function PracticeEntryCard({
  entry,
  canMoveUp,
  canMoveDown,
  canMoveNextPeriod,
  onOpen,
  onMoveUp,
  onMoveDown,
  onMoveNextPeriod,
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="pt-0.5 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="text-left">
            <div className="text-sm font-semibold text-foreground">
              {entry.title}
            </div>
          </button>

          <div className="mt-2 flex flex-wrap gap-2">
            <Tag tone="neutral" label={formatEmphasis(entry.emphasis)} />
            <Tag tone="neutral" label={formatSource(entry.source)} />
            {entry.linkedPlayIds.length ? (
              <Tag tone="neutral" label={`${entry.linkedPlayIds.length} plays`} />
            ) : null}
          </div>

          {entry.notes ? (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {entry.notes}
            </p>
          ) : null}

          {entry.coachingPoints.length ? (
            <ul className="mt-3 space-y-1">
              {entry.coachingPoints.slice(0, 3).map((point, index) => (
                <li key={index} className="text-xs leading-5 text-muted-foreground">
                  - {point}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className={smallButtonClass(canMoveUp)}
        >
          Up
        </button>
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className={smallButtonClass(canMoveDown)}
        >
          Down
        </button>
        <button
          type="button"
          disabled={!canMoveNextPeriod}
          onClick={onMoveNextPeriod}
          className={smallButtonClass(canMoveNextPeriod)}
        >
          <MoveRight className="h-3.5 w-3.5" />
          Next period
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            tone === 'warning'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'bg-accent/50 text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SideTitle({ icon: Icon, title, subtitle }) {
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

function Tag({ label, tone }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tone === 'neutral' && 'bg-accent text-accent-foreground'
      )}
    >
      {label}
    </span>
  );
}

function EmptyPeriod() {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      No scripted entries in this period.
    </div>
  );
}

function EmptySidebarBlock({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatPeriodType(type) {
  switch (type) {
    case 'indy':
      return 'Individual';
    case 'group':
      return 'Group';
    case 'inside_run':
      return 'Inside Run';
    case '7on7':
      return '7-on-7';
    case 'team':
      return 'Team';
    case 'red_zone':
      return 'Red Zone';
    case 'third_down':
      return '3rd Down';
    case 'two_minute':
      return '2-Minute';
    case 'backed_up':
      return 'Backed Up';
    case 'walkthrough':
      return 'Walkthrough';
    case 'special':
      return 'Special';
    default:
      return type;
  }
}

function formatSource(source) {
  switch (source) {
    case 'self_scout':
      return 'Self Scout';
    case 'opponent_scout':
      return 'Opponent';
    case 'staff_note':
      return 'Staff Note';
    case 'gameplan':
      return 'Game Plan';
    default:
      return source;
  }
}

function formatEmphasis(emphasis) {
  switch (emphasis) {
    case 'install':
      return 'Install';
    case 'rep':
      return 'Rep';
    case 'review':
      return 'Review';
    case 'polish':
      return 'Polish';
    default:
      return emphasis;
  }
}

function formatPriority(priority) {
  if (priority === 'high') return 'High priority';
  if (priority === 'medium') return 'Medium priority';
  return 'Low priority';
}

function smallButtonClass(enabled) {
  return cn(
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
    enabled
      ? 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      : 'cursor-not-allowed border-border/60 text-muted-foreground/50'
  );
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20';