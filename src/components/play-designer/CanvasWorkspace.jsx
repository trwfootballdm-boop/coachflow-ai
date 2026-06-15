import React from 'react';
import DesignerCanvas from '@/components/play-designer/DesignerCanvas';

// Thin wrapper that hands the canvas the full available area. All chrome
// (tool chips, zoom indicator, status counts) lives inside DesignerCanvas
// so it's tool-aware and never duplicated.
export default function CanvasWorkspace({
  players,
  paths,
  annotations,
  selectedPlayerId,
  selectedPathId,
  activeTool,
  isAnimating,
  animationSpeed,
  onAnimationEnd,
  onSelectPlayer,
  onSelectPath,
  onMovePlayer,
  onCommitMove,
  onAddPlayer,
  onCommitPath,
  onDrawingChange,
}) {
  return (
    <div className="relative flex-1 min-h-0 w-full bg-background">
      <DesignerCanvas
        players={players}
        paths={paths}
        annotations={annotations}
        selectedPlayerId={selectedPlayerId}
        selectedPathId={selectedPathId}
        activeTool={activeTool}
        isAnimating={isAnimating}
        animationSpeed={animationSpeed}
        onAnimationEnd={onAnimationEnd}
        onSelectPlayer={onSelectPlayer}
        onSelectPath={onSelectPath}
        onMovePlayer={onMovePlayer}
        onCommitMove={onCommitMove}
        onAddPlayer={onAddPlayer}
        onCommitPath={onCommitPath}
        onDrawingChange={onDrawingChange}
      />
    </div>
  );
}