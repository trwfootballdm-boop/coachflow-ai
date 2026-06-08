import React, { useMemo } from 'react';
import { cn } from '@/lib/utils.js';
import {
  BookOpen,
  Boxes,
  ClipboardCheck,
  Filter,
  Flag,
  Layers3,
  Route,
  Search,
  ShieldQuestion,
  Star,
} from 'lucide-react';
import {
  getConceptById,
  getConceptCalls,
  playLibraryStore,
} from '@/lib/football-engine/playLibraryStore.js';
import { useSeedLibrary } from '@/hooks/useSeedLibrary.js';

const FAMILY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'run', label: 'Run' },
  { value: 'quick', label: 'Quick' },
  { value: 'dropback', label: 'Dropback' },
  { value: 'screen', label: 'Screen' },
  { value: 'play_action', label: 'Play Action' },
  { value: 'special', label: 'Special' },
];

const ACTIVATION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'library', label: 'Library' },
  { value: 'weekly_candidate', label: 'Weekly' },
  { value: 'installed', label: 'Installed' },
  { value: 'practiced', label: 'Practiced' },
  { value: 'callsheet', label: 'Callsheet' },
];

const SITUATION_FILTERS = [
  { value: 'all', label: 'All situations' },
  { value: 'base', label: 'Base' },
  { value: 'first_and_ten', label: '1st & 10' },
  { value: 'third_short', label: '3rd short' },
  { value: 'third_medium', label: '3rd medium' },
  { value: 'third_long', label: '3rd long' },
  { value: 'red_zone', label: 'Red zone' },
  { value: 'backed_up', label: 'Backed up' },
  { value: 'two_minute', label: '2-minute' },
  { value: 'shot', label: 'Shot' },
  { value: 'pressure', label: 'Pressure' },
];

