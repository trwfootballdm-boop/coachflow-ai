import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('play');

  // Auto-switch to selection tab when something is selected
  React.useEffect(() => {
    if (selectedPlayer || selectedPath) {
      setActiveTab('selection');
      setIsCollapsed(false);
    }
  }, [selectedPlayer, selectedPath]);

  return (
    <div
      className={cn(
        "relative border-l border-border bg-card transition-all duration-300",
        isCollapsed ? "w-0" : "w-80"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-accent/10 transition-colors"
      >
        {isCollapsed ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {!isCollapsed && (
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
      )}
    </div>
  );
}