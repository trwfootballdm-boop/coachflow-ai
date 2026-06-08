import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

export default function PlayDetailsForm({ play, onChange }) {
  const update = (field, value) => {
    onChange({ ...play, [field]: value });
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const tag = e.target.value.trim();
      const tags = play.tags || [];
      if (!tags.includes(tag)) {
        update('tags', [...tags, tag]);
      }
      e.target.value = '';
    }
  };

  const removeTag = (tag) => {
    update('tags', (play.tags || []).filter(t => t !== tag));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Play Name</Label>
        <Input
          value={play.name || ''}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Jet Sweep Right"
          className="mt-1.5 bg-secondary/50 border-0"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Side</Label>
          <Select value={play.side || 'offense'} onValueChange={(v) => update('side', v)}>
            <SelectTrigger className="mt-1.5 bg-secondary/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offense">Offense</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
              <SelectItem value="special_teams">Special Teams</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Play Type</Label>
          <Select value={play.play_type || ''} onValueChange={(v) => update('play_type', v)}>
            <SelectTrigger className="mt-1.5 bg-secondary/50 border-0">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {['run', 'pass', 'screen', 'play_action', 'rpo', 'trick', 'special_teams'].map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formation</Label>
        <Input
          value={play.formation || ''}
          onChange={(e) => update('formation', e.target.value)}
          placeholder="e.g. Shotgun Trips Right"
          className="mt-1.5 bg-secondary/50 border-0"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Concept</Label>
          <Input
            value={play.concept || ''}
            onChange={(e) => update('concept', e.target.value)}
            placeholder="e.g. Inside Zone"
            className="mt-1.5 bg-secondary/50 border-0"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personnel</Label>
          <Select value={play.personnel || ''} onValueChange={(v) => update('personnel', v)}>
            <SelectTrigger className="mt-1.5 bg-secondary/50 border-0">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {['10', '11', '12', '13', '20', '21', '22', '23'].map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hash</Label>
          <Select value={play.hash || 'any'} onValueChange={(v) => update('hash', v)}>
            <SelectTrigger className="mt-1.5 bg-secondary/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['any', 'left', 'middle', 'right'].map(h => (
                <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Field Zone</Label>
          <Select value={play.field_zone || 'any'} onValueChange={(v) => update('field_zone', v)}>
            <SelectTrigger className="mt-1.5 bg-secondary/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['any', 'backed_up', 'own_territory', 'midfield', 'red_zone', 'goal_line'].map(z => (
                <SelectItem key={z} value={z}>{z.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</Label>
        <Input
          onKeyDown={addTag}
          placeholder="Type and press Enter"
          className="mt-1.5 bg-secondary/50 border-0"
        />
        {play.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {play.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
        <Textarea
          value={play.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Coaching notes..."
          className="mt-1.5 bg-secondary/50 border-0 h-20 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Switch
          checked={play.is_favorite || false}
          onCheckedChange={(v) => update('is_favorite', v)}
        />
        <Label className="text-sm">Mark as Favorite</Label>
      </div>
    </div>
  );
}