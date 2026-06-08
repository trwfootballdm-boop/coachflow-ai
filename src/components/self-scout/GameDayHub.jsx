import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Flag,
  NotebookPen,
  Radio,
  ShieldAlert,
  Star,
  TimerReset,
  TrendingUp,
  Users,
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'menu', label: 'Call menu' },
  { key: 'log', label: 'Live log' },
  { key: 'adjust', label: 'Adjustments' },
];

export default function GameDayHub({
  opponent,
  weekLabel,
  callSheet,
  liveLog,
  adjustments,
  quickNotes,
  onOpenPlay,
  onOpenLogEntry,
}) {
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    const totalCalls = liveLog.length;
    const explosive = liveLog.filter((item) => item.explosive || item.result === 'explosive').length;
    const pressureSnaps = liveLog.filter((item) => item.pressureSeen).length;
    const totalYards = liveLog.reduce((sum, item) => sum + item.yards, 0);
    const positive = liveLog.filter((item) =>
      ['touchdown', 'explosive', 'positive'].includes(item.result)
    ).length;

    return {
      totalCalls,
      explosive,
      pressureSnaps,
      totalYards,
      efficiency: totalCalls > 0 ? Math.round((positive / totalCalls) * 100) : 0,
    };
  }, [liveLog]);

  const topSections = useMemo(() => {
    return callSheet
      .map((section) => {
        const used = liveLog.filter((entry) => entry.sectionBucket === section.bucket).length;
        return { ...section, used };
      })
      .sort((a, b) => b.used - a.used);
  }, [callSheet, liveLog]);

  const recentLog = useMemo(() => liveLog.slice(-8).reverse(), [liveLog]);

  const showMenu = filter === 'all' || filter === 'menu';
  const showLog = filter === 'all' || filter === 'log';
  const showAdjust = filter === 'all' || filter === 'adjust';

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Game day hub
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {weekLabel} · vs {opponent}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live play-calling, charting, and adjustment workflow in one screen.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          Live ops
        </div>
      </header>

      <div className="grid grid-cols-5 gap-3 border-b border-border px-5 py-4">
        <StatCard label="Calls logged" value={String(stats.totalCalls)} icon={ClipboardList} />
        <StatCard label="Total yards" value={String(stats.totalYards)} icon={TrendingUp} />
        <StatCard label="Efficiency" value={`${stats.efficiency}%`} icon={BarChart3} />
        <StatCard label="Explosives" value={String(stats.explosive)} icon={Star} />
        <StatCard label="Pressure snaps" value={String(stats.pressureSnaps)} icon={ShieldAlert} />
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                filter === option.key
                  ? 'border-primary/30 bg-primary/12 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr_340px]">
        {showMenu && (
          <aside className="min-h-0 overflow-y-auto border-r border-border p-5">
            <PanelTitle
              icon={Flag}
              title="Situational menu"
              subtitle="Fast-access game sections"
            />

            <div className="mt-4 space-y-3">
              {topSections.map((section) => (
                <div
                  key={section.bucket}
                  className="rounded-2xl border border-border bg-background/40"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {section.label}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {section.plays.length} menu calls · {section.used} used
                      </div>
                    </div>

                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                      {shortBucket(section.bucket)}
                    </span>
                  </div>

                  <div className="space-y-2 p-3">
                    {section.plays.slice(0, 4).map((play) => (
                      <button
                        key={play.playId}
                        type="button"
                        onClick={() => onOpenPlay?.(play, section)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/25"
                      >
                        <div className="text-sm font-semibold text-foreground">
                          {play.playName}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {play.concept}
                          {play.formation ? ` · ${play.formation}` : ''}
                          {play.personnel ? ` · ${play.personnel}` : ''}
                        </div>
                      </button>
                    ))}

                    {section.notes.length ? (
                      <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                        {section.notes[0]}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {showLog && (
          <main className="min-h-0 overflow-y-auto p-5">
            <PanelTitle
              icon={Activity}
              title="Live charting"
              subtitle="Recent calls, results, and sideline data"
            />

            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MiniMetric
                  label="Run/pass balance"
                  value={deriveRunPassLabel(liveLog)}
                />
                <MiniMetric
                  label="Best field zone"
                  value={deriveBestZone(liveLog)}
                />
                <MiniMetric
                  label="Most used situation"
                  value={deriveMostUsedBucket(liveLog)}
                />
                <MiniMetric
                  label="Front/Coverage note"
                  value={deriveMostCommonLook(liveLog)}
                />
              </div>

              <div className="rounded-2xl border border-border bg-background/40">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Recent sequence</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Latest calls for live review and booth communication
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-3">
                  {recentLog.length ? (
                    recentLog.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onOpenLogEntry?.(entry)}
                        className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:bg-accent/25"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-foreground">
                            Q{entry.quarter} · {entry.playName}
                          </div>
                          <ResultBadge result={entry.result} />
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          {ordinal(entry.down)} & {entry.distance} · {entry.yardLine}
                          {entry.hash ? ` · ${entry.hash} hash` : ''} · {prettyBucket(entry.sectionBucket)}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Chip label={`${entry.yards} yds`} />
                          {entry.front ? <Chip label={entry.front} /> : null}
                          {entry.coverage ? <Chip label={entry.coverage} /> : null}
                          {entry.pressureSeen ? <Chip label="Pressure" tone="warning" /> : null}
                        </div>

                        {entry.note ? (
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {entry.note}
                          </p>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <EmptyBlock text="No live calls logged yet." />
                  )}
                </div>
              </div>
            </div>
          </main>
        )}

        {showAdjust && (
          <aside className="min-h-0 overflow-y-auto border-l border-border p-5">
            <PanelTitle
              icon={AlertTriangle}
              title="Adjustments"
              subtitle="What to watch, what to answer, what to call now"
            />

            <div className="mt-4 space-y-3">
              {adjustments.length ? (
                adjustments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-background/40 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatSource(item.source)}
                        </div>
                      </div>
                      <UrgencyBadge urgency={item.urgency} />
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyBlock text="No adjustment notes yet." />
              )}
            </div>

            <div className="mt-6">
              <PanelTitle
                icon={NotebookPen}
                title="Quick notes"
                subtitle="Caller and staff reminders"
              />

              <div className="mt-3 space-y-2">
                {quickNotes.length ? (
                  quickNotes.map((note, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
                    >
                      {note}
                    </div>
                  ))
                ) : (
                  <EmptyBlock text="No quick notes added." />
                )}
              </div>
            </div>

            <div className="mt-6">
              <PanelTitle
                icon={Users}
                title="Sideline flow"
                subtitle="Simple in-game communication pattern"
              />

              <div className="mt-3 rounded-2xl border border-dashed border-border p-4">
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Openers collect answers about front, coverage, and pressure.</li>
                  <li>2. Live log captures call, result, and any look worth tagging.</li>
                  <li>3. Booth and sideline convert that into if/then adjustments.</li>
                  <li>4. Caller narrows the menu to what has actually shown up.</li>
                </ol>
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

function PanelTitle({ icon: Icon, title, subtitle }) {
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

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Chip({ label, tone = 'neutral' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tone === 'neutral' && 'bg-accent text-accent-foreground',
        tone === 'warning' && 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
      )}
    >
      {label}
    </span>
  );
}

function ResultBadge({ result }) {
  const map = {
    touchdown: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    explosive: 'bg-primary/12 text-primary',
    positive: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
    neutral: 'bg-accent text-accent-foreground',
    negative: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    sack: 'bg-orange-500/12 text-orange-700 dark:text-orange-300',
    turnover: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', map[result])}>
      {result.replace('_', ' ')}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const styles = {
    watch: 'bg-accent text-accent-foreground',
    ready: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    now: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', styles[urgency])}>
      {urgency}
    </span>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function ordinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return '4th';
}

function shortBucket(bucket) {
  switch (bucket) {
    case 'opening_script':
      return 'Openers';
    case 'first_and_ten':
      return '1st&10';
    case 'third_down':
      return '3rd';
    case 'red_zone':
      return 'RZ';
    case 'backed_up':
      return 'BU';
    case 'two_minute':
      return '2M';
    case 'four_minute':
      return '4M';
    case 'shot_plays':
      return 'Shots';
    case 'zero_answers':
      return 'Zero';
    default:
      return bucket;
  }
}

function prettyBucket(bucket) {
  switch (bucket) {
    case 'opening_script':
      return 'Opening Script';
    case 'first_and_ten':
      return '1st & 10';
    case 'third_down':
      return '3rd Down';
    case 'red_zone':
      return 'Red Zone';
    case 'backed_up':
      return 'Backed Up';
    case 'two_minute':
      return '2-Minute';
    case 'four_minute':
      return '4-Minute';
    case 'shot_plays':
      return 'Shot Plays';
    case 'zero_answers':
      return 'Pressure Answers';
    default:
      return bucket;
  }
}

function formatSource(source) {
  switch (source) {
    case 'booth':
      return 'Booth';
    case 'sideline':
      return 'Sideline';
    case 'caller':
      return 'Caller';
    case 'charting':
      return 'Charting';
    default:
      return source;
  }
}

function deriveRunPassLabel(log) {
  if (!log.length) return 'No data';
  const passHints = ['dropback', 'rpo', 'pass', 'screen', 'boot', 'play action'];
  const pass = log.filter((entry) =>
    passHints.some((hint) => entry.playName.toLowerCase().includes(hint))
  ).length;
  const run = log.length - pass;
  return `${run} run · ${pass} pass`;
}

function deriveBestZone(log) {
  if (!log.length) return 'No data';
  const red = log.filter((entry) => entry.sectionBucket === 'red_zone').length;
  const open = log.filter((entry) => entry.sectionBucket === 'opening_script').length;
  const field = log.filter(
    (entry) => !['red_zone', 'backed_up', 'two_minute', 'four_minute'].includes(entry.sectionBucket)
  ).length;

  if (field >= red && field >= open) return 'Open field';
  if (red >= field && red >= open) return 'Red zone';
  return 'Script/openers';
}

function deriveMostUsedBucket(log) {
  if (!log.length) return 'No data';
  const counts = new Map();

  log.forEach((entry) => {
    counts.set(entry.sectionBucket, (counts.get(entry.sectionBucket) || 0) + 1);
  });

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return top ? prettyBucket(top) : 'No data';
}

function deriveMostCommonLook(log) {
  if (!log.length) return 'No data';
  const values = log
    .map((entry) => [entry.front, entry.coverage].filter(Boolean).join(' / '))
    .filter(Boolean);

  if (!values.length) return 'No tagged look';
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'No tagged look';
}