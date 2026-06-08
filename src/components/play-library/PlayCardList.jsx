import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Edit, Copy, PenTool, CheckSquare, Square, ClipboardList, FileText, PowerOff, Power, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function PlayCardList({ plays, selected, onSelect, onOpen, onEdit, onDuplicate, onToggleFav, onToggleActive, onAddToScript, onAddToGamePlan }) {
  return (
    <div className="space-y-2">
      {plays.map(play => {
        const isSelected = selected.includes(play.id);
        return (
          <div
            key={play.id}
            onClick={() => onOpen(play)}
            className={cn(
              "bg-card border rounded-xl p-4 cursor-pointer transition-all",
              isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border hover:border-border/80 hover:shadow-sm"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button onClick={(e) => { e.stopPropagation(); onSelect(play.id); }} className="mt-0.5 shrink-0">
                {isSelected
                  ? <CheckSquare className="h-4 w-4 text-primary" />
                  : <Square className="h-4 w-4 text-muted-foreground/40" />
                }
              </button>

              {/* Thumbnail */}
              <div className="h-12 w-16 rounded-lg bg-emerald-900/20 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-900/10 shrink-0">
                <PenTool className="h-4 w-4 text-emerald-700/40" />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm leading-tight truncate">{play.name || play.play_name}</p>
                      {play.is_favorite && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    {play.short_name && (
                      <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground mt-0.5 inline-block">
                        {play.short_name}
                      </code>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onToggleFav(play)} className={cn("p-1.5 rounded-lg", play.is_favorite ? "text-amber-500" : "text-muted-foreground/30")}>
                      <Star className={cn("h-3.5 w-3.5", play.is_favorite && "fill-current")} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onOpen(play)}>
                          <Zap className="h-4 w-4 mr-2 text-primary" /> Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(play)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit Play
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(play)}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAddToScript(play)}>
                          <FileText className="h-4 w-4 mr-2" /> Add to Script
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddToGamePlan(play)}>
                          <ClipboardList className="h-4 w-4 mr-2" /> Add to Game Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleActive(play)}>
                          {play.is_active !== false
                            ? <><PowerOff className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate</>
                            : <><Power className="h-4 w-4 mr-2 text-emerald-500" /> Activate</>
                          }
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {play.formation && (
                    <span className="text-[11px] text-muted-foreground">{play.formation}</span>
                  )}
                  {play.play_family && (
                    <Badge variant="secondary" className="text-[10px]">{play.play_family}</Badge>
                  )}
                  {play.age_level_difficulty && (
                    <Badge variant="secondary" className={cn("text-[10px] capitalize", DIFFICULTY_COLORS[play.age_level_difficulty] || '')}>
                      {play.age_level_difficulty}
                    </Badge>
                  )}
                  {play.install_day && (
                    <span className="text-[10px] font-mono text-muted-foreground">D{play.install_day}</span>
                  )}
                  <Badge variant={play.is_active !== false ? "default" : "secondary"}
                    className={cn("text-[10px] ml-auto", play.is_active !== false
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "text-muted-foreground"
                    )}>
                    {play.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}