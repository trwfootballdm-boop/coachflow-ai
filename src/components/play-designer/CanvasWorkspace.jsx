import React from 'react';
import DesignerCanvas from '@/components/play-designer/DesignerCanvas';

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
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="flex h-full items-center justify-center p-6">
        <div className="relative aspect-[5/3] w-full max-w-[1200px] overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
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
      </div>
    </div>
  );
}