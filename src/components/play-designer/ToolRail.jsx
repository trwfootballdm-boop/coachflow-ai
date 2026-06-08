import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, LayoutGrid, Undo2, Redo2,
  Type, MessageSquare, MapPin, Route, PlayCircle, Target,
  Shield, Move, Copy, Eraser, PenTool, Footprints
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOOL_SECTIONS = [
  {
    id: 'navigation',
    label: 'Navigate',
    icon: Hand,
    tools: [
      { id: 'select',     icon: MousePointer2, label: 'Select',       shortcut: 'V', description: 'Select and move players' },
      { id: 'pan',        icon: Hand,          label: 'Pan',          shortcut: 'H', description: 'Pan around the field' },
    ],
  },
  {
    id: 'players',
    label: 'Players',
    icon: UserPlus,
    tools: [
      { id: 'add_player',     icon: UserPlus,   label: 'Add Player',      shortcut: 'P', description: 'Place a new player' },
      { id: 'load_formation', icon: LayoutGrid, label: 'Formation',       shortcut: 'F', description: 'Load preset formation' },
    ],
  },
  {
    id: 'routes',
    label: 'Routes',
    icon: Route,
    color: 'blue',
    tools: [
      { id: 'draw_route',   icon: Route,        label: 'Pass Route',      color: '#60a5fa', description: 'Draw receiver route' },
      { id: 'draw_run',     icon: PlayCircle,   label: 'Run Path',        color: '#f59e0b', description: 'Draw runner path' },
      { id: 'draw_motion',  icon: Move,         label: 'Motion',          color: '#a78bfa', description: 'Pre-snap motion' },
    ],
  },
  {
    id: 'blocking',
    label: 'Blocking',
    icon: Target,
    color: 'orange',
    tools: [
      { id: 'draw_block',   icon: Target,       label: 'Block',           color: '#fb923c', description: 'Blocking assignment' },
      { id: 'draw_pull',    icon: Copy,         label: 'Pull',            color: '#f97316', description: 'Pulling lineman' },
    ],
  },
  {
    id: 'defense',
    label: 'Defense',
    icon: Shield,
    color: 'red',
    tools: [
      { id: 'draw_blitz',   icon: Shield,       label: 'Blitz',           color: '#f87171', description: 'Pressure path' },
      { id: 'draw_zone',    icon: Target,       label: 'Zone Drop',       color: '#34d399', description: 'Coverage zone' },
      { id: 'draw_contain', icon: Shield,       label: 'Contain',         color: '#fb7185', description: 'Containment path' },
    ],
  },
  {
    id: 'special',
    label: 'Special',
    icon: PenTool,
    color: 'purple',
    tools: [
      { id: 'draw_ball',    icon: PlayCircle,   label: 'Ball Path',       color: '#fde68a', description: 'Ball trajectory' },
      { id: 'draw_fake',    icon: Eraser,       label: 'Fake',            color: '#c084fc', description: 'Decoy/fake action' },
    ],
  },
  {
    id: 'annotations',
    label: 'Annotate',
    icon: Type,
    tools: [
      { id: 'add_label',  icon: Type,          label: 'Label',           shortcut: 'T', description: 'Add text label' },
      { id: 'add_note',   icon: MessageSquare, label: 'Note',            shortcut: 'N', description: 'Coaching note' },
      { id: 'add_marker', icon: MapPin,        label: 'Marker',          shortcut: 'M', description: 'Field marker' },
    ],
  },
];

function ToolButton({ tool, activeTool, onClick }) {
  const isActive = activeTool === tool.id;
  const Icon = tool.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
            isActive
              ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-xs">{tool.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-white text-xs max-w-[200px]">
        <div className="space-y-0.5">
          <p className="font-semibold">{tool.label}</p>
          {tool.description && <p className="text-gray-400 text-[10px]">{tool.description}</p>}
          {tool.shortcut && <p className="text-gray-500 text-[10px] mt-1">Shortcut: {tool.shortcut}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function ToolSection({ section, activeTool, onSelectTool }) {
  const SectionIcon = section.icon;
  const colorClass = section.color ? `text-${section.color}-400` : 'text-gray-500';

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 px-2 mb-1.5">
        <SectionIcon className={cn("h-3.5 w-3.5", colorClass)} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {section.label}
        </span>
      </div>
      <div className="space-y-0.5">
        {section.tools.map(tool => (
          <ToolButton
            key={tool.id}
            tool={tool}
            activeTool={activeTool}
            onClick={() => onSelectTool(tool.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ToolRail({ activeTool, onSelectTool, onUndo, onRedo }) {
  const handleAction = (id) => {
    if (id === 'undo') { onUndo?.(); return; }
    if (id === 'redo') { onRedo?.(); return; }
    onSelectTool(id);
  };

  return (
    <div className="w-44 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-800">
        <h2 className="text-xs font-semibold text-white tracking-wide">Drawing Tools</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">Design your plays</p>
      </div>

      {/* Tool Sections */}
      <div className="flex-1 px-2 py-3">
        {TOOL_SECTIONS.map((section) => (
          <ToolSection
            key={section.id}
            section={section}
            activeTool={activeTool}
            onSelectTool={handleAction}
          />
        ))}
      </div>

      {/* History Controls */}
      <div className="px-2 py-2 border-t border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleAction('undo')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all text-xs"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white text-xs">
              <p>Undo last action</p>
              <p className="text-gray-500 text-[10px] mt-0.5">⌘Z</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleAction('redo')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all text-xs"
              >
                <Redo2 className="h-3.5 w-3.5" />
                <span>Redo</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white text-xs">
              <p>Redo last action</p>
              <p className="text-gray-500 text-[10px] mt-0.5">⌘Y</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}