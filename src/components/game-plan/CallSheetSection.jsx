import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import CallSheetItem from './CallSheetItem';

export default function CallSheetSection({
  sectionKey, sectionName, items, plays, onAdd, onRemove, onUpdate, onOpenDetail, printMode
}) {
  const [collapsed, setCollapsed] = useState(false);

  const resolvedItems = items.map(item => ({
    ...item,
    _play: plays.find(p => p.id === item.play_id),
  }));

  const unpracticed = resolvedItems.filter(i => !i.practiced_this_week).length;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-card", printMode && "border-gray-300 rounded-none break-inside-avoid")}>
      {/* Section header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-secondary/40 border-b border-border",
          !printMode && "cursor-pointer hover:bg-secondary/60 transition-colors",
          printMode && "bg-gray-100 py-1.5"
        )}
        onClick={() => !printMode && setCollapsed(c => !c)}
      >
        {!printMode && (
          collapsed
            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className={cn("font-display font-bold text-xs uppercase tracking-wider flex-1", printMode && "text-[11px]")}>
          {sectionName}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">{resolvedItems.length} plays</span>
        {unpracticed > 0 && !printMode && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-bold">{unpracticed} unprepped</span>
          </div>
        )}
        {!printMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={e => { e.stopPropagation(); onAdd(sectionKey); }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Items */}
      {!collapsed && (
        <div className={cn("divide-y divide-border", printMode && "divide-gray-200")}>
          {resolvedItems.length === 0 ? (
            !printMode && (
              <button
                onClick={() => onAdd(sectionKey)}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground hover:bg-secondary/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add plays to {sectionName}
              </button>
            )
          ) : (
            resolvedItems
              .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))
              .map((item, idx) => (
                <CallSheetItem
                  key={item.id || idx}
                  item={item}
                  play={item._play}
                  index={idx}
                  onRemove={() => onRemove(item)}
                  onUpdate={(data) => onUpdate(item, data)}
                  onOpenDetail={() => onOpenDetail(item._play)}
                  printMode={printMode}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}