import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Copy, Star, ClipboardList, FileText, PenTool, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SIDE_ICON = { offense: Zap, defense: Shield, special_teams: PenTool };

const META = ({ label, value }) => value ? (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-sm mt-0.5">{value}</p>
  </div>
) : null;

export default function PlayDetailPanel({ play, onClose, onEdit, onDuplicate, onToggleFav, onAddToScript, onAddToGamePlan }) {
  if (!play) return null;
  const SideIcon = SIDE_ICON[play.side] || Zap;

  const allTags = [
    ...(play.down_distance_tags || []),
    ...(play.field_zone_tags || []),
    ...(play.opponent_front_tags || []),
    ...(play.coverage_tags || []),
    ...(play.tags || []),
  ].filter(t => t && t !== 'any');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <SideIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-bold text-base leading-tight truncate">{play.name || play.play_name}</h2>
            <button onClick={() => onToggleFav(play)} className={cn("shrink-0 transition-colors", play.is_favorite ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400")}>
              <Star className={cn("h-4 w-4", play.is_favorite && "fill-current")} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {play.short_name && (
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">{play.short_name}</code>
            )}
            {play.side && (
              <Badge variant="secondary" className="text-[10px] capitalize">{play.side.replace(/_/g, ' ')}</Badge>
            )}
            {play.is_active !== false
              ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Active</Badge>
              : <Badge variant="secondary" className="text-[10px] text-muted-foreground">Inactive</Badge>
            }
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-1 -mr-1" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Diagram placeholder */}
      <div className="mx-4 mt-4 aspect-[16/7] rounded-xl bg-emerald-900/20 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-900/10 shrink-0">
        <PenTool className="h-10 w-10 text-emerald-700/20" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Core metadata grid */}
        <div className="grid grid-cols-2 gap-4">
          <META label="Formation" value={play.formation} />
          <META label="Personnel" value={play.personnel} />
          <META label="Play Family" value={play.play_family} />
          <META label="Concept" value={play.concept} />
          <META label="Direction" value={play.direction !== 'any' ? play.direction : null} />
          <META label="Motion" value={play.motion} />
          <META label="Install Day" value={play.install_day ? `Day ${play.install_day}` : null} />
          <META label="Difficulty" value={play.age_level_difficulty} />
          <META label="Risk Level" value={play.risk_level} />
          <META label="Version" value={play.version ? `v${play.version}` : null} />
        </div>

        {/* Coaching Points */}
        {play.coaching_points && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Coaching Points</p>
            <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/50 rounded-lg p-3">
              {play.coaching_points}
            </p>
          </div>
        )}

        {/* Player Friendly Text */}
        {play.player_friendly_text && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Player Description</p>
            <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 rounded-lg p-3 italic">
              "{play.player_friendly_text}"
            </p>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Situational Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] capitalize">
                  {tag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* General Notes */}
        {play.notes && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Notes</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{play.notes}</p>
          </div>
        )}

        {play.updated_date && (
          <p className="text-[10px] text-muted-foreground/50">
            Last updated {format(new Date(play.updated_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onEdit(play)} className="gap-1.5 rounded-lg text-sm" size="sm">
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="secondary" onClick={() => onDuplicate(play)} className="gap-1.5 rounded-lg text-sm" size="sm">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onAddToScript(play)} className="gap-1.5 rounded-lg text-xs" size="sm">
            <FileText className="h-3.5 w-3.5" /> + Script
          </Button>
          <Button variant="outline" onClick={() => onAddToGamePlan(play)} className="gap-1.5 rounded-lg text-xs" size="sm">
            <ClipboardList className="h-3.5 w-3.5" /> + Game Plan
          </Button>
        </div>
      </div>
    </div>
  );
}