export default function ConceptLibraryBoard({ onOpenConcept, onOpenCall }) {
  const state = useSeedLibrary();

  const filteredConcepts = useMemo(
    () => filterConcepts(state),
    [state]
  );

  const selectedConcept =
    getConceptById(
      state.selectedConceptId ?? filteredConcepts[0]?.id ?? null,
      filteredConcepts.length ? filteredConcepts : state.concepts
    ) ?? null;

  const selectedCalls = selectedConcept
    ? getConceptCalls(selectedConcept.id, state.calls)
    : [];

  const stats = useMemo(() => {
    const activeCalls = state.calls.filter((call) => !call.archived);
    return {
      concepts: state.concepts.filter((concept) => !concept.archived).length,
      calls: activeCalls.length,
      weekly: activeCalls.filter((call) => call.activation === 'weekly_candidate').length,
      ready: activeCalls.filter((call) =>
        call.activation === 'practiced' || call.activation === 'callsheet'
      ).length,
    };
  }, [state.calls, state.concepts]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Play library
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Concept board
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.weekly.weekLabel} · vs {state.weekly.opponent}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          Concept-first library
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-5 py-4">
        <StatCard label="Concepts" value={String(stats.concepts)} icon={Boxes} />
        <StatCard label="Calls" value={String(stats.calls)} icon={Route} />
        <StatCard label="Weekly" value={String(stats.weekly)} icon={Flag} />
        <StatCard label="Ready" value={String(stats.ready)} icon={ClipboardCheck} />
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={state.filters.search}
            onChange={(e) => playLibraryStore.setFilter('search', e.target.value)}
            placeholder="Search concepts, tags, situations, calls..."
            className={inputClass('pl-9')}
          />
        </label>

        <select
          value={state.filters.family}
          onChange={(e) =>
            playLibraryStore.setFilter('family', e.target.value)
          }
          className={inputClass()}
        >
          {FAMILY_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={state.filters.situation}
          onChange={(e) =>
            playLibraryStore.setFilter('situation', e.target.value)
          }
          className={inputClass()}
        >
          {SITUATION_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => playLibraryStore.setFilter('coreOnly', !state.filters.coreOnly)}
          className={cn(
            'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
            state.filters.coreOnly
              ? 'border-primary/30 bg-primary/12 text-primary'
              : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
        >
          Core only
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[340px_1fr_340px]">
        <aside className="min-h-0 overflow-y-auto border-r border-border p-5">
          <PanelTitle
            icon={Layers3}
            title="Concepts"
            subtitle="Families first, calls second"
          />

          <div className="mt-4 space-y-3">
            {filteredConcepts.map((concept) => {
              const conceptCalls = getConceptCalls(concept.id, state.calls);
              const weeklyCount = conceptCalls.filter(
                (call) => call.activation === 'weekly_candidate'
              ).length;

              return (
                <button
                  key={concept.id}
                  type="button"
                  onClick={() => {
                    playLibraryStore.setSelectedConcept(concept.id);
                    onOpenConcept?.(concept);
                  }}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                    selectedConcept?.id === concept.id
                      ? 'border-primary/30 bg-primary/8'
                      : 'border-border bg-background/40 hover:bg-accent/25'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {concept.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatFamily(concept.family)} · Tier {concept.installTier}
                      </div>
                    </div>

                    {concept.core ? (
                      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Core
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {concept.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MiniPill label={`${conceptCalls.length} calls`} />
                    {weeklyCount ? <MiniPill label={`${weeklyCount} weekly`} tone="primary" /> : null}
                    <MiniPill label={`${concept.situations.length} situations`} />
                  </div>
                </button>
              );
            })}

            {!filteredConcepts.length ? <EmptyBlock text="No concepts match the current filters." /> : null}
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto p-5">
          {selectedConcept ? (
            <>
              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Selected concept
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      {selectedConcept.name}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {selectedConcept.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MiniPill label={formatFamily(selectedConcept.family)} />
                    <MiniPill label={`Tier ${selectedConcept.installTier}`} />
                    {selectedConcept.core ? <MiniPill label="Core" tone="primary" /> : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <DetailBlock title="Formations" items={selectedConcept.formations} />
                  <DetailBlock title="Motions" items={selectedConcept.motions} />
                  <DetailBlock title="Tags" items={selectedConcept.tags} />
                  <DetailBlock title="Best vs" items={selectedConcept.bestVs} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailBlock title="Complements" items={selectedConcept.complements} />
                  <DetailBlock title="Teaching points" items={selectedConcept.teachingPoints} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Situations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedConcept.situations.map((item) => (
                      <MiniPill key={item} label={formatSituation(item)} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <PanelTitle
                  icon={Route}
                  title="Call variants"
                  subtitle="Weekly activation happens at the call level"
                />

                <div className="mt-4 space-y-3">
                  {selectedCalls.length ? (
                    selectedCalls.map((call) => (
                      <CallCard
                        key={call.id}
                        call={call}
                        onOpen={() => onOpenCall?.(call)}
                        onSetActivation={(activation) =>
                          playLibraryStore.setCallActivation(call.id, activation)
                        }
                      />
                    ))
                  ) : (
                    <EmptyBlock text="No calls available for this concept." />
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyBlock text="Select a concept to inspect the family, tags, and call variants." />
          )}
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-border p-5">
          <PanelTitle
            icon={Filter}
            title="Weekly view"
            subtitle="Keep the library tied to real game-week usage"
          />

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Activation focus
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIVATION_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => playLibraryStore.setFilter('activation', item.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    state.filters.activation === item.value
                      ? 'border-primary/30 bg-primary/12 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <SidebarBlock
              title="Week focus"
              items={state.weekly.focus}
              icon={Star}
            />
            <SidebarBlock
              title="Library rules"
              items={[
                'Concepts organize teaching; calls organize weekly execution.',
                'Only calls that survive install and practice should reach the call sheet.',
                'Use tags and formations to stay multiple without multiplying the install.',
              ]}
              icon={ShieldQuestion}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Quick actions
            </div>
            <div className="space-y-2">
              <ActionButton
                label="Reset library to seed"
                onClick={() => playLibraryStore.resetToSeed()}
              />
              <ActionButton
                label="Show all filters"
                onClick={() => playLibraryStore.clearFilters()}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function filterConcepts(state) {
  const search = state.filters.search.trim().toLowerCase();

  return state.concepts.filter((concept) => {
    if (concept.archived) return false;
    if (state.filters.family !== 'all' && concept.family !== state.filters.family) return false;
    if (state.filters.coreOnly && !concept.core) return false;
    if (
      state.filters.situation !== 'all' &&
      !concept.situations.includes(state.filters.situation)
    ) {
      return false;
    }

    const conceptCalls = getConceptCalls(concept.id, state.calls);

    if (
      state.filters.activation !== 'all' &&
      !conceptCalls.some((call) => call.activation === state.filters.activation)
    ) {
      return false;
    }

    if (!search) return true;

    const haystack = [
      concept.name,
      concept.description,
      concept.family,
      ...concept.tags,
      ...concept.formations,
      ...concept.motions,
      ...concept.bestVs,
      ...concept.situations,
      ...concept.complements,
      ...conceptCalls.map((call) => call.callName),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}

function CallCard({ call, onOpen, onSetActivation }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="text-left">
          <div className="text-sm font-semibold text-foreground">{call.callName}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {call.formation} · {call.personnel} personnel
            {call.motion ? ` · ${call.motion}` : ''}
          </div>
        </button>

        <ActivationBadge activation={call.activation} />
      </div>

      {call.tags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {call.tags.map((tag) => (
            <MiniPill key={tag} label={tag} />
          ))}
        </div>
      ) : null}

      {call.situations.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {call.situations.map((item) => (
            <MiniPill key={item} label={formatSituation(item)} tone="subtle" />
          ))}
        </div>
      ) : null}

      {call.notes ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{call.notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {['library', 'weekly_candidate', 'installed', 'practiced', 'callsheet'].map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSetActivation(value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                call.activation === value
                  ? 'border-primary/30 bg-primary/12 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {formatActivation(value)}
            </button>
          )
        )}
      </div>
    </div>
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

function DetailBlock({ title, items }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <MiniPill key={item} label={item} />
        ))}
      </div>
    </div>
  );
}

function SidebarBlock({ title, items, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm font-semibold text-foreground">{title}</div>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="text-sm text-muted-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
    >
      {label}
    </button>
  );
}

function MiniPill({ label, tone = 'default' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tone === 'default' && 'bg-accent text-accent-foreground',
        tone === 'primary' && 'bg-primary/12 text-primary',
        tone === 'subtle' && 'bg-background text-muted-foreground border border-border'
      )}
    >
      {label}
    </span>
  );
}

function ActivationBadge({ activation }) {
  const styles = {
    library: 'bg-accent text-accent-foreground',
    weekly_candidate: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
    installed: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    practiced: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    callsheet: 'bg-primary/12 text-primary',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', styles[activation])}>
      {formatActivation(activation)}
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

function formatFamily(family) {
  const map = {
    run: 'Run',
    quick: 'Quick',
    dropback: 'Dropback',
    screen: 'Screen',
    play_action: 'Play Action',
    special: 'Special',
  };
  return map[family] || family;
}

function formatSituation(situation) {
  const map = {
    first_and_ten: '1st & 10',
    second_short: '2nd Short',
    second_medium: '2nd Medium',
    second_long: '2nd Long',
    third_short: '3rd Short',
    third_medium: '3rd Medium',
    third_long: '3rd Long',
    fourth_short: '4th Short',
    red_zone: 'Red Zone',
    backed_up: 'Backed Up',
    two_minute: '2-Minute',
    four_minute: '4-Minute',
    goal_line: 'Goal Line',
    shot: 'Shot',
    pressure: 'Pressure',
    base: 'Base',
  };
  return map[situation] || situation;
}

function formatActivation(value) {
  const map = {
    library: 'Library',
    weekly_candidate: 'Weekly',
    installed: 'Installed',
    practiced: 'Practiced',
    callsheet: 'Callsheet',
    archived: 'Archived',
  };
  return map[value] || value;
}

function inputClass(extra) {
  return cn(
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20',
    extra
  );
}