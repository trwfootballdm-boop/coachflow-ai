import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Hand,
  UserPlus,
  LayoutGrid,
  Undo2,
  Redo2,
  RotateCcw,
  Type,
  MessageSquare,
  MapPin,
  MoveRight,
  ArrowRight,
  CornerDownRight,
  MoreHorizontal,
} from "lucide-react";

const TOOL_GROUPS = [
  {
    label: 'Primary',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
      { id: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
      { id: 'add_player', icon: UserPlus, label: 'Add player', shortcut: 'P' },
      { id: 'load_formation', icon: LayoutGrid, label: 'Formation', shortcut: 'F' },
    ],
  },
  {
    label: 'Routes',
    tools: [
      { id: 'draw_route', icon: MoveRight, label: 'Route' },
      { id: 'draw_run', icon: ArrowRight, label: 'Run path' },
      { id: 'draw_motion', icon: CornerDownRight, label: 'Motion' },
    ],
  },
  {
    label: 'Annotate',
    tools: [
      { id: 'add_label', icon: Type, label: 'Label', shortcut: 'T' },
      { id: 'add_note', icon: MessageSquare, label: 'Note', shortcut: 'N' },
      { id: 'add_marker', icon: MapPin, label: 'Marker', shortcut: 'M' },
    ],
  },
  {
    label: 'Utility',
    tools: [
      { id: 'undo', icon: Undo2, label: 'Undo', shortcut: '⌘Z', action: true },
      { id: 'redo', icon: Redo2, label: 'Redo', shortcut: '⌘Y', action: true },
      { id: 'reset_view', icon: RotateCcw, label: 'Reset view', action: true },
      { id: 'more_tools', icon: MoreHorizontal, label: 'More tools', action: false },
    ],
  },
];

function ToolButton({ tool, activeTool, onSelect, disabled }) {
  const isActive = activeTool === tool.id && !tool.action;
  const Icon = tool.icon;

  return (
    <button
      type="button"
      aria-label={tool.label}
      disabled={disabled}
      title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
      onClick={() => !disabled && onSelect(tool.id)}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled
          ? "cursor-not-allowed border-transparent text-muted-foreground/35"
          : isActive
          ? "border-primary/30 bg-primary/12 text-primary shadow-sm"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/40 hover:text-foreground"
      )}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.4 : 2} />
    </button>
  );
}

export default function ToolPalette({ activeTool, onSelectTool, onUndo, onRedo, onResetView }) {
  const handleSelect = (id) => {
    if (id === 'undo') return onUndo?.();
    if (id === 'redo') return onRedo?.();
    if (id === 'reset_view') return onResetView?.();
    onSelectTool(id);
  };

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-card/70 py-3 backdrop-blur-xl">
      <div className="flex w-full flex-col items-center gap-1.5">
        {TOOL_GROUPS.map((group, index) => (
          <div key={group.label} className="flex w-full flex-col items-center gap-1.5">
            {index > 0 && <div className="my-1 w-8 border-t border-border/70" />}
            {group.tools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                activeTool={activeTool}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}