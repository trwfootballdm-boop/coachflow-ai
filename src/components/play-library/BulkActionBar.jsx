import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, ClipboardList, Star, Power, PowerOff, Copy, X } from "lucide-react";

export default function BulkActionBar({ count, onClear, onAddToScript, onAddToGamePlan, onFavorite, onActivate, onDeactivate, onDuplicate }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 pr-3 border-r border-border">
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <span className="text-[11px] font-bold text-primary-foreground">{count}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">selected</span>
      </div>
      <Button size="sm" variant="ghost" onClick={onAddToScript} className="gap-1.5 rounded-lg text-xs h-8">
        <FileText className="h-3.5 w-3.5" /> Add to Script
      </Button>
      <Button size="sm" variant="ghost" onClick={onAddToGamePlan} className="gap-1.5 rounded-lg text-xs h-8">
        <ClipboardList className="h-3.5 w-3.5" /> Add to Game Plan
      </Button>
      <Button size="sm" variant="ghost" onClick={onFavorite} className="gap-1.5 rounded-lg text-xs h-8 text-amber-600 dark:text-amber-400">
        <Star className="h-3.5 w-3.5" /> Favorite
      </Button>
      <Button size="sm" variant="ghost" onClick={onDuplicate} className="gap-1.5 rounded-lg text-xs h-8">
        <Copy className="h-3.5 w-3.5" /> Duplicate
      </Button>
      <Button size="sm" variant="ghost" onClick={onActivate} className="gap-1.5 rounded-lg text-xs h-8 text-emerald-600 dark:text-emerald-400">
        <Power className="h-3.5 w-3.5" /> Activate
      </Button>
      <Button size="sm" variant="ghost" onClick={onDeactivate} className="gap-1.5 rounded-lg text-xs h-8 text-muted-foreground">
        <PowerOff className="h-3.5 w-3.5" /> Deactivate
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="rounded-lg h-8 w-8 p-0 ml-1">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}