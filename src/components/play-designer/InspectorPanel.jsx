import React from 'react';
import RightInspector from '@/components/play-designer/RightInspector';

export default function InspectorPanel({
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
  return (
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
    />
  );
}