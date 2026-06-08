import React from 'react';
import DesignerCanvas from '@/components/play-designer/DesignerCanvas';

export default function CanvasWorkspace({
  players,
  paths,
  annotations,
  selectedPlayerId,
  selectedPathId,
  activeTool,
  onSelectPlayer,
  onSelectPath,
  onMovePlayer,
  onAddPlayer,
  onCommitPath,
  onDrawingChange,
  diag,
  diagram,
}) {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <div className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur">
          Route tool
        </div>
        <div className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          Click to add points · Double-click to finish
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur hover:bg-card/90 transition-colors">
          Half Field
        </button>
        <button className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur hover:bg-card/90 transition-colors">
          100%
        </button>
      </div>

      <div className="flex h-full items-center justify-center p-6">
        <div className="relative aspect-[5/3] w-full max-w-[1200px] overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <DesignerCanvas
            players={players}
            paths={paths}
            annotations={annotations}
            selectedPlayerId={selectedPlayerId}
            selectedPathId={selectedPathId}
            activeTool={activeTool}
            onSelectPlayer={onSelectPlayer}
            onSelectPath={onSelectPath}
            onMovePlayer={onMovePlayer}
            onAddPlayer={onAddPlayer}
            onCommitPath={onCommitPath}
            onDrawingChange={onDrawingChange}
          />
        </div>
      </div>
    </div>
  );
}