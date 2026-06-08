import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  X, LayoutGrid, AlignJustify
} from "lucide-react";
import { cn } from "@/lib/utils";

// Single entry row within a section
function EntryRow({ entry, index, playMap, onUpdate, onRemove }) {
  const play = playMap[entry.play_id];
  const playName = play?.name || play?.play_name || '—';
  const shortName = play?.short_name || '';

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/30 transition-colors border-b border-border/30 last:border-0">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />

      {/* Code input */}
      <Input
        value={entry.code || ''}
        onChange={e => onUpdate(index, { code: e.target.value })}
        className="h-6 w-12 text-xs font-mono font-bold bg-secondary/50 border-0 text-center px-1 shrink-0"
        placeholder="#"
        maxLength={4}
      />

      {/* Label (editable) */}
      <Input
        value={entry.label || shortName || playName}
        onChange={e => onUpdate(index, { label: e.target.value })}
        className="h-6 flex-1 text-xs bg-secondary/50 border-0 min-w-0 px-1.5"
        placeholder="Display name…"
      />

      {/* Play name badge (readonly reference) */}
      {play && (
        <span className="text-[9px] text-muted-foreground/50 hidden md:block shrink-0 truncate max-w-[80px]">
          {playName}
        </span>
      )}

      {/* Note */}
      <Input
        value={entry.note || ''}
        onChange={e => onUpdate(index, { note: e.target.value })}
        className="h-6 w-20 text-[10px] bg-secondary/50 border-0 px-1.5 shrink-0 hidden lg:block"
        placeholder="note…"
      />

      <button
        onClick={() => onRemove(index)}
        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// One wristband section (collapsible)
export function WristbandSection({ section, index, playMap, onUpdate, onRemove, onAddEntry }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateEntry = (entryIdx, patch) => {
    const newEntries = section.entries.map((e, i) => i === entryIdx ? { ...e, ...patch } : e);
    onUpdate(index, { entries: newEntries });
  };

  const removeEntry = (entryIdx) => {
    const newEntries = section.entries.filter((_, i) => i !== entryIdx);
    onUpdate(index, { entries: newEntries });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}

        {/* Section label */}
        <Input
          value={section.label || ''}
          onChange={e => { e.stopPropagation(); onUpdate(index, { label: e.target.value }); }}
          onClick={e => e.stopPropagation()}
          className="h-6 flex-1 text-xs font-bold bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:bg-secondary/50 rounded px-1"
          placeholder="Section name (e.g. Red Zone)"
        />

        {/* Columns picker */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <span className="text-[9px] text-muted-foreground">cols</span>
          {[1, 2, 3].map(c => (
            <button key={c}
              onClick={e => { e.stopPropagation(); onUpdate(index, { columns: c }); }}
              className={cn("h-5 w-5 text-[9px] font-bold rounded transition-all flex items-center justify-center",
                (section.columns || 2) === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}
            >
              {c}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-muted-foreground font-mono shrink-0">{section.entries?.length || 0}</span>

        <button
          onClick={e => { e.stopPropagation(); onRemove(index); }}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Entries */}
      {!collapsed && (
        <>
          {/* Column headers */}
          {section.entries?.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 border-b border-border/30">
              <div className="w-3.5 shrink-0" />
              <span className="text-[9px] text-muted-foreground font-bold uppercase w-12 shrink-0 text-center">Code</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase flex-1">Display Label</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase hidden md:block w-20 shrink-0">Play Ref</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase hidden lg:block w-20 shrink-0">Note</span>
              <div className="w-5 shrink-0" />
            </div>
          )}

          <div>
            {(section.entries || []).map((entry, ei) => (
              <EntryRow
                key={ei}
                entry={entry}
                index={ei}
                playMap={playMap}
                onUpdate={updateEntry}
                onRemove={removeEntry}
              />
            ))}
          </div>

          <button
            onClick={() => onAddEntry(index)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:bg-secondary/20 hover:text-foreground transition-colors border-t border-dashed border-border/50"
          >
            <Plus className="h-3.5 w-3.5" /> Add entry to {section.label || 'section'}
          </button>
        </>
      )}
    </div>
  );
}

// Full section list editor
export default function WristbandSectionEditor({ sections, playMap, onChange }) {
  const addSection = () => {
    onChange([...sections, {
      label: `Section ${sections.length + 1}`,
      columns: 2,
      entries: [],
    }]);
  };

  const updateSection = (idx, patch) => {
    onChange(sections.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const removeSection = (idx) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const addEntryToSection = (sectionIdx) => {
    const newEntry = { code: '', label: '', play_id: null, note: '' };
    const newEntries = [...(sections[sectionIdx].entries || []), newEntry];
    updateSection(sectionIdx, { entries: newEntries });
  };

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <WristbandSection
          key={i}
          section={section}
          index={i}
          playMap={playMap}
          onUpdate={updateSection}
          onRemove={removeSection}
          onAddEntry={addEntryToSection}
        />
      ))}
      <button
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground border-2 border-dashed border-border hover:border-primary/30 rounded-xl transition-all"
      >
        <Plus className="h-4 w-4" /> Add Section
      </button>
    </div>
  );
}