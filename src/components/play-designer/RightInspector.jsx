import React, { useEffect, useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import PlayerInspector from './PlayerInspector';
import PathInspector from './PathInspector';
import PlayMetaPanel from './PlayMetaPanel';
import { SlidersHorizontal, UserRound, NotebookPen } from "lucide-react";

const TABS = [
  { id: 'play', icon: SlidersHorizontal, label: 'Play' },
  { id: 'selection', icon: UserRound, label: 'Selection' },
  { id: 'notes', icon: NotebookPen, label: 'Notes' },
];

export default function RightInspector({
  play, onPlayChange,
  selectedPlayer, onPlayerChange, onDuplicatePlayer, onRemovePlayer,
  selectedPath, onPathChange, onRemovePath,
}) {
  const [tab, setTab] = useState('play');
  const hasSelection = Boolean(selectedPlayer || selectedPath);

  useEffect(() => {
    if (hasSelection) setTab('selection');
  }, [hasSelection]);

  const selectionLabel = useMemo(() => {
    if (selectedPlayer) return selectedPlayer.display_label || selectedPlayer.position_code || 'Player';
    if (selectedPath) return selectedPath.path_type || 'Path';
    return null;
  }, [selectedPlayer, selectedPath]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card/80 backdrop-blur-xl">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Inspector
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              {hasSelection ? 'Selection properties' : 'Play setup'}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {hasSelection ? selectionLabel : 'Formation, tags, notes, and structure'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-b border-border p-2">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'selection' ? (
          selectedPlayer ? (
            <PlayerInspector
              player={selectedPlayer}
              onChange={onPlayerChange}
              onDuplicate={onDuplicatePlayer}
              onRemove={onRemovePlayer}
            />
          ) : selectedPath ? (
            <PathInspector
              path={selectedPath}
              onChange={onPathChange}
              onRemove={onRemovePath}
            />
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
                <UserRound className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Nothing selected</h3>
              <p className="mt-2 max-w-[18rem] text-xs leading-5 text-muted-foreground">
                Select a player or path on the field to edit alignment, labels, assignment style, and route details.
              </p>
            </div>
          )
        ) : tab === 'notes' ? (
          <div className="p-4">
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              Coaching notes, install notes, and version comments can live here.
            </div>
          </div>
        ) : (
          <PlayMetaPanel play={play} onChange={onPlayChange} />
        )}
      </div>
    </aside>
  );
}