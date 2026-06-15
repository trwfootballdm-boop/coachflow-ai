import React from 'react';
import { cn } from "@/lib/utils";
import {
  MousePointer2, Hand, UserPlus, LayoutGrid, Undo2, Redo2,
  Type, MessageSquare, MapPin, Route, PlayCircle, Target,
  Shield, Move, Copy, Eraser, PenTool
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Compact icon-only tool sections. Each section is separated by a subtle divider.
const TOOL_SECTIONS = [
  {
    id: 'navigation',
    tools: [
      { id: 'select',     icon: MousePointer2, label: 'Select',     shortcut: 'V', description: 'Select and drag players' },
      { id: 'pan',        icon: Hand,          label: 'Pan',        shortcut: 'H', description: 'Pan around the field' },
    ],
  },
  {
    id: 'players',
    tools: [
      { id: 'add_player',     icon: UserPlus,   label: 'Add Player', shortcut: 'P', description: 'Place a new player' },
      { id: 'load_formation', icon: LayoutGrid, label: 'Formation',  shortcut: 'F', description: 'Load preset formation' },
    ],
  },
  {
    id: 'routes',
    tools: [
      { id: 'draw_route',  icon: Route,      label: 'Pass Route', color: '#60a5fa', description: 'Draw a receiver route' },
      { id: 'draw_run',    icon: PlayCircle, label: 'Run Path',   color: '#f59e0b', description: 'Draw a runner path' },
      { id: 'draw_motion', icon: Move,       label: 'Motion',     color: '#a78bfa', description: 'Pre-snap motion' },
    ],
  },
  {
    id: 'blocking',
    tools: [
      { id: 'draw_block', icon: Target, label: 'Block', color: '#fb923c', description: 'Blocking assignment' },
      { id: 'draw_pull',  icon: Copy,   label: 'Pull',  color: '#f97316', description: 'Pulling lineman' },
    ],
  },
  {
    id: 'defense',
    tools: [
      { id: 'draw_blitz',   icon: Shield, label: 'Blitz',     color: '#f87171', description: 'Pressure path' },
      { id: 'draw_zone',    icon: Target, label: 'Zone Drop', color: '#34d399', description: 'Coverage zone' },
      { id: 'draw_contain', icon: Shield, label: 'Contain',   color: '#fb7185', description: 'Containment path' },
    ],
  },
  {
    id: 'special',
    tools: [
      { id: 'draw_ball', icon: PlayCircle, label: 'Ball Path', color: '#fde68a', description: 'Ball trajectory' },
      { id: 'draw_fake', icon: Eraser,     label: 'Fake',      color: '#c084fc', description: 'Decoy / fake action' },
    ],
  },
  {
    id: 'annotations',
    tools: [
      { id: 'add_label',  icon: Type,          label: 'Label',  shortcut: 'T', description: 'Add a text label' },
      { id: 'add_note',   icon: MessageSquare, label: 'Note',   shortcut: 'N', description: 'Coaching note' },
      { id: 'add_marker', icon: MapPin,        label: 'Marker', shortcut: 'M', description: 'Field marker' },
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
          aria-label={tool.label}
          aria-pressed={isActive}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all",
            isActive
              ? "bg-primary/15 text-primary ring-1 ring-primary/40 shadow-[0_0_0_1px_rgba(96,165,250,0.15)_inset]"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          )}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={isActive ? 2.4 : 2}
            style={!isActive && tool.color ? { color: tool.color } : undefined}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground text-xs max-w-[220px]">
        <div className="space-y-0.5">
          <p className="font-semibold">{tool.label}</p>
          {tool.description && <p className="text-muted-foreground text-[10px]">{tool.description}</p>}
          {tool.shortcut && <p className="text-muted-foreground/70 text-[10px] mt-1">Shortcut: {tool.shortcut}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ToolRail({ activeTool, onSelectTool, onUndo, onRedo }) {
  return (
    <div className="w-14 shrink-0 bg-card border-r border-border flex flex-col items-center py-2 gap-1 overflow-y-auto overflow-x-hidden">
      {TOOL_SECTIONS.map((section, idx) => (
        <React.Fragment key={section.id}>
          {idx > 0 && <div className="my-1 h-px w-7 bg-border" />}
          {section.tools.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              activeTool={activeTool}
              onClick={() => onSelectTool(tool.id)}
            />
          ))}
        </React.Fragment>
      ))}

      <div className="mt-auto pt-2 flex flex-col gap-1 border-t border-border w-full items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onUndo}
              aria-label="Undo"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
            >
              <Undo2 className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground text-xs">
            <p className="font-semibold">Undo</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">⌘Z</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRedo}
              aria-label="Redo"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
            >
              <Redo2 className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground text-xs">
            <p className="font-semibold">Redo</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">⌘Y</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}