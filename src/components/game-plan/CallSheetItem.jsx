import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal, Star, AlertTriangle, CheckCircle2,
  ExternalLink, Trash2, StickyNote, X
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  1: 'bg-red-500 text-white',
  2: 'bg-amber-500 text-white',
  3: 'bg-secondary text-muted-foreground',
};

const DAY_ABBR = { monday_install: 'MON', tuesday_team: 'TUE', wednesday_polish: 'WED', thursday_walkthrough: 'THU' };

export default function CallSheetItem({ item, play, index, onRemove, onUpdate, onOpenDetail, printMode }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(item.coach_note || '');

  const practiced = item.practiced_this_week;
  const days = item.practiced_day ? item.practiced_day.split(',').map(d => d.trim()) : [];

  const priorityStyle = PRIORITY_STYLES[item.call_sheet_priority] || PRIORITY_STYLES[3];

  if (printMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
        <span className="font-mono text-muted-foreground w-5 shrink-0">{index + 1}.</span>
        {item.is_opener && item.opener_sequence && (
          <span className="text-[10px] font-bold text-primary w-4 shrink-0">#{item.opener_sequence}</span>
        )}
        <span className="font-bold flex-1">{play?.play_name || '—'}</span>
        <span className="text-muted-foreground font-mono text-[10px] w-16 shrink-0">{play?.short_name || ''}</span>
        <span className="text-muted-foreground text-[10px] w-24 shrink-0 truncate">{play?.formation_id ? '' : ''}{play?.concept || ''}</span>
        <span className={cn("text-[10px] font-bold w-8 shrink-0", practiced ? "text-emerald-600" : "text-amber-600")}>
          {practiced ? 'PREP' : 'NP'}
        </span>
        {item.coach_note && <span className="text-[10px] text-muted-foreground italic truncate max-w-[120px]">{item.coach_note}</span>}
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-secondary/20",
      item.is_opener && "bg-primary/3"
    )}>
      {/* Priority badge */}
      <span className={cn("text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer", priorityStyle)}
        onClick={() => onUpdate({ call_sheet_priority: item.call_sheet_priority === 1 ? 3 : item.call_sheet_priority === 3 ? 2 : 1 })}>
        {item.call_sheet_priority || '—'}
      </span>

      {/* Opener badge */}
      {item.is_opener && (
        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded shrink-0">
          #{item.opener_sequence || '?'}
        </span>
      )}

      {/* Play info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold truncate">{play?.play_name || <span className="text-muted-foreground italic">Unknown play</span>}</span>
          {play?.short_name && <code className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{play.short_name}</code>}
          {play?.favorite && <Star className="h-3 w-3 text-amber-400 fill-current shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {play?.concept && <span className="text-[10px] text-muted-foreground">{play.concept}</span>}
          {play?.run_pass_type && (
            <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded",
              play.run_pass_type === 'run' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
              play.run_pass_type === 'pass' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400' :
              'bg-amber-500/10 text-amber-700 dark:text-amber-400'
            )}>
              {play.run_pass_type.toUpperCase()}
            </span>
          )}
          {item.situational_role && (
            <span className="text-[10px] text-muted-foreground italic">{item.situational_role}</span>
          )}
          {item.coach_note && !editingNote && (
            <span className="text-[10px] text-muted-foreground/70 italic truncate max-w-[140px]">"{item.coach_note}"</span>
          )}
          {editingNote && (
            <div className="flex items-center gap-1">
              <Input
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdate({ coach_note: noteVal }); setEditingNote(false); }
                  if (e.key === 'Escape') { setNoteVal(item.coach_note || ''); setEditingNote(false); }
                }}
                autoFocus
                className="h-5 text-[10px] py-0 px-1.5 bg-secondary border-0 w-40"
                placeholder="Add note..."
              />
              <button onClick={() => { onUpdate({ coach_note: noteVal }); setEditingNote(false); }}
                className="text-[10px] text-primary font-bold">✓</button>
              <button onClick={() => { setNoteVal(item.coach_note || ''); setEditingNote(false); }}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Practiced status */}
      <div className="shrink-0 flex items-center gap-1">
        {practiced ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {days.length > 0 && (
              <div className="hidden sm:flex gap-0.5">
                {days.map(d => (
                  <span key={d} className="text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1 rounded">
                    {DAY_ABBR[d] || d.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hidden sm:block">NP</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onOpenDetail}>
          <ExternalLink className="h-3 w-3" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs w-44">
            <DropdownMenuItem onClick={() => setEditingNote(true)}>
              <StickyNote className="h-3.5 w-3.5 mr-2" /> Edit note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate({ is_opener: !item.is_opener })}>
              <Star className="h-3.5 w-3.5 mr-2" /> {item.is_opener ? 'Remove from Openers' : 'Mark as Opener'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate({ practiced_this_week: !practiced })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> {practiced ? 'Mark unpracticed' : 'Mark practiced'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}