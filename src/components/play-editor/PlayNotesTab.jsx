import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";

const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="space-y-3">
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-display font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

export default function PlayNotesTab({ play, onChange }) {
  const u = (field, val) => onChange({ ...play, [field]: val });

  return (
    <div className="space-y-8 max-w-2xl">

      <Section
        icon={BookOpen}
        title="Coaching Points"
        subtitle="What do coaches need to emphasize when installing this play? Technique, key blocks, reads, timing."
      >
        <Textarea
          value={play.coaching_points || ''}
          onChange={e => u('coaching_points', e.target.value)}
          placeholder="e.g. — Offensive line must reach the 3-technique before the pulling guard clears. QB mesh point is critical — ball should be out by the second step. Running back aims for the outside hip of the TE..."
          className="bg-secondary/50 border-0 min-h-[140px] text-sm leading-relaxed resize-none"
        />
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-primary"
            onClick={() => toast.info('AI coaching point generation coming soon')}>
            <Sparkles className="h-3.5 w-3.5" /> Generate with AI
          </Button>
        </div>
      </Section>

      <div className="h-px bg-border" />

      <Section
        icon={Users}
        title="Player-Friendly Description"
        subtitle='Simplified language your players will understand. Keep it clear and short — written for youth or middle school athletes. No jargon.'
      >
        <Textarea
          value={play.player_friendly_text || ''}
          onChange={e => u('player_friendly_text', e.target.value)}
          placeholder="e.g. — Everyone blocks to the right. The running back takes the handoff and follows the pulling guard. Look for the gap outside the tight end and hit it fast."
          className="bg-secondary/50 border-0 min-h-[120px] text-sm leading-relaxed resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Tip: Write like you're explaining it to a 10-year-old. Simple verbs, no scheme terms.
          </p>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-primary"
            onClick={() => toast.info('AI simplification coming soon')}>
            <Sparkles className="h-3.5 w-3.5" /> Simplify with AI
          </Button>
        </div>
      </Section>
    </div>
  );
}