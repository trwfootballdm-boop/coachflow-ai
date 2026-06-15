import React, { useEffect, useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import PlayerInspector from './PlayerInspector';
import PathInspector from './PathInspector';
import PlayMetaPanel from './PlayMetaPanel';
import FormationQuickPanel from './FormationQuickPanel';
import { SlidersHorizontal, UserRound, NotebookPen, LayoutGrid } from "lucide-react";

const TABS = [
  { id: 'play',       icon: SlidersHorizontal, label: 'Play' },
  { id: 'formations', icon: LayoutGrid,        label: 'Formations' },
  { id: 'selection',  icon: UserRound,         label: 'Selection' },
  { id: 'notes',      icon: NotebookPen,       label: 'Notes' },
];

export default function RightInspector({
  play, onPlayChange,
  selectedPlayer, onPlayerChange, onDuplicatePlayer, onRemovePlayer,
  selectedPath, onPathChange, onRemovePath,
  onLoadFormation,
  activeTab,
  onTabChange,
}) {
  const [internalTab, setInternalTab] = useState('play');
  const tab = activeTab !== undefined ? activeTab : internalTab;
  const setTab = onTabChange || setInternalTab;
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Inspector</p>
        <h3 className="text-sm font-semibold text-foreground truncate">
          {hasSelection ? selectionLabel : (play?.formation || 'Play Details')}
        </h3>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-border/50">
        {TABS.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors flex-1",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'formations' ? (
          <FormationQuickPanel
            onLoadFormation={(formation) => {
              onLoadFormation?.(formation);
            }}
          />
        ) : tab === 'selection' ? (
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
            <div className="px-4 py-8 text-center space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Nothing selected</h3>
              <p className="text-xs text-muted-foreground">
                Select a player or path on the field to edit alignment, labels, assignment style, and route details.
              </p>
            </div>
          )
        ) : tab === 'notes' ? (
          <div className="px-4 py-4">
            <p className="text-xs text-muted-foreground">
              Coaching notes, install notes, and version comments can live here.
            </p>
          </div>
        ) : (
          <PlayMetaPanel play={play} onChange={onPlayChange} />
        )}
      </div>
    </div>
  );
}