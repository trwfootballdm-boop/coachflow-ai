import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BookMarked, NotebookPen, UserRound, X } from 'lucide-react';
import { playLibraryStore, usePlayLibraryStore } from '@/lib/football-engine/playLibraryStore.js';

export default function PlayDetailDrawer({ conceptId, callId, open, onClose }) {
  const state = usePlayLibraryStore();

  const concept = useMemo(
    () => state.concepts.find((item) => item.id === conceptId) ?? null,
    [conceptId, state.concepts]
  );

  const call = useMemo(
    () => state.calls.find((item) => item.id === callId) ?? null,
    [callId, state.calls]
  );

  const [description, setDescription] = useState('');
  const [conceptNotes, setConceptNotes] = useState('');
  const [formationsInput, setFormationsInput] = useState('');
  const [motionsInput, setMotionsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [situationsInput, setSituationsInput] = useState('');
  const [bestVsInput, setBestVsInput] = useState('');
  const [complementsInput, setComplementsInput] = useState('');
  const [teachingPointsInput, setTeachingPointsInput] = useState('');

  const [callNotes, setCallNotes] = useState('');
  const [callDetailNotes, setCallDetailNotes] = useState('');
  const [callActivation, setCallActivation] = useState('library');

  const [featuredPlayersInput, setFeaturedPlayersInput] = useState('');
  const [preferredBallCarrier, setPreferredBallCarrier] = useState('');
  const [preferredTarget, setPreferredTarget] = useState('');
  const [readKey, setReadKey] = useState('');
  const [attackPlayer, setAttackPlayer] = useState('');
  const [avoidPlayer, setAvoidPlayer] = useState('');
  const [matchupNotes, setMatchupNotes] = useState('');

  useEffect(() => {
    if (!concept || !open) return;

    setDescription(concept.description ?? '');
    setConceptNotes(concept.detailNotes ?? '');
    setFormationsInput((concept.formations ?? []).join(', '));
    setMotionsInput((concept.motions ?? []).join(', '));
    setTagsInput((concept.tags ?? []).join(', '));
    setSituationsInput((concept.situations ?? []).join(', '));
    setBestVsInput((concept.bestVs ?? []).join(', '));
    setComplementsInput((concept.complements ?? []).join(', '));
    setTeachingPointsInput((concept.teachingPoints ?? []).join('\n'));
  }, [concept, open]);

  useEffect(() => {
    if (!call || !open) {
      setCallNotes('');
      setCallDetailNotes('');
      setCallActivation('library');
      setFeaturedPlayersInput('');
      setPreferredBallCarrier('');
      setPreferredTarget('');
      setReadKey('');
      setAttackPlayer('');
      setAvoidPlayer('');
      setMatchupNotes('');
      return;
    }

    setCallNotes(call.notes ?? '');
    setCallDetailNotes(call.detailNotes ?? '');
    setCallActivation(call.activation === 'archived' ? 'library' : call.activation);
    setFeaturedPlayersInput((call.playerFitNotes?.featuredPlayers ?? []).join(', '));
    setPreferredBallCarrier(call.playerFitNotes?.preferredBallCarrier ?? '');
    setPreferredTarget(call.playerFitNotes?.preferredTarget ?? '');
    setReadKey(call.playerFitNotes?.readKey ?? '');
    setAttackPlayer(call.playerFitNotes?.attackPlayer ?? '');
    setAvoidPlayer(call.playerFitNotes?.avoidPlayer ?? '');
    setMatchupNotes(call.playerFitNotes?.matchupNotes ?? '');
  }, [call, open]);

  if (!open || !concept) return null;

  const handleSave = () => {
    playLibraryStore.updateConcept(concept.id, {
      description: description.trim(),
      detailNotes: conceptNotes.trim(),
      formations: parseCsv(formationsInput),
      motions: parseCsv(motionsInput),
      tags: parseCsv(tagsInput),
      situations: parseCsv(situationsInput),
      bestVs: parseCsv(bestVsInput),
      complements: parseCsv(complementsInput),
      teachingPoints: parseLines(teachingPointsInput),
    });

    if (call) {
      playLibraryStore.updateCall(call.id, {
        notes: callNotes.trim(),
        detailNotes: callDetailNotes.trim(),
        activation: callActivation,
      });

      playLibraryStore.updatePlayerFitNotes(call.id, {
        featuredPlayers: parseCsv(featuredPlayersInput),
        preferredBallCarrier: preferredBallCarrier.trim(),
        preferredTarget: preferredTarget.trim(),
        readKey: readKey.trim(),
        attackPlayer: attackPlayer.trim(),
        avoidPlayer: avoidPlayer.trim(),
        matchupNotes: matchupNotes.trim(),
      });
    }

    onClose();
  };

  const handlePromote = () => {
    if (!call) return;
    playLibraryStore.promoteCallToCallsheet(call.id);
    setCallActivation('callsheet');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-[620px] flex-col border-l border-border bg-background shadow-2xl">
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
            subtitle="Edit concept description, tags, situations, and teaching language"
          >
            <label className="block">
              <FieldLabel label="Description" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass}
              />
            </label>

            <label className="block">
              <FieldLabel label="Concept notes" />
              <textarea
                value={conceptNotes}
                onChange={(e) => setConceptNotes(e.target.value)}
                rows={4}
                placeholder="Add install emphasis, correction points, or weekly teaching notes..."
                className={inputClass}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <EditableField label="Formations (comma separated)" value={formationsInput} onChange={setFormationsInput} />
              <EditableField label="Motions (comma separated)" value={motionsInput} onChange={setMotionsInput} />
              <EditableField label="Tags (comma separated)" value={tagsInput} onChange={setTagsInput} />
              <EditableField label="Situations (comma separated)" value={situationsInput} onChange={setSituationsInput} />
              <EditableField label="Best vs (comma separated)" value={bestVsInput} onChange={setBestVsInput} />
              <EditableField label="Complements (comma separated)" value={complementsInput} onChange={setComplementsInput} />
            </div>

            <label className="block">
              <FieldLabel label="Teaching points (one per line)" />
              <textarea
                value={teachingPointsInput}
                onChange={(e) => setTeachingPointsInput(e.target.value)}
                rows={5}
                className={inputClass}
              />
            </label>
          </DrawerSection>

          <DrawerSection
            icon={NotebookPen}
            title="Call notes"
            subtitle="Save exact call reminders and weekly activation state"
          >
            {call ? (
              <>
                <label className="block">
                  <FieldLabel label="Short note" />
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={3}
                    placeholder="Hash, cadence, alert, tendency breaker..."
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel label="Detailed note" />
                  <textarea
                    value={callDetailNotes}
                    onChange={(e) => setCallDetailNotes(e.target.value)}
                    rows={4}
                    placeholder="Scout look, if/then reminder, setup note, second-half reminder..."
                    className={inputClass}
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <ReadOnlyField label="Formation" value={call.formation} />
                  <ReadOnlyField label="Personnel" value={call.personnel} />
                  <ReadOnlyField label="Motion" value={call.motion || 'None'} />
                  <div className="rounded-xl border border-border bg-background/50 px-3 py-3">
                    <FieldLabel label="Activation" />
                    <select
                      value={callActivation}
                      onChange={(e) => setCallActivation(e.target.value)}
                      className={cn(inputClass, 'min-h-0')}
                    >
                      <option value="library">Library</option>
                      <option value="weekly_candidate">Weekly</option>
                      <option value="installed">Installed</option>
                      <option value="practiced">Practiced</option>
                      <option value="callsheet">Call Sheet</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePromote}
                    className="rounded-xl border border-primary/30 bg-primary/12 px-3 py-2 text-sm font-medium text-primary transition-opacity hover:opacity-90"
                  >
                    Promote to Call Sheet
                  </button>
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
            subtitle="Track who should carry it, catch it, read it, attack, or avoid"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <EditableField label="Featured players" value={featuredPlayersInput} onChange={setFeaturedPlayersInput} />
              <EditableField label="Preferred ball carrier" value={preferredBallCarrier} onChange={setPreferredBallCarrier} />
              <EditableField label="Preferred target" value={preferredTarget} onChange={setPreferredTarget} />
              <EditableField label="Read key" value={readKey} onChange={setReadKey} />
              <EditableField label="Attack player" value={attackPlayer} onChange={setAttackPlayer} />
              <EditableField label="Avoid player" value={avoidPlayer} onChange={setAvoidPlayer} />
            </div>

            <label className="block">
              <FieldLabel label="Matchup notes" />
              <textarea
                value={matchupNotes}
                onChange={(e) => setMatchupNotes(e.target.value)}
                rows={4}
                placeholder="Best matchup condition, leverage, field/boundary preference, or personnel reminder..."
                className={inputClass}
              />
            </label>
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
            onClick={handleSave}
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

function EditableField({ label, value, onChange }) {
  return (
    <label className="block">
      <FieldLabel label={label} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
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

function parseCsv(input) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(input) {
  return input
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20';