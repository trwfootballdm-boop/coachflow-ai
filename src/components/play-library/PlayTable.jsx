import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Edit, Copy, ChevronUp, ChevronDown, PenTool, CheckSquare, Square, ClipboardList, FileText, PowerOff, Power, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SIDE_COLORS = {
  offense: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  defense: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  special_teams: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp className={cn("h-2.5 w-2.5 -mb-0.5", active && sort.dir === 'asc' ? "text-primary" : "text-muted-foreground/40")} />
        <ChevronDown className={cn("h-2.5 w-2.5", active && sort.dir === 'desc' ? "text-primary" : "text-muted-foreground/40")} />
      </span>
    </button>
  );
}

export default function PlayTable({ plays, sort, onSort, selected, onSelect, onSelectAll, onOpen, onEdit, onDuplicate, onToggleFav, onToggleActive, onAddToScript, onAddToGamePlan }) {
  const allSelected = plays.length > 0 && selected.length === plays.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/60 border-b border-border">
            <th className="w-10 px-3 py-3">
              <button onClick={onSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : someSelected ? (
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="w-8 px-2 py-3"></th>
            <th className="w-16 px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Thumb</th>
            <th className="px-3 py-3 text-left"><SortHeader label="Play Name" field="name" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden sm:table-cell">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short</span>
            </th>
            <th className="px-3 py-3 text-left hidden md:table-cell"><SortHeader label="Formation" field="formation" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden lg:table-cell"><SortHeader label="Family" field="play_family" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden lg:table-cell"><SortHeader label="Concept" field="concept" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden xl:table-cell">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dir</span>
            </th>
            <th className="px-3 py-3 text-left hidden xl:table-cell"><SortHeader label="Day" field="install_day" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden xl:table-cell"><SortHeader label="Level" field="age_level_difficulty" sort={sort} onSort={onSort} /></th>
            <th className="px-3 py-3 text-left hidden lg:table-cell">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</span>
            </th>
            <th className="px-3 py-3 text-left hidden xl:table-cell"><SortHeader label="Updated" field="updated_date" sort={sort} onSort={onSort} /></th>
            <th className="w-10 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {plays.map((play) => {
            const isSelected = selected.includes(play.id);
            return (
              <tr
                key={play.id}
                onClick={() => onOpen(play)}
                className={cn(
                  "group transition-colors cursor-pointer",
                  isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-secondary/30"
                )}
              >
                {/* Checkbox */}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelect(play.id)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </td>
                {/* Star */}
                <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFav(play)}
                    className={cn("transition-colors", play.is_favorite ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-400")}
                  >
                    <Star className={cn("h-4 w-4", play.is_favorite && "fill-current")} />
                  </button>
                </td>
                {/* Thumbnail */}
                <td className="px-3 py-3">
                  <div className="h-10 w-16 rounded-md bg-emerald-900/20 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-900/10">
                    <PenTool className="h-4 w-4 text-emerald-700/40" />
                  </div>
                </td>
                {/* Play Name */}
                <td className="px-3 py-3">
                  <div>
                    <p className="font-semibold text-sm leading-tight">{play.name || play.play_name}</p>
                    {play.side && (
                      <span className={cn("text-[10px] font-medium capitalize", SIDE_COLORS[play.side]?.split(' ')[2])}>
                        {play.side?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </td>
                {/* Short Name */}
                <td className="px-3 py-3 hidden sm:table-cell">
                  {play.short_name ? (
                    <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {play.short_name}
                    </code>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
                {/* Formation */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{play.formation || '—'}</span>
                </td>
                {/* Family */}
                <td className="px-3 py-3 hidden lg:table-cell">
                  {play.play_family ? (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {play.play_family}
                    </Badge>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
                {/* Concept */}
                <td className="px-3 py-3 hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">{play.concept || '—'}</span>
                </td>
                {/* Direction */}
                <td className="px-3 py-3 hidden xl:table-cell">
                  <span className="text-sm capitalize text-muted-foreground">{play.direction !== 'any' ? play.direction : '—'}</span>
                </td>
                {/* Install Day */}
                <td className="px-3 py-3 hidden xl:table-cell">
                  {play.install_day ? (
                    <span className="text-xs font-mono text-muted-foreground">D{play.install_day}</span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
                {/* Difficulty */}
                <td className="px-3 py-3 hidden xl:table-cell">
                  {play.age_level_difficulty ? (
                    <Badge variant="secondary" className={cn("text-[10px] capitalize", DIFFICULTY_COLORS[play.age_level_difficulty] || '')}>
                      {play.age_level_difficulty}
                    </Badge>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
                {/* Active */}
                <td className="px-3 py-3 hidden lg:table-cell">
                  <Badge variant={play.is_active !== false ? "default" : "secondary"}
                    className={cn("text-[10px]", play.is_active !== false
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "text-muted-foreground"
                    )}>
                    {play.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                {/* Updated */}
                <td className="px-3 py-3 hidden xl:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {play.updated_date ? format(new Date(play.updated_date), 'MMM d') : '—'}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <FileText className="h-4 w-4 mr-2" /> Add to Practice Script
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}