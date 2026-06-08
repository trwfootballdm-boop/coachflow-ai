import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Save, Copy, FlipHorizontal, MoreHorizontal,
  Star, StarOff, Wand2, GitBranch
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SIDE_BADGE = {
  offense: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  defense: 'bg-red-500/15 text-red-500 border-red-500/30',
  special_teams: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
};

export default function DesignerCommandBar({
  play, isDirty, isSaving, isNew,
  onBack, onSave, onSaveNewVersion, onDuplicate, onFlip,
  onToggleFav, onDelete, onAICreate,
}) {
  const name = play.name || play.play_name || 'Untitled Play';
  const side = play.side || 'offense';

  return (
    <div className="h-12 bg-gray-950 border-b border-gray-800 flex items-center gap-2 px-3 shrink-0">
      <Button variant="ghost" size="sm"
        className="h-8 gap-1.5 text-gray-400 hover:text-white hover:bg-gray-800 px-2"
        onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="text-xs hidden sm:inline">Library</span>
      </Button>

      <div className="w-px h-5 bg-gray-700 shrink-0" />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate leading-none">{name}</p>
          {play.formation && (
            <p className="text-[10px] text-gray-500 truncate leading-none mt-0.5">{play.formation}</p>
          )}
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-bold px-1.5 py-0 shrink-0 border", SIDE_BADGE[side])}>
          {side === 'special_teams' ? 'ST' : side.toUpperCase()}
        </Badge>
        {play.version > 1 && (
          <Badge variant="outline" className="text-[10px] font-mono text-gray-400 border-gray-700 px-1.5 py-0 shrink-0">
            v{play.version}
          </Badge>
        )}
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onAICreate && (
          <Button
            variant="ghost" size="sm"
            className="h-8 gap-1.5 px-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs font-bold"
            onClick={onAICreate}
            title="AI Play Creator"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Create</span>
          </Button>
        )}

        <Button variant="ghost" size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={onFlip} title="Flip Left/Right">
          <FlipHorizontal className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          disabled={isSaving}
          onClick={onSave}
          className={cn(
            "h-8 gap-1.5 text-xs font-bold rounded-lg px-3 transition-all",
            isDirty
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          )}
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-700 text-gray-200">
            <DropdownMenuItem onClick={onSaveNewVersion} className="gap-2 hover:bg-gray-800">
              <GitBranch className="h-3.5 w-3.5" /> Save as New Version
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate} className="gap-2 hover:bg-gray-800">
              <Copy className="h-3.5 w-3.5" /> Duplicate Play
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleFav} className="gap-2 hover:bg-gray-800">
              {play.is_favorite
                ? <><StarOff className="h-3.5 w-3.5" /> Remove from Favorites</>
                : <><Star className="h-3.5 w-3.5" /> Add to Favorites</>}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={onDelete}
              className="gap-2 text-red-400 hover:text-red-300 hover:bg-gray-800 focus:text-red-300">
              Delete Play
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}