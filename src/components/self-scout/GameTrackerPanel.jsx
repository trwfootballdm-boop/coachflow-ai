import React, { useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import { Plus, Trash2, Copy, Flag, Activity, ChevronDown } from "lucide-react";

const FIELD_ZONES = [
  { value: 'backed_up', label: 'Backed Up' },
  { value: 'coming_out', label: 'Coming Out' },
  { value: 'open_field', label: 'Open Field' },
  { value: 'fringe', label: 'Fringe' },
  { value: 'red_zone', label: 'Red Zone' },
  { value: 'goal_line', label: 'Goal Line' },
];

const RESULT_TAGS = [
  { value: 'success', label: 'Success' },
  { value: 'explosive', label: 'Explosive' },
  { value: 'first_down', label: '1st Down' },
  { value: 'touchdown', label: 'TD' },
  { value: 'sack', label: 'Sack' },
  { value: 'tfl', label: 'TFL' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'turnover', label: 'TO' },
];

function createEmptyPlay(gameId) {
  return {
    id: crypto.randomUUID(),
    gameId,
    quarter: 1,
    clock: '12:00',
    down: 1,
    distance: 10,
    yardLine: 35,
    hash: 'middle',
    fieldZone: 'open_field',
    playName: '',
    playType: 'run',
    result: {
      yards: 0,
      tags: [],
    },
    defensiveLook: {},
  };
}

function toggleTag(tags, tag) {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}

function shallowCloneLast(play) {
  return {
    ...play,
    id: crypto.randomUUID(),
    result: {
      ...play.result,
      yards: 0,
      tags: [],
      note: '',
    },
    notes: [],
  };
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20";

export default function GameTrackerPanel({
  tracker,
  availablePlays = [],
  onChange,
}) {
  const [draft, setDraft] = useState(() => createEmptyPlay(tracker.gameId));

  const summary = useMemo(() => {
    const total = tracker.plays.length;
    const runs = tracker.plays.filter((p) => p.playType === 'run').length;
    const passes = tracker.plays.filter((p) =>
      ['pass', 'screen', 'play_action', 'rpo'].includes(p.playType)
    ).length;
    const explosives = tracker.plays.filter((p) => p.result.tags.includes('explosive')).length;

    return {
      total,
      runPct: pct(runs, total),
      passPct: pct(passes, total),
      explosives,
    };
  }, [tracker.plays]);

  const recentPlays = useMemo(() => [...tracker.plays].slice(-8).reverse(), [tracker.plays]);

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateResult = (patch) => {
    setDraft((prev) => ({
      ...prev,
      result: { ...prev.result, ...patch },
    }));
  };

  const updateLook = (patch) => {
    setDraft((prev) => ({
      ...prev,
      defensiveLook: { ...prev.defensiveLook, ...patch },
    }));
  };

  const handleChoosePlay = (playId) => {
    const play = availablePlays.find((p) => p.id === playId);
    if (!play) return;

    setDraft((prev) => ({
      ...prev,
      playId: play.id,
      playName: play.name,
      concept: play.concept,
      formation: play.formation || prev.formation,
      personnel: play.personnel || prev.personnel,
      playType: play.playType || prev.playType,
    }));
  };

  const handleSave = () => {
    if (!draft.playName.trim()) return;

    onChange({
      ...tracker,
      plays: [...tracker.plays, draft],
    });

    setDraft((prev) => {
      const nextDown = prev.down === 4 ? 1 : (prev.down + 1);
      return {
        ...createEmptyPlay(tracker.gameId),
        quarter: prev.quarter,
        clock: prev.clock,
        yardLine: prev.yardLine,
        hash: prev.hash,
        fieldZone: prev.fieldZone,
        down: nextDown,
      };
    });
  };

  const handleDelete = (playId) => {
    onChange({
      ...tracker,
      plays: tracker.plays.filter((p) => p.id !== playId),
    });
  };

  const handleCloneLast = () => {
    const last = tracker.plays[tracker.plays.length - 1];
    if (!last) return;
    setDraft(shallowCloneLast(last));
  };

  const handleLoadRecent = (play) => {
    setDraft({
      ...play,
      id: crypto.randomUUID(),
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Live tracker
          </div>
          <h2 className="mt-1 text-sm font-semibold text-foreground">Game charting</h2>
        </div>

        <button
          type="button"
          onClick={handleCloneLast}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          Clone last
        </button>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-4 py-3">
        <StatCard label="Total" value={String(summary.total)} />
        <StatCard label="Run %" value={`${summary.runPct}%`} />
        <StatCard label="Pass %" value={`${summary.passPct}%`} />
        <StatCard label="Explosives" value={String(summary.explosives)} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-0 overflow-y-auto border-r border-border p-4">
          <div className="space-y-4">
            <SectionTitle icon={Activity} title="Quick entry" />

            <div className="grid grid-cols-6 gap-3">
              <Field label="Quarter">
                <select
                  value={draft.quarter}
                  onChange={(e) => updateDraft({ quarter: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </Field>

              <Field label="Clock">
                <input
                  value={draft.clock}
                  onChange={(e) => updateDraft({ clock: e.target.value })}
                  className={inputClass}
                  placeholder="12:00"
                />
              </Field>

              <Field label="Down">
                <select
                  value={draft.down}
                  onChange={(e) => updateDraft({ down: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="Distance">
                <input
                  type="number"
                  value={draft.distance}
                  onChange={(e) => updateDraft({ distance: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>

              <Field label="Yard line">
                <input
                  type="number"
                  value={draft.yardLine}
                  onChange={(e) => updateDraft({ yardLine: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>

              <Field label="Hash">
                <select
                  value={draft.hash}
                  onChange={(e) => updateDraft({ hash: e.target.value })}
                  className={inputClass}
                >
                  <option value="left">Left</option>
                  <option value="middle">Middle</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Choose play">
                <div className="relative">
                  <select
                    value={draft.playId || ''}
                    onChange={(e) => handleChoosePlay(e.target.value)}
                    className={cn(inputClass, "appearance-none pr-9")}
                  >
                    <option value="">Manual entry</option>
                    {availablePlays.map((play) => (
                      <option key={play.id} value={play.id}>
                        {play.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>

              <Field label="Play name">
                <input
                  value={draft.playName}
                  onChange={(e) => updateDraft({ playName: e.target.value })}
                  className={inputClass}
                  placeholder="Gun Trips Stick"
                />
              </Field>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Field label="Personnel">
                <input
                  value={draft.personnel || ''}
                  onChange={(e) => updateDraft({ personnel: e.target.value })}
                  className={inputClass}
                  placeholder="10"
                />
              </Field>

              <Field label="Formation">
                <input
                  value={draft.formation || ''}
                  onChange={(e) => updateDraft({ formation: e.target.value })}
                  className={inputClass}
                  placeholder="Trips Right"
                />
              </Field>

              <Field label="Motion">
                <input
                  value={draft.motion || ''}
                  onChange={(e) => updateDraft({ motion: e.target.value })}
                  className={inputClass}
                  placeholder="Jet"
                />
              </Field>

              <Field label="Concept">
                <input
                  value={draft.concept || ''}
                  onChange={(e) => updateDraft({ concept: e.target.value })}
                  className={inputClass}
                  placeholder="Stick"
                />
              </Field>

              <Field label="Type">
                <select
                  value={draft.playType}
                  onChange={(e) => updateDraft({ playType: e.target.value })}
                  className={inputClass}
                >
                  <option value="run">Run</option>
                  <option value="pass">Pass</option>
                  <option value="rpo">RPO</option>
                  <option value="screen">Screen</option>
                  <option value="play_action">Play Action</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Field label="Field zone">
                <select
                  value={draft.fieldZone}
                  onChange={(e) => updateDraft({ fieldZone: e.target.value })}
                  className={inputClass}
                >
                  {FIELD_ZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Front">
                <input
                  value={draft.defensiveLook?.front || ''}
                  onChange={(e) => updateLook({ front: e.target.value })}
                  className={inputClass}
                  placeholder="Even"
                />
              </Field>

              <Field label="Coverage">
                <input
                  value={draft.defensiveLook?.coverage || ''}
                  onChange={(e) => updateLook({ coverage: e.target.value })}
                  className={inputClass}
                  placeholder="Cover 3"
                />
              </Field>

              <Field label="Pressure">
                <input
                  value={draft.defensiveLook?.pressure || ''}
                  onChange={(e) => updateLook({ pressure: e.target.value })}
                  className={inputClass}
                  placeholder="4man"
                />
              </Field>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <Field label="Yards">
                <input
                  type="number"
                  value={draft.result.yards}
                  onChange={(e) => updateResult({ yards: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>

              <Field label="Result note">
                <input
                  value={draft.result.note || ''}
                  onChange={(e) => updateResult({ note: e.target.value })}
                  className={inputClass}
                  placeholder="Free hitter off edge / missed tackle / busted fit"
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Result tags
              </div>
              <div className="flex flex-wrap gap-2">
                {RESULT_TAGS.map((tag) => {
                  const active = draft.result.tags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => updateResult({ tags: toggleTag(draft.result.tags, tag.value) })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary/30 bg-primary/12 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDraft(createEmptyPlay(tracker.gameId))}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-95"
              >
                <Plus className="h-3.5 w-3.5" />
                Log play
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          <SectionTitle icon={Flag} title="Recent plays" />

          <div className="mt-3 space-y-2">
            {recentPlays.length === 0 ? (
              <EmptyState />
            ) : (
              recentPlays.map((play) => (
                <div
                  key={play.id}
                  className="rounded-xl border border-border bg-background/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {play.playName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Q{play.quarter} · {play.clock} · {play.down}&{play.distance} · {play.yardLine} · {play.hash}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {play.personnel || '—'} · {play.formation || '—'} · {play.defensiveLook?.coverage || 'No coverage logged'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {play.result.yards >= 0 ? '+' : ''}{play.result.yards}
                      </div>
                      <div className="mt-1 flex flex-wrap justify-end gap-1">
                        {play.result.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground"
                          >
                            {tag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {play.result.note ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {play.result.note}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadRecent(play)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft(shallowCloneLast(play))}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(play.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/60 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
        <Activity className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">No plays logged</h3>
      <p className="mt-2 max-w-[20rem] text-xs leading-5 text-muted-foreground">
        Start charting live or postgame by logging down, distance, structure, and result.
      </p>
    </div>
  );
}