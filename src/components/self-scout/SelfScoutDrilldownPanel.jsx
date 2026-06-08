import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { X, ArrowLeft, Filter, Play } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SelfScoutDrilldownPanel({ plays, filter, onClose }) {
  const filteredPlays = useMemo(() => {
    if (!filter) return plays;

    return plays.filter((play) => {
      switch (filter.group) {
        case 'byDownDistance':
          return play.downDistanceLabel === filter.label;
        case 'byFieldZone':
          return play.fieldZone === filter.label;
        case 'byFormation':
          return play.formation === filter.label;
        case 'byPersonnel':
          return play.personnel === filter.label;
        case 'alerts':
          if (filter.label === 'Heavy Run Tendency') {
            return play.playType === 'run';
          }
          if (filter.label === 'Heavy Pass Tendency') {
            return ['pass', 'screen', 'play_action', 'rpo'].includes(play.playType);
          }
          if (filter.label === 'Low Success Rate') {
            return !play.result.tags.includes('success') && !play.result.tags.includes('explosive');
          }
          if (filter.label === 'High Explosive Rate') {
            return play.result.tags.includes('explosive');
          }
          return true;
        default:
          return true;
      }
    });
  }, [plays, filter]);

  const summary = useMemo(() => {
    const total = filteredPlays.length;
    const runs = filteredPlays.filter((p) => p.playType === 'run').length;
    const passes = filteredPlays.filter((p) =>
      ['pass', 'screen', 'play_action', 'rpo'].includes(p.playType)
    ).length;
    const explosives = filteredPlays.filter((p) => p.result.tags.includes('explosive')).length;
    const successes = filteredPlays.filter((p) =>
      p.result.tags.includes('success') || p.result.tags.includes('explosive')
    ).length;

    return {
      total,
      runs,
      passes,
      explosives,
      successes,
      runPct: total ? Math.round((runs / total) * 100) : 0,
      passPct: total ? Math.round((passes / total) * 100) : 0,
      explosiveRate: total ? Math.round((explosives / total) * 100) : 0,
      successRate: total ? Math.round((successes / total) * 100) : 0,
      avgYards: total ? Math.round(filteredPlays.reduce((sum, p) => sum + p.result.yards, 0) / total) : 0,
    };
  }, [filteredPlays]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Drilldown
              </span>
            </div>
            <h2 className="mt-0.5 text-sm font-semibold text-foreground">
              {filter?.label || 'All Plays'}
            </h2>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="grid grid-cols-5 gap-2 border-b border-border px-4 py-3">
        <MiniStat label="Plays" value={String(summary.total)} />
        <MiniStat label="Run %" value={`${summary.runPct}%`} />
        <MiniStat label="Pass %" value={`${summary.passPct}%`} />
        <MiniStat label="Success" value={`${summary.successRate}%`} />
        <MiniStat label="Explosive" value={`${summary.explosiveRate}%`} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Play List ({filteredPlays.length})
          </h3>
          <div className="text-xs text-muted-foreground">
            Avg: <span className="font-semibold text-primary">{summary.avgYards} yards</span>
          </div>
        </div>

        <div className="space-y-2">
          {filteredPlays.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
                <Play className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">No plays found</h3>
              <p className="mt-2 max-w-[20rem] text-xs leading-5 text-muted-foreground">
                No plays match this filter in the current sample.
              </p>
            </div>
          ) : (
            filteredPlays.map((play) => (
              <div
                key={play.id}
                className="rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {play.playName}
                      </span>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {play.down === 1 ? '1st' : play.down === 2 ? '2nd' : play.down === 3 ? '3rd' : '4th'} & {play.distance}
                      </Badge>
                      <Badge variant="outline" className="h-5 text-xs">
                        {play.fieldZone}
                      </Badge>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {play.personnel || '—'} · {play.formation || '—'} · {play.concept || '—'}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Q{play.quarter} · {play.clock} · {play.yardLine} · {play.hash}
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
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            tag === 'explosive'
                              ? "bg-primary/10 text-primary"
                              : tag === 'touchdown'
                              ? "bg-green-500/10 text-green-700 dark:text-green-300"
                              : "bg-accent/50 text-accent-foreground"
                          )}
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

                {play.defensiveLook && (play.defensiveLook.front || play.defensiveLook.coverage) ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {play.defensiveLook.front && (
                      <Badge variant="outline" className="h-5 text-xs">
                        Front: {play.defensiveLook.front}
                      </Badge>
                    )}
                    {play.defensiveLook.coverage && (
                      <Badge variant="outline" className="h-5 text-xs">
                        Coverage: {play.defensiveLook.coverage}
                      </Badge>
                    )}
                    {play.defensiveLook.pressure && (
                      <Badge variant="outline" className="h-5 text-xs">
                        Pressure: {play.defensiveLook.pressure}
                      </Badge>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-2.5 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}