import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Save, Copy, FlipHorizontal, MoreHorizontal,
  Star, StarOff, Wand2, GitBranch, LayoutGrid, Library
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SIDE_BADGE = {
  offense:       'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  defense:       'bg-red-500/15 text-red-500 border-red-500/30',
  special_teams: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
};

export default function DesignerCommandBar({
  play, isDirty, isSaving, isNew,
  onBack, onSave, onSaveNewVersion, onDuplicate, onFlip,
  onToggleFav, onDelete, onAICreate,
  onSaveAsFormation, onOpenFormationLibrary,
}) {
  const name = play.name || play.play_name || 'Untitled Play';
  const side = play.side || 'offense';

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-card/90 px-3 backdrop-blur">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
      </button>

      {/* Formation library shortcut */}
      {onOpenFormationLibrary && (
        <button
          onClick={onOpenFormationLibrary}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          title="Formation Library"
        >
          <Library className="h-4 w-4" />
          <span className="hidden sm:inline">Library</span>
        </button>
      )}

      <div className="h-4 w-px bg-border/60" />

      {/* Play name + badges */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{name}</span>
        {play.formation && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
            {play.formation}
          </Badge>
        )}
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0 border', SIDE_BADGE[side] || SIDE_BADGE.offense)}
        >
          {side === 'special_teams' ? 'ST' : side.toUpperCase()}
        </Badge>
        {play.version > 1 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">v{play.version}</Badge>
        )}
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {onAICreate && (
          <Button size="sm" variant="outline" onClick={onAICreate} className="h-8 gap-1.5 text-xs hidden md:flex">
            <Wand2 className="h-3.5 w-3.5" /> AI Create
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={onFlip} className="h-8 px-2" title="Flip horizontally">
          <FlipHorizontal className="h-3.5 w-3.5" />
        </Button>

        {onOpenFormationLibrary && (
          <Button size="sm" variant="outline" onClick={onOpenFormationLibrary} className="h-8 px-2" title="Formation Library">
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        )}

        {onSaveAsFormation && (
          <Button size="sm" variant="outline" onClick={onSaveAsFormation} className="h-8 gap-1.5 text-xs hidden lg:flex">
            <LayoutGrid className="h-3.5 w-3.5" /> Save Formation
          </Button>
        )}

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || (!isDirty && !isNew)}
          className="h-8 gap-1.5 text-xs"
        >
          {isSaving ? null : <Save className="h-3.5 w-3.5" />}
          {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 px-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSaveNewVersion}>
              <GitBranch className="h-4 w-4 mr-2" /> Save as New Version
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" /> Duplicate Play
            </DropdownMenuItem>
            {onSaveAsFormation && (
              <DropdownMenuItem onClick={onSaveAsFormation} className="lg:hidden">
                <LayoutGrid className="h-4 w-4 mr-2" /> Save as Formation
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleFav}>
              {play.is_favorite
                ? <><StarOff className="h-4 w-4 mr-2" /> Remove from Favorites</>
                : <><Star className="h-4 w-4 mr-2" /> Add to Favorites</>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              Delete Play
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}