import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Copy, Star, Power, PowerOff, Trash2, FileText, ClipboardList, GitBranch, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const SIDE_COLORS = {
  offense: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  defense: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  special_teams: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

export default function PlayEditorHeader({
  play, isDirty, isSaving, isNew,
  onBack, onSave, onSaveNewVersion, onDuplicate,
  onToggleFav, onToggleActive, onDelete,
  onAddToScript, onAddToGamePlan,
}) {
  const sideLabel = play.side === 'special_teams' ? 'Special Teams' : play.side ? play.side.charAt(0).toUpperCase() + play.side.slice(1) : '';

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3 px-6 py-3">
        {/* Back */}
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-lg leading-tight truncate">
              {play.name || play.play_name || (isNew ? 'New Play' : 'Untitled Play')}
            </h1>
            {isDirty && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                <AlertCircle className="h-3 w-3" /> Unsaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {play.side && (
              <Badge variant="outline" className={cn("text-[10px] font-semibold capitalize border", SIDE_COLORS[play.side])}>
                {sideLabel}
              </Badge>
            )}
            {play.formation && (
              <span className="text-xs text-muted-foreground truncate">{play.formation}</span>
            )}
            {play.version && (
              <span className="text-[10px] text-muted-foreground/60 font-mono">v{play.version}</span>
            )}
          </div>
        </div>

        {/* Fav + Active quick toggles */}
        <button onClick={onToggleFav} className={cn("shrink-0 p-1.5 rounded-lg transition-colors", play.is_favorite ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400")}>
          <Star className={cn("h-5 w-5", play.is_favorite && "fill-current")} />
        </button>

        {/* Primary Save */}
        <Button
          onClick={onSave}
          disabled={isSaving}
          className={cn("gap-1.5 rounded-xl shrink-0", isDirty && "ring-2 ring-primary/40")}
          size="sm"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>

        {/* More actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0">
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onSaveNewVersion}>
              <GitBranch className="h-4 w-4 mr-2" /> Save as New Version
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" /> Duplicate Play
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onAddToScript}>
              <FileText className="h-4 w-4 mr-2" /> Add to Practice Script
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddToGamePlan}>
              <ClipboardList className="h-4 w-4 mr-2" /> Add to Game Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleActive}>
              {play.is_active !== false
                ? <><PowerOff className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate Play</>
                : <><Power className="h-4 w-4 mr-2 text-emerald-500" /> Activate Play</>
              }
            </DropdownMenuItem>
            {!isNew && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Play
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}