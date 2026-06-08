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
    <div className="flex-1 bg-gray-800 overflow-hidden flex flex-col">
      <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-3 shrink-0">
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Half Field</span>
        <div className="flex gap-1">
          {['Half Field', 'Red Zone', 'Goal Line', 'Full Field'].map(view => (
            <button key={view}
              className="text-[9px] px-1.5 py-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors font-medium">
              {view}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] text-gray-600 font-mono">
            {players?.length || 0}p · {paths?.length || 0} paths
          </span>
          {(diagram?.canUndo || diagram?.canRedo) && (
            <div className="flex gap-1">
              <button disabled={!diagram.canUndo} onClick={diagram.undo}
                className="text-[9px] px-1.5 py-0.5 rounded disabled:opacity-30 text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors font-mono">
                ⌘Z
              </button>
              <button disabled={!diagram.canRedo} onClick={diagram.redo}
                className="text-[9px] px-1.5 py-0.5 rounded disabled:opacity-30 text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors font-mono">
                ⌘Y
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
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
  );
}