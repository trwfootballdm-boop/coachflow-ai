import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PanelRight } from "lucide-react";
import RightInspector from '@/components/play-designer/RightInspector';

export default function CollapsibleInspector({
  play,
  onPlayChange,
  selectedPlayer,
  onPlayerChange,
  onDuplicatePlayer,
  onRemovePlayer,
  selectedPath,
  onPathChange,
  onRemovePath,
}) {
  // Closed by default — the field gets all the space until the user opens it
  // or selects something on the canvas.
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('play');

  // Auto-open and switch to the selection tab when the user picks something.
  useEffect(() => {
    if (selectedPlayer || selectedPath) {
      setActiveTab('selection');
      setIsCollapsed(false);
    }
  }, [selectedPlayer, selectedPath]);

  return (
    <>
      {/* Floating toggle pinned to the right edge. Always visible regardless of
          collapsed state so the user can summon the inspector with one click. */}
      <button
        onClick={() => setIsCollapsed(c => !c)}
        aria-label={isCollapsed ? 'Open inspector' : 'Close inspector'}
        className={cn(
          "absolute top-4 z-30 flex h-9 items-center gap-1.5 rounded-l-lg border border-r-0 border-border bg-card/95 backdrop-blur px-2.5 text-xs font-medium text-foreground shadow-md transition-all hover:bg-accent/40",
          isCollapsed ? "right-0" : "right-80"
        )}
        style={{ transition: 'right 300ms ease' }}
      >
        {isCollapsed ? (
          <>
            <PanelRight className="h-3.5 w-3.5" />
            <span>Inspector</span>
          </>
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Sliding inspector panel */}
      <div
        className={cn(
          "relative h-full border-l border-border bg-card overflow-hidden transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-0" : "w-80"
        )}
      >
        {/* Keep RightInspector mounted (just hidden) so it doesn't lose its tab
            state every time the user toggles. */}
        <div className={cn("h-full w-80", isCollapsed && "invisible")}>
          <RightInspector
            play={play}
            onPlayChange={onPlayChange}
            selectedPlayer={selectedPlayer}
            onPlayerChange={onPlayerChange}
            onDuplicatePlayer={onDuplicatePlayer}
            onRemovePlayer={onRemovePlayer}
            selectedPath={selectedPath}
            onPathChange={onPathChange}
            onRemovePath={onRemovePath}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </>
  );
}