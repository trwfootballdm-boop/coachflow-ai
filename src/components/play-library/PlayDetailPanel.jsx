import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Copy, Star, ClipboardList, FileText, PenTool, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SIDE_ICON = { offense: Zap, defense: Shield, special_teams: PenTool };

const DIFFICULTY_COLORS = {
  easy:     'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

function MetaRow({ label, value, children }) {
  const content = children ?? value;
  if (!content && content !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">{label}</p>
      {children ?? <p className="text-sm text-foreground leading-snug capitalize">{value}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 border-b border-border pb-1">{title}</p>
      {children}
    </div>
  );
}

export default function PlayDetailPanel({ play, onClose, onEdit, onDuplicate, onToggleFav, onAddToScript, onAddToGamePlan }) {
  if (!play) return null;

  const SideIcon = SIDE_ICON[play.side] || Zap;
  const playName = play.name || play.play_name;

  const allTags = [
    ...(play.down_distance_tags || []),
    ...(play.field_zone_tags || []),
    ...(play.opponent_front_tags || []),
    ...(play.coverage_tags || []),
    ...(play.tags || []),
  ].filter(t => t && t !== 'any');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <SideIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-[15px] leading-tight">{playName}</h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {play.short_name && (
                <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground border border-border">
                  {play.short_name}
                </code>
              )}
              {play.run_pass_type && (
                <Badge variant="secondary" className="text-[10px] capitalize border">{play.run_pass_type.replace(/_/g, ' ')}</Badge>
              )}
              {play.age_level_difficulty && (
                <Badge variant="secondary" className={cn("text-[10px] capitalize border", DIFFICULTY_COLORS[play.age_level_difficulty] || '')}>
                  {play.age_level_difficulty}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn("text-[10px] border ml-auto", play.is_active !== false
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "text-muted-foreground"
                )}
              >
                {play.is_active !== false ? '● Active' : '○ Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFav(play)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                play.is_favorite
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-muted-foreground/40 hover:text-amber-400 hover:bg-secondary"
              )}
            >
              <Star className={cn("h-4 w-4", play.is_favorite && "fill-current")} />
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Diagram placeholder ── */}
      <div className="mx-4 mt-3 rounded-xl bg-gradient-to-b from-emerald-950/30 to-emerald-900/10 dark:from-emerald-950/60 dark:to-emerald-900/20 flex flex-col items-center justify-center border border-emerald-900/15 shrink-0" style={{ height: '120px' }}>
        <PenTool className="h-8 w-8 text-emerald-700/20 dark:text-emerald-500/20" />
        <p className="text-[10px] text-muted-foreground/40 mt-1">No diagram yet</p>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* Core metadata */}
        <Section title="Play Info">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <MetaRow label="Formation" value={play.formation} />
            <MetaRow label="Personnel" value={play.personnel} />
            <MetaRow label="Family" value={play.play_family} />
            <MetaRow label="Concept" value={play.concept} />
            <MetaRow label="Direction" value={play.direction !== 'any' ? play.direction : null} />
            <MetaRow label="Motion" value={play.motion} />
            <MetaRow label="Install Day" value={play.install_day ? `Day ${play.install_day}` : null} />
            <MetaRow label="Risk" value={play.risk_level} />
          </div>
        </Section>

        {/* Coaching Points */}
        {play.coaching_points && (
          <Section title="Coaching Points">
            <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/40 rounded-lg p-2.5">
              {play.coaching_points}
            </p>
          </Section>
        )}

        {/* Player description */}
        {play.player_friendly_text && (
          <Section title="Player Description">
            <p className="text-sm text-foreground/75 leading-relaxed bg-secondary/20 rounded-lg p-2.5 italic">
              "{play.player_friendly_text}"
            </p>
          </Section>
        )}

        {/* Situational Tags */}
        {allTags.length > 0 && (
          <Section title="Situational Tags">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] capitalize border">
                  {tag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {play.notes && (
          <Section title="Notes">
            <p className="text-sm text-muted-foreground leading-relaxed">{play.notes}</p>
          </Section>
        )}

        {play.updated_date && (
          <p className="text-[10px] text-muted-foreground/40 pb-1">
            Updated {format(new Date(play.updated_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="px-4 py-3 border-t border-border bg-secondary/20 shrink-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onEdit(play)} className="gap-1.5 rounded-lg h-9" size="sm">
            <Edit className="h-3.5 w-3.5" /> Edit Play
          </Button>
          <Button variant="secondary" onClick={() => onDuplicate(play)} className="gap-1.5 rounded-lg h-9" size="sm">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onAddToScript(play)} className="gap-1 rounded-lg h-8 text-xs" size="sm">
            <FileText className="h-3.5 w-3.5" /> + Script
          </Button>
          <Button variant="outline" onClick={() => onAddToGamePlan(play)} className="gap-1 rounded-lg h-8 text-xs" size="sm">
            <ClipboardList className="h-3.5 w-3.5" /> + Game Plan
          </Button>
        </div>
      </div>
    </div>
  );
}