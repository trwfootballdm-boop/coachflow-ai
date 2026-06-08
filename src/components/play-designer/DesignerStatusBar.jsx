import React from 'react';
import { cn } from "@/lib/utils";

const TOOL_HINTS = {
  select:       'Click to select · Drag to move players',
  pan:          'Drag to pan the field',
  add_player:   'Click on the field to place a player',
  load_formation: 'Choose a saved formation to load',
  draw_route:   'Click to add waypoints · Double-click to finish route',
  draw_run:     'Click to add waypoints · Double-click to finish run path',
  draw_block:   'Click to add waypoints · Double-click to finish block path',
  draw_pull:    'Click to add waypoints · Double-click to finish pull path',
  draw_motion:  'Click to add waypoints · Double-click to finish motion path',
  draw_blitz:   'Click to add waypoints · Double-click to finish blitz path',
  draw_zone:    'Click to add waypoints · Double-click to finish zone drop',
  draw_contain: 'Click to add waypoints · Double-click to finish contain path',
  draw_ball:    'Click to add waypoints · Double-click to finish ball path',
  draw_fake:    'Click to add waypoints · Double-click to finish fake path',
  add_label:    'Click on the field to place a text label',
  add_note:     'Click on the field to place a coaching note',
  add_marker:   'Click on the field to place a landmark marker',
};

export default function DesignerStatusBar({
  activeTool, playerCount, pathCount, selectedType, zoom, drawingPointCount,
  validation, concepts, reaction, timing, adjustments, install
}) {
  const hint = TOOL_HINTS[activeTool] || 'Select a tool to begin';

  return (
    <div className="h-7 bg-gray-950 border-t border-gray-800 flex items-center px-3 gap-4 shrink-0 text-[10px] text-gray-500 font-mono">
      {/* Active tool hint */}
      <span className="flex-1 truncate">{hint}</span>

      {/* Drawing in progress */}
      {drawingPointCount > 0 && (
        <span className="text-amber-400 font-semibold">
          Drawing… {drawingPointCount} pt{drawingPointCount !== 1 ? 's' : ''} · dbl-click to finish · ESC to cancel
        </span>
      )}

      {/* Selection info */}
      {selectedType && (
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[9px] font-bold",
          selectedType === 'player' ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
        )}>
          {selectedType === 'player' ? '● Player' : '⟿ Path'} selected
        </span>
      )}

      {/* Analysis pipeline status */}
      {install && (
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[9px] font-bold",
          install.readyToInstall ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
        )}>
          {install.readyToInstall ? '✓ Ready to install' : '⚠ Needs work'}
        </span>
      )}

      {/* Stats */}
      <div className="flex gap-3 shrink-0">
        <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
        <span>{pathCount} path{pathCount !== 1 ? 's' : ''}</span>
        {zoom !== 1 && <span>zoom {Math.round(zoom * 100)}%</span>}
      </div>
    </div>
  );
}