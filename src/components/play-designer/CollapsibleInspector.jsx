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
  onLoadFormation,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('play');

  useEffect(() => {
    if (selectedPlayer || selectedPath) {
      setActiveTab('selection');
      setIsCollapsed(false);
    }
  }, [selectedPlayer, selectedPath]);

  return (
    <>
      {/* Floating toggle */}
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
            Inspector
          </>
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Sliding panel */}
      <div
        className={cn(
          "shrink-0 w-80 border-l border-border bg-card overflow-hidden transition-all duration-300",
          isCollapsed ? "w-0 border-0" : "w-80"
        )}
      >
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
          onLoadFormation={onLoadFormation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </>
  );
}