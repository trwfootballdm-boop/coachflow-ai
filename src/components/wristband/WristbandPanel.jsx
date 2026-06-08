import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Single play row within a panel section ───────────────────────────────────
function PlayRow({ entry, playMap, onUpdate, onRemove, codeStyle }) {
  const [editingCode, setEditingCode] = useState(false);
  const [codeVal, setCodeVal] = useState(entry.code || '');
  const play = playMap[entry.play_id];
  if (!play) return null;

  const commitCode = () => {
    onUpdate({ ...entry, code: codeVal });
    setEditingCode(false);
  };

  const displayName = play.short_name || play.name || play.play_name || '—';
  const fullName = play.name || play.play_name || '—';

  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-secondary/30 transition-colors rounded">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />

      {/* Code badge */}
      <div className="shrink-0 w-12">
        {editingCode ? (
          <div className="flex items-center gap-0.5">
            <Input
              autoFocus
              value={codeVal}
              onChange={e => setCodeVal(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter') commitCode(); if (e.key === 'Escape') setEditingCode(false); }}
              className="h-6 px-1 text-[11px] font-mono text-center bg-secondary border-0 w-12"
            />
            <button onClick={commitCode} className="text-primary"><Check className="h-3 w-3" /></button>
          </div>
        ) : (
          <button
            onClick={() => { setCodeVal(entry.code || ''); setEditingCode(true); }}
            className={cn(
              "w-12 h-6 text-[11px] font-mono font-bold rounded text-center transition-colors",
              entry.code
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-secondary text-muted-foreground border border-dashed border-border hover:border-primary/40"
            )}
          >
            {entry.code || <span className="text-[9px]">+code</span>}
          </button>
        )}
      </div>

      {/* Play name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{displayName}</p>
        {codeStyle !== 'short_only' && (
          <p className="text-[10px] text-muted-foreground truncate">{fullName}</p>
        )}
      </div>

      {/* Run/pass badge */}
      {play.run_pass && (
        <span className={cn(
          "text-[8px] font-bold px-1 py-0.5 rounded shrink-0",
          play.run_pass === 'run' ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
          play.run_pass === 'pass' ? "bg-sky-500/15 text-sky-700 dark:text-sky-400" :
          "bg-secondary text-muted-foreground"
        )}>
          {play.run_pass?.toUpperCase()}
        </span>
      )}

      <button
        onClick={() => onRemove(entry.play_id)}
        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function WristbandSection({ section, playMap, onUpdateSection, onAddPlay, onRemovePlay, onUpdateEntry, codeStyle }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(section.label);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card mb-2">
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors select-none"
        onClick={() => !editingLabel && setCollapsed(c => !c)}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}

        {editingLabel ? (
          <Input
            autoFocus
            value={labelVal}
            onChange={e => setLabelVal(e.target.value)}
            onBlur={() => { onUpdateSection({ ...section, label: labelVal }); setEditingLabel(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onUpdateSection({ ...section, label: labelVal }); setEditingLabel(false); } }}
            className="h-6 px-1.5 text-xs font-bold bg-transparent border-0 flex-1 focus-visible:ring-1"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-xs font-bold uppercase tracking-wider">{section.label}</span>
        )}

        <span className="text-[10px] text-muted-foreground font-mono shrink-0">{section.plays.length}</span>

        <button
          onClick={e => { e.stopPropagation(); setLabelVal(section.label); setEditingLabel(true); }}
          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-secondary transition-all"
        >
          <Edit2 className="h-3 w-3 text-muted-foreground" />
        </button>

        <button
          onClick={e => { e.stopPropagation(); onAddPlay(section.id); }}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Plays */}
      {!collapsed && (
        <div className="p-1.5 space-y-0.5">
          {section.plays.length === 0 ? (
            <button
              onClick={() => onAddPlay(section.id)}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add plays to {section.label}
            </button>
          ) : (
            section.plays.map(entry => (
              <PlayRow
                key={entry.play_id}
                entry={entry}
                playMap={playMap}
                codeStyle={codeStyle}
                onUpdate={(updated) => onUpdateEntry(section.id, updated)}
                onRemove={(playId) => onRemovePlay(section.id, playId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default WristbandSection;
export { PlayRow };