import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Clipboard,
  Rocket,
  ShieldAlert,
  TimerReset,
  Goal,
  ListFilter,
  Star,
  Zap,
  ArrowRightCircle,
  NotebookText,
} from 'lucide-react';

const SECTION_ORDER = [
  'opening_script',
  'first_and_ten',
  'second_short',
  'second_medium',
  'second_long',
  'third_short',
  'third_medium',
  'third_long',
  'fourth_short',
  'red_zone',
  'backed_up',
  'two_minute',
  'four_minute',
  'shot_plays',
  'zero_answers',
  'favorites',
  'gimmicks',
  'notes',
];

const PRIMARY_VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'core', label: 'Core downs' },
  { key: 'situations', label: 'Situations' },
  { key: 'special', label: 'Special' },
];

export default function CallSheetBoard({ callSheet, onOpenPlay }) {
  const [view, setView] = useState('all');

  const orderedSections = useMemo(() => {
    const byBucket = new Map(callSheet.sections.map((section) => [section.bucket, section]));
    const all = SECTION_ORDER
      .map((bucket) => byBucket.get(bucket))
      .filter(Boolean);

    if (view === 'all') return all;

    if (view === 'core') {
      return all.filter((section) =>
        [
          'opening_script',
          'first_and_ten',
          'second_short',
          'second_medium',
          'second_long',
          'third_short',
          'third_medium',
          'third_long',
          'fourth_short',
        ].includes(section.bucket)
      );
    }

    if (view === 'situations') {
      return all.filter((section) =>
        ['red_zone', 'backed_up', 'two_minute', 'four_minute'].includes(section.bucket)
      );
    }

    return all.filter((section) =>
      ['shot_plays', 'zero_answers', 'favorites', 'gimmicks', 'notes'].includes(section.bucket)
    );
  }, [callSheet.sections, view]);

  const stats = useMemo(() => {
    const totalSections = callSheet.sections.length;
    const totalPlays = callSheet.sections.reduce((sum, section) => sum + section.plays.length, 0);
    const openers =
      callSheet.sections.find((section) => section.bucket === 'opening_script')?.plays.length ?? 0;
    const pressures =
      callSheet.sections.find((section) => section.bucket === 'zero_answers')?.plays.length ?? 0;

    return { totalSections, totalPlays, openers, pressures };
  }, [callSheet.sections]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Call sheet
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Game-day board
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {callSheet.weekLabel}
            {callSheet.opponent ? ` · vs ${callSheet.opponent}` : ''}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <Clipboard className="h-3.5 w-3.5" />
          Situational menu
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-5 py-4">
        <StatCard label="Sections" value={String(stats.totalSections)} icon={ListFilter} />
        <StatCard label="Total calls" value={String(stats.totalPlays)} icon={Clipboard} />
        <StatCard label="Openers" value={String(stats.openers)} icon={Rocket} />
        <StatCard label="Pressure answers" value={String(stats.pressures)} icon={ShieldAlert} />
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {PRIMARY_VIEWS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setView(option.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                view === option.key
                  ? 'border-primary/30 bg-primary/12 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-4 xl:grid-cols-2">
            {orderedSections.map((section) => (
              <SectionCard
                key={section.bucket}
                section={section}
                onOpenPlay={onOpenPlay}
              />
            ))}
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto border-l border-border p-5">
          <SidebarTitle
            icon={NotebookText}
            title="Week summary"
            subtitle="Why this sheet exists"
          />

          <div className="mt-3 space-y-2">
            {callSheet.summary.length ? (
              callSheet.summary.map((line, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
                >
                  {line}
                </div>
              ))
            ) : (
              <EmptyBlock text="No summary notes yet." />
            )}
          </div>

          <div className="mt-6">
            <SidebarTitle
              icon={Star}
              title="Quick reminders"
              subtitle="Game-day thinking points"
            />

            <div className="mt-3 space-y-2">
              <Reminder text="Use the opening script to gather answers, not just call favorites." />
              <Reminder text="Treat pressure answers as instant-access calls." />
              <Reminder text="Keep red zone, backed up, and 2-minute visible before they happen." />
              <Reminder text="If it was not practiced during the week, be careful about carrying it here." />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SectionCard({ section, onOpenPlay }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/50 text-muted-foreground">
            <SectionIcon bucket={section.bucket} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {section.plays.length} calls
            </p>
          </div>
        </div>

        <div className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
          {bucketShortLabel(section.bucket)}
        </div>
      </div>

      <div className="space-y-3 p-3">
        {section.plays.length ? (
          section.plays.map((play, index) => (
            <button
              key={`${section.bucket}-${play.playId}-${index}`}
              type="button"
              onClick={() => onOpenPlay?.(play, section)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:bg-accent/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    {play.playName}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {play.concept}
                    {play.formation ? ` · ${play.formation}` : ''}
                    {play.personnel ? ` · ${play.personnel}` : ''}
                  </div>
                </div>

                {typeof play.openerScore === 'number' && section.bucket === 'opening_script' ? (
                  <div className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {play.openerScore}
                  </div>
                ) : null}
              </div>

              {(play.tags?.length || play.bestFor?.length || play.preferredLook?.length) ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {play.tags?.slice(0, 2).map((tag) => (
                    <MiniPill key={tag} label={tag} />
                  ))}
                  {play.bestFor?.slice(0, 1).map((item) => (
                    <MiniPill key={item} label={item} />
                  ))}
                  {play.preferredLook?.slice(0, 1).map((look) => (
                    <MiniPill key={look} label={look} />
                  ))}
                </div>
              ) : null}

              {play.notes?.length ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {play.notes[0]}
                </p>
              ) : null}
            </button>
          ))
        ) : (
          <EmptyBlock text="No calls in this section." />
        )}

        {section.notes.length ? (
          <div className="rounded-xl border border-dashed border-border px-3.5 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Notes
            </div>
            <div className="space-y-1.5">
              {section.notes.map((note, index) => (
                <div key={index} className="text-xs leading-5 text-muted-foreground">
                  - {note}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionIcon({ bucket }) {
  const className = 'h-4.5 w-4.5';

  if (bucket === 'opening_script') return <Rocket className={className} />;
  if (bucket === 'red_zone') return <Goal className={className} />;
  if (bucket === 'two_minute' || bucket === 'four_minute') return <TimerReset className={className} />;
  if (bucket === 'shot_plays') return <Zap className={className} />;
  if (bucket === 'zero_answers') return <ShieldAlert className={className} />;
  if (bucket === 'favorites') return <Star className={className} />;
  return <ArrowRightCircle className={className} />;
}

function SidebarTitle({ icon: Icon, title, subtitle }) {
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

function MiniPill({ label }) {
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">
      {label}
    </span>
  );
}

function Reminder({ text }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function bucketShortLabel(bucket) {
  switch (bucket) {
    case 'opening_script':
      return 'Openers';
    case 'first_and_ten':
      return '1st&10';
    case 'second_short':
      return '2nd S';
    case 'second_medium':
      return '2nd M';
    case 'second_long':
      return '2nd L';
    case 'third_short':
      return '3rd S';
    case 'third_medium':
      return '3rd M';
    case 'third_long':
      return '3rd L';
    case 'fourth_short':
      return '4th S';
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
    case 'favorites':
      return 'Best';
    case 'gimmicks':
      return 'Gimmick';
    case 'notes':
      return 'Notes';
    default:
      return bucket;
  }
}