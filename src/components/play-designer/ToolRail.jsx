import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, LayoutGrid, Undo2, Redo2,
  Type, MessageSquare, MapPin, Route, PlayCircle, Target,
  Shield, Move, Copy, Eraser
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOOL_GROUPS = [
  {
    label: 'Navigation',
    tools: [
      { id: 'select',     icon: MousePointer2, label: 'Select',       shortcut: 'V', description: 'Select and move players' },
      { id: 'pan',        icon: Hand,          label: 'Pan',          shortcut: 'H', description: 'Pan around the field' },
    ],
  },
  {
    label: 'Players',
    tools: [
      { id: 'add_player',     icon: UserPlus,   label: 'Add Player',      shortcut: 'P', description: 'Place a new player' },
      { id: 'load_formation', icon: LayoutGrid, label: 'Formation',       shortcut: 'F', description: 'Load preset formation' },
    ],
  },
  {
    label: 'Route Tools',
    accent: 'blue',
    tools: [
      { id: 'draw_route',   icon: Route,        label: 'Pass Route',      color: '#60a5fa', description: 'Draw receiver route' },
      { id: 'draw_run',     icon: PlayCircle,   label: 'Run Path',        color: '#f59e0b', description: 'Draw runner path' },
      { id: 'draw_motion',  icon: Move,         label: 'Motion',          color: '#a78bfa', description: 'Pre-snap motion' },
    ],
  },
  {
    label: 'Blocking & Protection',
    accent: 'orange',
    tools: [
      { id: 'draw_block',   icon: Target,       label: 'Block',           color: '#fb923c', description: 'Blocking assignment' },
      { id: 'draw_pull',    icon: Copy,         label: 'Pull',            color: '#f97316', description: 'Pulling lineman' },
    ],
  },
  {
    label: 'Defense',
    accent: 'red',
    tools: [
      { id: 'draw_blitz',   icon: Shield,       label: 'Blitz',           color: '#f87171', description: 'Pressure path' },
      { id: 'draw_zone',    icon: Target,       label: 'Zone Drop',       color: '#34d399', description: 'Coverage zone' },
      { id: 'draw_contain', icon: Shield,       label: 'Contain',         color: '#fb7185', description: 'Containment path' },
    ],
  },
  {
    label: 'Special',
    accent: 'purple',
    tools: [
      { id: 'draw_ball',    icon: PlayCircle,   label: 'Ball Path',       color: '#fde68a', description: 'Ball trajectory' },
      { id: 'draw_fake',    icon: Eraser,       label: 'Fake',            color: '#c084fc', description: 'Decoy/fake action' },
    ],
  },
  {
    label: 'Annotations',
    tools: [
      { id: 'add_label',  icon: Type,          label: 'Label',           shortcut: 'T', description: 'Add text label' },
      { id: 'add_note',   icon: MessageSquare, label: 'Note',            shortcut: 'N', description: 'Coaching note' },
      { id: 'add_marker', icon: MapPin,        label: 'Marker',          shortcut: 'M', description: 'Field marker' },
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
            "group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all mb-0.5",
            isActive
              ? "bg-primary/20 text-primary ring-1 ring-primary/40 shadow-lg shadow-primary/10"
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
      <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs max-w-[180px]">
        <div className="space-y-0.5">
          <p className="font-semibold">{tool.label}</p>
          {tool.description && <p className="text-gray-400 text-[9px]">{tool.description}</p>}
          {tool.shortcut && <p className="text-gray-500 text-[9px] mt-1">Shortcut: {tool.shortcut}</p>}
        </div>
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
    <div className="w-12 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-3 gap-0.5 shrink-0 overflow-y-auto">
      {TOOL_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="w-7 h-px bg-gray-800 my-1.5" />}
          {group.label && (
            <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-600 mb-0.5 px-1 text-center">
              {group.label}
            </div>
          )}
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
      
      <div className="w-7 h-px bg-gray-800 my-1.5" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onUndo}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all mb-0.5"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs">
          <p>Undo</p>
          <p className="text-gray-500 text-[9px] mt-0.5">⌘Z</p>
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
          <p className="text-gray-500 text-[9px] mt-0.5">⌘Y</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}