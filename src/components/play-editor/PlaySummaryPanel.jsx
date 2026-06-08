import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, PenTool, FileText, ClipboardList, Copy, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDE_COLORS = {
  offense: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  defense: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  special_teams: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

const DIFFICULTY_DOTS = { easy: 'bg-emerald-500', moderate: 'bg-amber-500', advanced: 'bg-red-500' };

export default function PlaySummaryPanel({ play, isSaving, onSave, onDuplicate, onAddToScript, onAddToGamePlan }) {
  const allTags = [
    ...(play.down_distance_tags || []),
    ...(play.field_zone_tags || []),
    ...(play.opponent_front_tags || []),
    ...(play.coverage_tags || []),
    ...(play.tags || []),
  ].filter(t => t && t !== 'any').slice(0, 6);

  return (
    <div className="sticky top-20 space-y-3">
      {/* Summary card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Diagram preview */}
        <div className="h-28 bg-emerald-900/20 dark:bg-emerald-950/40 flex items-center justify-center border-b border-border">
          <PenTool className="h-8 w-8 text-emerald-700/25" />
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display font-semibold leading-tight truncate">
              {play.name || play.play_name || 'Untitled Play'}
            </h3>
            {play.short_name && (
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground mt-1 inline-block">
                {play.short_name}
              </code>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {play.side && (
              <Badge variant="outline" className={cn("text-[10px] font-semibold capitalize border", SIDE_COLORS[play.side])}>
                {play.side.replace(/_/g, ' ')}
              </Badge>
            )}
            {play.is_active !== false
              ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Active</Badge>
              : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
            }
            {play.is_favorite && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
          </div>

          <div className="space-y-2 text-xs">
            {play.formation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formation</span>
                <span className="font-medium truncate max-w-[120px]">{play.formation}</span>
              </div>
            )}
            {play.play_family && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Family</span>
                <span className="font-medium">{play.play_family}</span>
              </div>
            )}
            {play.concept && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concept</span>
                <span className="font-medium">{play.concept}</span>
              </div>
            )}
            {play.age_level_difficulty && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Difficulty</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-2 w-2 rounded-full", DIFFICULTY_DOTS[play.age_level_difficulty] || 'bg-muted')} />
                  <span className="font-medium capitalize">{play.age_level_difficulty}</span>
                </div>
              </div>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] capitalize">
                  {tag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <Button onClick={onSave} disabled={isSaving} className="w-full gap-1.5 rounded-xl" size="sm">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Play
        </Button>
        <Button variant="outline" onClick={onAddToScript} className="w-full gap-1.5 rounded-xl" size="sm">
          <FileText className="h-3.5 w-3.5" /> Add to Practice Script
        </Button>
        <Button variant="outline" onClick={onAddToGamePlan} className="w-full gap-1.5 rounded-xl" size="sm">
          <ClipboardList className="h-3.5 w-3.5" /> Add to Game Plan
        </Button>
        <Button variant="ghost" onClick={onDuplicate} className="w-full gap-1.5 rounded-xl text-muted-foreground" size="sm">
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </Button>
      </div>
    </div>
  );
}