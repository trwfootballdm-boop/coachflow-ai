import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, ChevronDown, ChevronRight, MoreVertical, Trash2,
  ArrowUp, ArrowDown, Star, CheckCircle2, AlertTriangle, Edit2, Check, X
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SECTION_COLORS = {
  openers: 'bg-emerald-700 text-white',
  base_runs: 'bg-slate-700 text-white',
  base_passes: 'bg-slate-700 text-white',
  third_short: 'bg-blue-700 text-white',
  third_medium: 'bg-blue-700 text-white',
  third_long: 'bg-blue-700 text-white',
  red_zone: 'bg-red-700 text-white',
  goal_line: 'bg-red-900 text-white',
  backed_up: 'bg-gray-700 text-white',
  two_minute: 'bg-amber-700 text-white',
  four_minute: 'bg-amber-800 text-white',
  shot_plays: 'bg-purple-700 text-white',
  specials: 'bg-indigo-700 text-white',
  custom: 'bg-slate-600 text-white',
};

function PracticedBadge({ days }) {
  if (!days || days.length === 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
        <AlertTriangle className="h-2.5 w-2.5" /> None
      </span>
    );
  }
  const dayLabels = days.map(d => d.slice(0, 3).toUpperCase());
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
      <CheckCircle2 className="h-2.5 w-2.5" /> {dayLabels.join('/')}
    </span>
  );
}

function CallSheetRow({ item, play, practicedDays, onRemove, onUpdate, index, isFirst, isLast }) {
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(item.coach_note || '');

  const saveNote = () => {
    onUpdate(item.id, { coach_note: note });
    setEditingNote(false);
  };

  if (!play) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm transition-colors group hover:bg-secondary/20",
      item.is_opener && "bg-emerald-500/5",
      item.call_sheet_priority === 1 && "bg-amber-500/5"
    )}>
      {/* Seq number */}
      <span className="text-xs text-muted-foreground/50 font-mono w-5 shrink-0 text-right">{index + 1}</span>

      {/* Priority/Star */}
      <button onClick={() => onUpdate(item.id, { call_sheet_priority: item.call_sheet_priority === 1 ? 0 : 1 })}
        className="shrink-0">
        <Star className={cn("h-3.5 w-3.5",
          item.call_sheet_priority === 1 ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
        )} />
      </button>

      {/* Play name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm truncate">{play.play_name}</span>
          {play.short_name && (
            <code className="text-[10px] text-muted-foreground font-mono bg-secondary px-1 py-0.5 rounded">
              {play.short_name}
            </code>
          )}
          {item.is_opener && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              OPENER #{item.opener_sequence || ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {play.concept && <span className="text-[11px] text-muted-foreground">{play.concept}</span>}
          {play.direction && play.direction !== 'none' && (
            <span className="text-[11px] text-muted-foreground capitalize">{play.direction}</span>
          )}
          {editingNote ? (
            <div className="flex items-center gap-1">
              <Input value={note} onChange={e => setNote(e.target.value)}
                className="h-5 text-[11px] border-primary/30 bg-transparent w-32 px-1 py-0"
                onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setEditingNote(false); }}
                autoFocus />
              <button onClick={saveNote}><Check className="h-3 w-3 text-primary" /></button>
              <button onClick={() => setEditingNote(false)}><X className="h-3 w-3 text-muted-foreground" /></button>
            </div>
          ) : item.coach_note ? (
            <span className="text-[11px] text-muted-foreground italic cursor-pointer hover:text-foreground"
              onClick={() => setEditingNote(true)}>"{item.coach_note}"</span>
          ) : null}
        </div>
      </div>

      {/* Practiced badge */}
      <div className="shrink-0">
        <PracticedBadge days={practicedDays} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditingNote(true)}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary">
          <Edit2 className="h-3 w-3 text-muted-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary">
              <MoreVertical className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onUpdate(item.id, { is_opener: !item.is_opener })}>
              <Star className="h-3.5 w-3.5 mr-2" />
              {item.is_opener ? 'Remove from Openers' : 'Mark as Opener'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate(item.id, { call_sheet_priority: item.call_sheet_priority === 1 ? 0 : 1 })}>
              <Star className="h-3.5 w-3.5 mr-2" />
              {item.call_sheet_priority === 1 ? 'Remove Priority' : 'Mark Priority'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onRemove(item.id)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function CallSheetSection({ section, items, playMap, practicedMap, onAddPlays, onRemoveItem, onUpdateItem }) {
  const [collapsed, setCollapsed] = useState(false);
  const headerColor = SECTION_COLORS[section.section_type] || SECTION_COLORS.custom;
  const openers = items.filter(i => i.is_opener).length;
  const unpracticed = items.filter(i => !practicedMap[i.play_id] || practicedMap[i.play_id].length === 0).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Section header */}
      <div
        className={cn("flex items-center justify-between px-3 py-2 cursor-pointer select-none", headerColor)}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span className="text-xs font-bold uppercase tracking-wider">{section.section_name}</span>
          <span className="text-[10px] opacity-70">{items.length} plays</span>
          {openers > 0 && <span className="text-[10px] opacity-80">· {openers} opener{openers > 1 ? 's' : ''}</span>}
        </div>
        <div className="flex items-center gap-2">
          {unpracticed > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-red-500/30 text-white px-1.5 py-0.5 rounded">
              <AlertTriangle className="h-2.5 w-2.5" /> {unpracticed} unrepped
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAddPlays(); }}
            className="flex items-center gap-1 text-[11px] font-medium bg-white/20 hover:bg-white/30 transition-colors px-2 py-0.5 rounded">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>

      {/* Rows */}
      {!collapsed && (
        <>
          {items.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No plays — <button onClick={onAddPlays} className="underline text-primary">add from library</button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((item, i) => (
                <CallSheetRow
                  key={item.id}
                  item={item}
                  play={playMap[item.play_id]}
                  practicedDays={practicedMap[item.play_id]}
                  onRemove={onRemoveItem}
                  onUpdate={onUpdateItem}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === items.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}