import React from 'react';
import { cn } from '@/lib/utils';
import { playLibraryStore } from '@/lib/football-engine/playLibraryStore.js';

export default function CallCard({ call, onOpen, onSetActivation }) {
  const canPromote =
    call.activation === 'weekly_candidate' ||
    call.activation === 'installed' ||
    call.activation === 'practiced';

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

      {call.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {call.tags.map((tag) => (
            <MiniPill key={tag} label={tag} />
          ))}
        </div>
      ) : null}

      {call.situations?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {call.situations.map((item) => (
            <MiniPill key={item} label={formatSituation(item)} tone="subtle" />
          ))}
        </div>
      ) : null}

      {call.notes ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{call.notes}</p>
      ) : null}

      {call.playerFitNotes?.matchupNotes ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Matchup: {call.playerFitNotes.matchupNotes}
        </p>
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canPromote}
          onClick={() => playLibraryStore.promoteCallToCallsheet(call.id)}
          className={cn(
            'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            canPromote
              ? 'border border-primary/30 bg-primary/12 text-primary hover:opacity-90'
              : 'border border-border text-muted-foreground opacity-50'
          )}
        >
          Promote to Call Sheet
        </button>
      </div>
    </div>
  );
}

function ActivationBadge({ activation }) {
  const styles = {
    library: 'bg-secondary text-muted-foreground',
    weekly_candidate: 'bg-accent/15 text-accent-foreground',
    installed: 'bg-primary/15 text-primary',
    practiced: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    callsheet: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    archived: 'bg-muted text-muted-foreground opacity-60',
  };

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]', styles[activation] || styles.library)}>
      {formatActivation(activation)}
    </span>
  );
}

function MiniPill({ label, tone = 'default' }) {
  const styles = {
    default: 'bg-accent/10 text-accent-foreground',
    subtle: 'bg-secondary text-muted-foreground',
  };

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]', styles[tone])}>
      {label}
    </span>
  );
}

function formatActivation(value) {
  const labels = {
    library: 'Library',
    weekly_candidate: 'Weekly',
    installed: 'Installed',
    practiced: 'Practiced',
    callsheet: 'Call Sheet',
    archived: 'Archived',
  };
  return labels[value] || value;
}

function formatSituation(value) {
  return value.replace(/_/g, ' ');
}