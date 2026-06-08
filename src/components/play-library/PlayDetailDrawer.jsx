import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BookMarked, NotebookPen, UserRound, X } from 'lucide-react';
import { usePlayLibraryStore } from '@/lib/football-engine/playLibraryStore.js';

export default function PlayDetailDrawer({ open, onClose, conceptId, callId }) {
  const state = usePlayLibraryStore();

  const concept = useMemo(
    () => state.concepts.find((item) => item.id === conceptId) ?? null,
    [conceptId, state.concepts]
  );

  const call = useMemo(
    () => state.calls.find((item) => item.id === callId) ?? null,
    [callId, state.calls]
  );

  const [conceptNotes, setConceptNotes] = useState('');
  const [callNotes, setCallNotes] = useState(call?.notes ?? '');
  const [playerFitNotes, setPlayerFitNotes] = useState('');

  if (!open || !concept) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-[560px] flex-col border-l border-border bg-background shadow-2xl">
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Play detail
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              {call?.callName ?? concept.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {concept.name} · {call ? `${call.formation} · ${call.personnel}` : 'Concept metadata'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <DrawerSection
            icon={BookMarked}
            title="Concept metadata"
            subtitle="Edit description, complements, and teaching language"
          >
            <label className="block">
              <FieldLabel label="Description" />
              <textarea
                defaultValue={concept.description}
                rows={4}
                className={inputClass}
              />
            </label>

            <label className="block">
              <FieldLabel label="Teaching notes" />
              <textarea
                value={conceptNotes}
                onChange={(e) => setConceptNotes(e.target.value)}
                rows={4}
                placeholder="Add install emphasis, correction points, or weekly teaching notes..."
                className={inputClass}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <TagField label="Formations" values={concept.formations} />
              <TagField label="Tags" values={concept.tags} />
              <TagField label="Situations" values={concept.situations} />
              <TagField label="Complements" values={concept.complements} />
            </div>
          </DrawerSection>

          <DrawerSection
            icon={NotebookPen}
            title="Call notes"
            subtitle="Exact wording and execution reminders"
          >
            {call ? (
              <>
                <label className="block">
                  <FieldLabel label="Call notes" />
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={5}
                    placeholder="Hash, cadence, alert, tendency breaker, or scout look..."
                    className={inputClass}
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <ReadOnlyField label="Formation" value={call.formation} />
                  <ReadOnlyField label="Personnel" value={call.personnel} />
                  <ReadOnlyField label="Motion" value={call.motion || 'None'} />
                  <ReadOnlyField label="Activation" value={call.activation} />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Select a call variant to edit call-level notes.
              </div>
            )}
          </DrawerSection>

          <DrawerSection
            icon={UserRound}
            title="Player-fit notes"
            subtitle="Who should touch it, who should read it, who to attack"
          >
            <label className="block">
              <FieldLabel label="Player / matchup notes" />
              <textarea
                value={playerFitNotes}
                onChange={(e) => setPlayerFitNotes(e.target.value)}
                rows={5}
                placeholder="Best ballcarrier, preferred receiver, read key, defender to attack, defender to avoid..."
                className={inputClass}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Best vs" value={concept.bestVs.join(', ')} />
              <ReadOnlyField label="Core concept" value={concept.core ? 'Yes' : 'No'} />
            </div>
          </DrawerSection>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // wire to real update actions next
              onClose();
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </footer>
      </div>
    </div>
  );
}

function DrawerSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4">
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

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ label }) {
  return (
    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </div>
  );
}

function TagField({ label, values }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-3">
      <FieldLabel label={label} />
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-foreground"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-3">
      <FieldLabel label={label} />
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20';