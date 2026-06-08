import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, PenTool, CheckCircle2, AlertTriangle, BookOpen, Users, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TEMPLATE_LABELS = {
  coach_card:    'Coach Card',
  youth_player:  'Youth Player',
  compact_grid:  'Compact Grid',
  teaching_card: 'Teaching Card',
  defense_scout: 'Defense Scout',
  special_teams: 'Special Teams',
};

export default function ScoutCardDetail({ card, play, practicedDays, template, onClose, onUpdate }) {
  const [note, setNote] = useState(card.card_note || '');
  const [scoutLabel, setScoutLabel] = useState(card.scout_look_label || '');
  const [outputMode, setOutputMode] = useState('coach'); // 'coach' | 'player'

  if (!play) return null;

  const includePrint = card.include_in_print !== false;
  const playName = play.name || play.play_name;

  return (
    <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm truncate">{playName}</h3>
          {play.short_name && (
            <code className="text-[10px] text-primary/80 font-mono">{play.short_name}</code>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Diagram preview */}
        <div className="relative h-36 bg-gradient-to-b from-emerald-950/20 to-emerald-900/10 flex items-center justify-center border-b border-border">
          {/* Field lines */}
          <div className="absolute inset-0 opacity-10">
            {[25, 50, 75].map(pct => (
              <div key={pct} className="absolute top-0 bottom-0 border-l border-emerald-400/60" style={{ left: `${pct}%` }} />
            ))}
            <div className="absolute left-0 right-0 border-t border-emerald-400/40" style={{ top: '50%' }} />
          </div>
          <PenTool className="h-10 w-10 text-emerald-700/25 relative z-10" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            {play.formation && (
              <span className="text-[9px] text-emerald-700/60 font-medium">{play.formation}</span>
            )}
            {play.personnel && (
              <span className="text-[9px] bg-card/70 text-muted-foreground px-1.5 py-0.5 rounded font-mono">{play.personnel}</span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Practice status */}
          {practicedDays && practicedDays.length > 0 ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Practiced this week</p>
                <p className="text-[11px] text-emerald-600">{practicedDays.map(d => d.slice(0, 3).toUpperCase()).join(' · ')}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Not repped this week</p>
            </div>
          )}

          {/* Play meta */}
          <div className="space-y-1.5">
            {play.concept && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Concept</span>
                <Badge variant="secondary" className="text-[10px]">{play.concept}</Badge>
              </div>
            )}
            {play.play_family && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Family</span>
                <span className="text-xs">{play.play_family}</span>
              </div>
            )}
            {play.run_pass && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Type</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  play.run_pass === 'run' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                  play.run_pass === 'pass' ? "bg-sky-500/10 text-sky-700 dark:text-sky-400" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {play.run_pass?.toUpperCase()}
                </span>
              </div>
            )}
            {play.risk_level && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Risk</span>
                <span className={cn("text-[10px] font-semibold capitalize",
                  play.risk_level === 'high' ? "text-red-600" :
                  play.risk_level === 'low' ? "text-emerald-600" : "text-muted-foreground"
                )}>{play.risk_level}</span>
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
              placeholder="e.g. Eagles Cover 2 Shell"
              className="h-8 text-xs bg-secondary/50 border-0"
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
              placeholder="Add a coaching note for this card…"
              className="text-xs bg-secondary/50 border-0 min-h-[72px] resize-none"
            />
          </div>

          {/* Coach / Player output toggle */}
          {(play.coaching_points || play.notes) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Output Preview
                </label>
                <div className="flex items-center bg-secondary rounded-md p-0.5">
                  <button
                    onClick={() => setOutputMode('coach')}
                    className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                      outputMode === 'coach' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                  >
                    <BookOpen className="h-2.5 w-2.5" /> Coach
                  </button>
                  <button
                    onClick={() => setOutputMode('player')}
                    className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                      outputMode === 'player' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                  >
                    <Users className="h-2.5 w-2.5" /> Player
                  </button>
                </div>
              </div>
              <div className="bg-secondary/40 rounded-lg p-2.5">
                {outputMode === 'coach' ? (
                  play.coaching_points ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">{play.coaching_points}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">No coaching points set</p>
                  )
                ) : (
                  play.notes ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">{play.notes}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">No player notes set</p>
                  )
                )}
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Print toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {includePrint ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              <Label htmlFor="print-toggle" className="text-xs cursor-pointer">Include in print set</Label>
            </div>
            <Switch
              id="print-toggle"
              checked={includePrint}
              onCheckedChange={(v) => onUpdate({ include_in_print: v })}
            />
          </div>

          {/* Template label */}
          {template && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Active template</span>
              <span className="font-semibold text-foreground">{TEMPLATE_LABELS[template] || template}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}