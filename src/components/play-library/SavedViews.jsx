import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bookmark, Plus, Trash2, Pencil, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_VIEWS = [
  { id: 'base_offense', label: 'Base Offense', filters: { side: 'offense', status: 'active' } },
  { id: 'red_zone', label: 'Red Zone', filters: { fieldZone: ['red_zone'] } },
  { id: 'short_yardage', label: 'Short Yardage', filters: { downDistance: ['3rd-short', '4th-short'] } },
  { id: 'day1', label: 'Day 1 Install', filters: { installDay: '1' } },
  { id: 'favorites', label: 'Favorites', filters: { favoritesOnly: true } },
  { id: 'goal_line', label: 'Goal Line', filters: { fieldZone: ['goal_line'] } },
];

export default function SavedViews({ activeView, onApply }) {
  const [views, setViews] = useState(DEFAULT_VIEWS);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  const startEdit = (view, e) => {
    e.stopPropagation();
    setEditingId(view.id);
    setEditLabel(view.label);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    setViews(v => v.map(view => view.id === editingId ? { ...view, label: editLabel } : view));
    setEditingId(null);
  };

  const deleteView = (id, e) => {
    e.stopPropagation();
    if (!DEFAULT_VIEWS.find(v => v.id === id)) {
      setViews(v => v.filter(view => view.id !== id));
    }
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      <div className="flex items-center gap-1.5 shrink-0">
        <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Views:</span>
      </div>
      {views.map((view) => (
        <div key={view.id} className="shrink-0">
          {editingId === view.id ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                className="h-7 w-28 text-xs px-2 bg-secondary/50 border-0" autoFocus
                onKeyDown={e => e.key === 'Enter' && saveEdit(e)} />
              <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button
              onClick={() => onApply(view.filters)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap group",
                activeView === view.id
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {view.label}
              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                <Pencil className="h-2.5 w-2.5" onClick={(e) => startEdit(view, e)} />
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}