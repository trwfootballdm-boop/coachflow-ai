import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users } from "lucide-react";

export default function NotesTab({ play, onChange }) {
  const update = (field, value) => onChange({ ...play, [field]: value });

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Coaching Points */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm">Coaching Points</h3>
              <Badge variant="secondary" className="text-[10px]">Coach-facing</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Key points to emphasize when installing and running this play. This is what coaches communicate to each other.
            </p>
          </div>
        </div>
        <Textarea
          value={play.coaching_points || ''}
          onChange={(e) => update('coaching_points', e.target.value)}
          placeholder="e.g. OLine must identify the Mike before the snap. QB reads playside safety post-snap. If cover 2, attack the alley with the fullback lead..."
          className="bg-secondary/50 border-0 min-h-[140px] resize-y text-sm leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/60">
          {(play.coaching_points || '').length} characters
        </p>
      </div>

      {/* Player Friendly Text */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm">Player Description</h3>
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Player-facing</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simplified language for young athletes. Write this as if you're explaining it directly to your players during a team meeting. Keep it short, clear, and energetic.
            </p>
          </div>
        </div>
        <Textarea
          value={play.player_friendly_text || ''}
          onChange={(e) => update('player_friendly_text', e.target.value)}
          placeholder="e.g. Everyone zones in — OLine pushes forward, RB follows the guards, and WRs block your man. It's simple: find your zone and go!"
          className="bg-secondary/50 border-0 min-h-[120px] resize-y text-sm leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Write at a level your youngest player can understand. Avoid jargon. {(play.player_friendly_text || '').length} characters
        </p>
      </div>

      {/* General Notes */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">General Notes</h3>
        <Textarea
          value={play.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any other notes about this play — history, alternate uses, constraints, etc."
          className="bg-secondary/50 border-0 min-h-[100px] resize-y text-sm"
        />
      </div>
    </div>
  );
}