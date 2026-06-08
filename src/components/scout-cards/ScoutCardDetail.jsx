import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, PenTool, CheckCircle2, AlertTriangle, BookOpen, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { value: 'coach_card', label: 'Coach Card' },
  { value: 'youth_player', label: 'Youth Player' },
  { value: 'compact_grid', label: 'Compact Grid' },
  { value: 'teaching_card', label: 'Teaching Card' },
  { value: 'defense_scout', label: 'Defense Scout Look' },
  { value: 'special_teams', label: 'Special Teams' },
];

export default function ScoutCardDetail({ card, play, practicedDays, onClose, onUpdate }) {
  const [note, setNote] = useState(card.card_note || '');
  const [scoutLabel, setScoutLabel] = useState(card.scout_look_label || '');

  if (!play) return null;

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-display font-bold text-sm truncate">{play.play_name}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Diagram preview */}
        <div className="h-36 bg-emerald-900/15 dark:bg-emerald-950/30 flex items-center justify-center border-b border-border">
          <PenTool className="h-10 w-10 text-emerald-800/20" />
        </div>

        <div className="p-4 space-y-4">
          {/* Practiced status */}
          {practicedDays && practicedDays.length > 0 ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Practiced this week</p>
                <p className="text-[11px] text-emerald-600">{practicedDays.map(d => d.slice(0, 3).toUpperCase()).join(', ')}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Not practiced this week</p>
            </div>
          )}

          {/* Play info */}
          <div className="space-y-1">
            {play.short_name && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20">Short Name</span>
                <code className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{play.short_name}</code>
              </div>
            )}
            {play.concept && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20">Concept</span>
                <Badge variant="secondary" className="text-[10px]">{play.concept}</Badge>
              </div>
            )}
            {play.play_family && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20">Family</span>
                <span className="text-xs">{play.play_family}</span>
              </div>
            )}
            {play.difficulty_level && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20">Difficulty</span>
                <span className="text-xs capitalize">{play.difficulty_level}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Scout look label */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Scout Look Label
            </label>
            <Input
              value={scoutLabel}
              onChange={e => setScoutLabel(e.target.value)}
              onBlur={() => onUpdate({ scout_look_label: scoutLabel })}
              placeholder="e.g. Eagles Cover 2 Look"
              className="h-8 text-sm bg-secondary/50 border-0"
            />
          </div>

          {/* Card note */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Card Note
            </label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => onUpdate({ card_note: note })}
              placeholder="Add a note for this card…"
              className="text-sm bg-secondary/50 border-0 min-h-[80px] resize-none"
            />
          </div>

          {/* Coaching points */}
          {play.coaching_points && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Coaching Points
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">{play.coaching_points}</p>
            </div>
          )}

          {/* Player text */}
          {play.player_friendly_text && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Player Description
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">{play.player_friendly_text}</p>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Print toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="print-toggle" className="text-xs">Include in Print Set</Label>
            <Switch
              id="print-toggle"
              checked={card.include_in_print !== false}
              onCheckedChange={(v) => onUpdate({ include_in_print: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}