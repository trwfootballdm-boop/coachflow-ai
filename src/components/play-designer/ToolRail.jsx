import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, LayoutGrid, Undo2, Redo2,
  RotateCcw, Type, MessageSquare, MapPin
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
];

function ToolRailButton({ tool, activeTool, onSelect }) {
  const isActive = activeTool === tool.id;
  const Icon = tool.icon;
  const pathColor = tool.color;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onSelect(tool.id)}
          className={cn(
            "group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all",
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
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs">
        <p>{tool.label}</p>
        {tool.shortcut && <p className="text-gray-500 text-[10px]">{tool.shortcut}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ToolRail({ activeTool, onSelectTool, onUndo, onRedo }) {
  const handleSelect = (id) => {
    if (id === 'undo') { onUndo?.(); return; }
    if (id === 'redo') { onRedo?.(); return; }
    onSelectTool(id);
  };

  return (
    <div className="w-11 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-2 gap-1 shrink-0">
      {TOOL_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="w-6 h-px bg-gray-800 my-0.5" />}
          {group.tools.map(tool => (
            <ToolRailButton
              key={tool.id}
              tool={tool}
              activeTool={activeTool}
              onSelect={handleSelect}
            />
          ))}
        </React.Fragment>
      ))}
      
      <div className="w-6 h-px bg-gray-800 my-0.5" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onUndo}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs">
          <p>Undo</p>
          <p className="text-gray-500 text-[10px]">⌘Z</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRedo}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs">
          <p>Redo</p>
          <p className="text-gray-500 text-[10px]">⌘Y</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}