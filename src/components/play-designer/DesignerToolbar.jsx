import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, Grid3X3,
  ArrowRight, ArrowUp, Shield, ChevronRight,
  Move, Zap, Target, Circle, Type,
  MessageSquare, Flag, Undo2, Redo2, RefreshCw, Play
} from "lucide-react";

const TOOL_GROUPS = [
  {
    label: 'Select',
    tools: [
      { id: 'select',  icon: MousePointer2, label: 'Select',       shortcut: 'V' },
      { id: 'pan',     icon: Hand,          label: 'Pan',           shortcut: 'H' },
    ],
  },
  {
    label: 'Add',
    tools: [
      { id: 'add_player',    icon: UserPlus,   label: 'Add Player',      shortcut: 'A' },
      { id: 'load_formation', icon: Grid3X3,   label: 'Load Formation',  shortcut: 'F' },
    ],
  },
  {
    label: 'Paths',
    tools: [
      { id: 'draw_route',   icon: ArrowRight,   label: 'Draw Route',       shortcut: 'R', color: '#60a5fa' },
      { id: 'draw_run',     icon: ArrowUp,      label: 'Draw Run Path',    shortcut: 'U', color: '#f59e0b' },
      { id: 'draw_block',   icon: Shield,       label: 'Draw Block',       shortcut: 'B', color: '#fb923c' },
      { id: 'draw_pull',    icon: ChevronRight, label: 'Draw Pull',        shortcut: 'P', color: '#fb923c' },
      { id: 'draw_motion',  icon: Move,         label: 'Draw Motion',      shortcut: 'M', color: '#a78bfa' },
      { id: 'draw_blitz',   icon: Zap,          label: 'Draw Blitz',       shortcut: 'Z', color: '#f87171' },
      { id: 'draw_zone',    icon: Target,       label: 'Draw Zone Drop',   shortcut: 'D', color: '#34d399' },
      { id: 'draw_contain', icon: Circle,       label: 'Draw Contain',     shortcut: 'C', color: '#f87171' },
      { id: 'draw_ball',    icon: Flag,         label: 'Draw Ball Path',   shortcut: 'L', color: '#fde68a' },
    ],
  },
  {
    label: 'Notes',
    tools: [
      { id: 'add_label', icon: Type,          label: 'Add Label',        shortcut: 'T' },
      { id: 'add_note',  icon: MessageSquare, label: 'Add Note',         shortcut: 'N' },
      { id: 'add_landmark', icon: Flag,        label: 'Add Landmark',     shortcut: 'K' },
    ],
  },
];

export default function DesignerToolbar({ activeTool, onSelectTool, onUndo, onRedo, onReset, canUndo, canRedo }) {
  return (
    <div className="flex flex-col w-12 bg-card/95 border-r border-border py-2 gap-0.5 shrink-0 overflow-y-auto">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi}>
          {/* Group divider (except first) */}
          {gi > 0 && <div className="mx-2 my-1.5 border-t border-border/50" />}

          {group.tools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <div key={tool.id} className="relative group px-1.5">
                <button
                  onClick={() => onSelectTool(tool.id)}
                  className={cn(
                    "w-full h-9 flex items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  style={isActive && tool.color ? { background: tool.color + 'CC' } : {}}
                  title={`${tool.label} (${tool.shortcut})`}
                >
                  <Icon className="h-4 w-4" />
                </button>

                {/* Tooltip */}
                <div className="absolute left-12 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity delay-150">
                  <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap flex items-center gap-2">
                    <span className="text-xs font-medium">{tool.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground bg-secondary px-1 py-0.5 rounded">{tool.shortcut}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Bottom actions */}
      <div className="mt-auto pt-2 border-t border-border/50 px-1.5 space-y-0.5">
        <button onClick={onUndo} disabled={!canUndo}
          className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-30 group relative"
          title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button onClick={onRedo} disabled={!canRedo}
          className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-30"
          title="Redo">
          <Redo2 className="h-4 w-4" />
        </button>
        <button onClick={onReset}
          className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          title="Reset view">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}