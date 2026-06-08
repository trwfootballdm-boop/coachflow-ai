import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import PlayerInspector from './PlayerInspector';
import PathInspector from './PathInspector';
import PlayMetaPanel from './PlayMetaPanel';
import { Sliders, User, GitBranch } from "lucide-react";

const TABS = [
  { id: 'meta',   icon: Sliders,    label: 'Play' },
  { id: 'object', icon: User,       label: 'Object' },
];

export default function RightInspector({
  play, onPlayChange,
  selectedPlayer, onPlayerChange, onDuplicatePlayer, onRemovePlayer,
  selectedPath,   onPathChange,   onRemovePath,
}) {
  const [tab, setTab] = useState('meta');

  // Auto-switch to object tab on selection
  const activeTab = (selectedPlayer || selectedPath) ? 'object' : tab;

  return (
    <div className="w-64 bg-gray-950 border-l border-gray-800 flex flex-col shrink-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors",
              activeTab === t.id
                ? "text-white border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'object' ? (
          <>
            {selectedPlayer ? (
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
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                  <Sliders className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500">Select a player or path on the field to edit its properties.</p>
              </div>
            )}
          </>
        ) : (
          <PlayMetaPanel play={play} onChange={onPlayChange} />
        )}
      </div>
    </div>
  );
}