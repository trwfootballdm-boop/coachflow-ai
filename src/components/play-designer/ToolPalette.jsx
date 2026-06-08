import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, LayoutGrid, Undo2, Redo2,
  RotateCcw, Type, MessageSquare, MapPin, Minus
} from "lucide-react";

// Football-specific path tool icons mapped from lucide
const TOOL_GROUPS = [
  {
    label: 'Select',
    tools: [
      { id: 'select',     icon: MousePointer2, label: 'Select',       shortcut: 'V' },
      { id: 'pan',        icon: Hand,          label: 'Pan',          shortcut: 'H' },
    ],
  },
  {
    label: 'Players',
    tools: [
      { id: 'add_player',     icon: UserPlus,   label: 'Add Player',      shortcut: 'P' },
      { id: 'load_formation', icon: LayoutGrid, label: 'Load Formation',   shortcut: 'F' },
    ],
  },
  {
    label: 'Paths',
    tools: [
      { id: 'draw_route',   label: 'Route',       color: '#60a5fa', symbol: '→' },
      { id: 'draw_run',     label: 'Run Path',    color: '#f59e0b', symbol: '⇒' },
      { id: 'draw_block',   label: 'Block',       color: '#fb923c', symbol: '⊠' },
      { id: 'draw_pull',    label: 'Pull',        color: '#fb923c', symbol: '↪' },
      { id: 'draw_motion',  label: 'Motion',      color: '#a78bfa', symbol: '↝' },
      { id: 'draw_blitz',   label: 'Blitz',       color: '#f87171', symbol: '↯' },
      { id: 'draw_zone',    label: 'Zone Drop',   color: '#34d399', symbol: '◎' },
      { id: 'draw_contain', label: 'Contain',     color: '#fb7185', symbol: '⊃' },
      { id: 'draw_ball',    label: 'Ball Path',   color: '#fde68a', symbol: '●' },
      { id: 'draw_fake',    label: 'Fake',        color: '#c084fc', symbol: '⌀' },
    ],
  },
  {
    label: 'Annotate',
    tools: [
      { id: 'add_label',  icon: Type,          label: 'Add Label',       shortcut: 'T' },
      { id: 'add_note',   icon: MessageSquare, label: 'Coaching Note',   shortcut: 'N' },
      { id: 'add_marker', icon: MapPin,        label: 'Landmark',        shortcut: 'M' },
    ],
  },
  {
    label: 'History',
    tools: [
      { id: 'undo', icon: Undo2,   label: 'Undo', shortcut: '⌘Z', action: true },
      { id: 'redo', icon: Redo2,   label: 'Redo', shortcut: '⌘Y', action: true },
      { id: 'reset_view', icon: RotateCcw, label: 'Reset View', action: true },
    ],
  },
];

function ToolButton({ tool, activeTool, onSelect }) {
  const isActive = activeTool === tool.id && !tool.action;
  const Icon = tool.icon;
  const pathColor = tool.color;

  return (
    <button
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      onClick={() => onSelect(tool.id)}
      className={cn(
        "group relative w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-all",
        isActive
          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
    >
      {Icon ? (
        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
      ) : (
        <span
          className="text-base leading-none font-bold"
          style={{ color: isActive ? pathColor : undefined }}
        >
          {tool.symbol}
        </span>
      )}
      {/* Tooltip label */}
      <span className={cn(
        "absolute left-full ml-2 px-2 py-1 text-[10px] font-medium whitespace-nowrap rounded z-50",
        "bg-gray-900 text-white border border-gray-700 shadow-lg pointer-events-none",
        "opacity-0 group-hover:opacity-100 transition-opacity delay-300"
      )}>
        {tool.label}
        {tool.shortcut && <span className="ml-1.5 text-gray-500">{tool.shortcut}</span>}
      </span>
    </button>
  );
}

export default function ToolPalette({ activeTool, onSelectTool, onUndo, onRedo, onResetView }) {
  const handleSelect = (id) => {
    if (id === 'undo') { onUndo?.(); return; }
    if (id === 'redo') { onRedo?.(); return; }
    if (id === 'reset_view') { onResetView?.(); return; }
    onSelectTool(id);
  };

  return (
    <div className="w-14 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-2 gap-0.5 overflow-y-auto shrink-0">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col items-center w-full">
          {gi > 0 && <div className="w-8 h-px bg-gray-800 my-1.5" />}
          {group.tools.map(tool => (
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
  );
}