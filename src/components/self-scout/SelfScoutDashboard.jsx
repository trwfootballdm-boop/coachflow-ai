import React, { useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Filter,
  BarChart3,
  Layers3,
  Users,
  Route,
} from "lucide-react";

const FILTER_OPTIONS = [
  { key: 'byDownDistance', label: 'Down & distance' },
  { key: 'byFieldZone', label: 'Field zone' },
  { key: 'byFormation', label: 'Formation' },
  { key: 'byPersonnel', label: 'Personnel' },
];

export default function SelfScoutDashboard({
  report,
  sampleLabel = 'Last 3 games',
  onSelectSplit,
}) {
  const [activeGroup, setActiveGroup] = useState('byDownDistance');

  const activeSplits = useMemo(() => {
    return report[activeGroup] || [];
  }, [report, activeGroup]);

  const topConcepts = useMemo(() => {
    return [...report.conceptEfficiency]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 8);
  }, [report.conceptEfficiency]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-start justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Self scout
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Offensive tendency dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sampleLabel} · {report.sampleSize} charted plays
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Report view
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3 border-b border-border px-5 py-4">
        <KpiCard label="Run %" value={`${report.overview.runPct}%`} icon={Activity} />
        <KpiCard label="Pass %" value={`${report.overview.passPct}%`} icon={TrendingUp} />
        <KpiCard label="Success rate" value={`${report.overview.successRate}%`} icon={BarChart3} />
        <KpiCard label="Explosive rate" value={`${report.overview.explosiveRate}%`} icon={Route} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0 overflow-y-auto border-r border-border p-5">
          <SectionTitle
            icon={AlertTriangle}
            title="Tendency alerts"
            subtitle="What opponents are likely to find first"
          />

          <div className="mt-3 space-y-2">
            {report.alerts.length ? (
              report.alerts.map((alert) => (
                <button
                  key={`${alert.label}-${alert.tendencyType}`}
                  type="button"
                  onClick={() => onSelectSplit?.('alerts', alert.label)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {alert.label}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {alert.note}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      alert.tendencyType === 'run'
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    )}
                  >
                    {alert.tendencyPct}%
                  </div>
                </button>
              ))
            ) : (
              <EmptyBlock text="No major tendency alerts in this sample." />
            )}
          </div>

          <div className="mt-6">
            <SectionTitle
              icon={Layers3}
              title="Situation and structure splits"
              subtitle="Run/pass balance and efficiency across common scouting buckets"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const active = activeGroup === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveGroup(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary/30 bg-primary/12 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <SplitTable
                rows={activeSplits}
                onSelect={(label) => onSelectSplit?.(activeGroup, label)}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <SectionTitle
            icon={Users}
            title="Concept efficiency"
            subtitle="Which concepts are helping most"
          />

          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-background/60">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Concept
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Calls
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Avg
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Success
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Explosive
                  </th>
                </tr>
              </thead>
              <tbody>
                {topConcepts.length ? (
                  topConcepts.map((row) => (
                    <tr
                      key={row.concept}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                        {row.concept}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground">
                        {row.calls}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground">
                        {row.avgYards}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground">
                        {row.successRate}%
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground">
                        {row.explosiveRate}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      No concept efficiency data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <SectionTitle
              icon={BarChart3}
              title="Notes"
              subtitle="Interpretation guidance for coaches"
            />

            <div className="mt-3 space-y-2">
              {report.notes.length ? (
                report.notes.map((note, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {note}
                  </div>
                ))
              ) : (
                <EmptyBlock text="No report notes yet." />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50 text-muted-foreground">
          {Icon && <Icon className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/50 text-muted-foreground">
        {Icon && <Icon className="h-4.5 w-4.5" />}
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

function SplitTable({ rows, onSelect }) {
  return (
    <table className="w-full text-left">
      <thead className="bg-background/60">
        <tr className="border-b border-border">
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Bucket
          </th>
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Total
          </th>
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Run
          </th>
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pass
          </th>
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Success
          </th>
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Explosive
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr
              key={row.label}
              className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-accent/30"
              onClick={() => onSelect?.(row.label)}
            >
              <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                {row.label}
              </td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">{row.total}</td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">{row.runPct}%</td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">{row.passPct}%</td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">{row.successRate}%</td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">{row.explosiveRate}%</td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={6}
              className="px-3 py-8 text-center text-sm text-muted-foreground"
            >
              No split data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}