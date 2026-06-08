import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Copy,
  FlipHorizontal,
  MoreHorizontal,
  Star,
  StarOff,
  Printer,
  GitBranch,
  Wand2,
  CheckCircle2,
  Dot,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SIDE_BADGE = {
  offense: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20',
  defense: 'bg-red-500/12 text-red-500 border-red-500/20',
  special_teams: 'bg-amber-500/12 text-amber-600 border-amber-500/20',
};

export default function DesignerHeader({
  play,
  isDirty,
  isSaving,
  isNew,
  onBack,
  onSave,
  onSaveNewVersion,
  onDuplicate,
  onFlip,
  onToggleFav,
  onDelete,
  onPrint,
  onAICreate,
}) {
  const name = play.name || play.play_name || 'Untitled Play';
  const side = play.side || 'offense';
  const statusLabel = isSaving ? 'Saving…' : isDirty ? 'Unsaved changes' : 'Saved';

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 rounded-xl px-2.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Library</span>
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {name}
          </h1>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-[0.12em]",
              SIDE_BADGE[side]
            )}
          >
            {side === 'special_teams' ? 'ST' : side}
          </Badge>

          {play.version > 1 ? (
            <Badge
              variant="outline"
              className="shrink-0 border-border/70 px-1.5 py-0 font-mono text-[10px] text-muted-foreground"
            >
              v{play.version}
            </Badge>
          ) : null}
        </div>

        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {play.formation ? <span className="truncate">{play.formation}</span> : null}
          {play.personnel ? (
            <>
              <Dot className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{play.personnel}</span>
            </>
          ) : null}
          <span className="ml-1 inline-flex items-center gap-1">
            {!isDirty && !isSaving ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <span className={cn("h-2 w-2 rounded-full", isSaving ? "bg-primary" : "bg-amber-400")} />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onAICreate ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-xl px-3 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={onAICreate}
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden md:inline">AI Assist</span>
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={onFlip}
          title="Flip left / right"
        >
          <FlipHorizontal className="h-4 w-4" />
        </Button>

        {onPrint ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={onPrint}
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </Button>
        ) : null}

        <Button
          size="sm"
          disabled={isSaving}
          onClick={onSave}
          className={cn(
            "ml-1 h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold",
            isDirty || isNew
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving…' : isDirty || isNew ? 'Save' : 'Saved'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onSaveNewVersion} className="gap-2">
              <GitBranch className="h-4 w-4" />
              Save as new version
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicate play
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleFav} className="gap-2">
              {play.is_favorite ? (
                <>
                  <StarOff className="h-4 w-4" />
                  Remove from favorites
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Add to favorites
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-destructive focus:text-destructive"
            >
              Delete play
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}