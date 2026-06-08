import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Plus, Target, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SelfScoutActionCenter({ alert, relatedPlays = [], onCreateAction }) {
  const [actionType, setActionType] = useState('adjustment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [targetGames, setTargetGames] = useState('');

  const handleCreateAction = () => {
    if (!title.trim()) return;

    const action = {
      id: `action_${Date.now()}`,
      alertId: alert?.label,
      type: actionType,
      title,
      description,
      priority,
      targetGames,
      relatedPlayCount: relatedPlays.length,
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    onCreateAction?.(action);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setTargetGames('');
  };

  if (!alert) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Action Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/50 text-muted-foreground">
              <Target className="h-4.5 w-4.5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">No alert selected</h3>
            <p className="mt-2 max-w-[20rem] text-xs leading-5 text-muted-foreground">
              Select a tendency alert from the dashboard to create targeted action items.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-lg">Create Action Item</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Address: <span className="font-semibold text-foreground">{alert.label}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Tactical Adjustment</SelectItem>
                  <SelectItem value="gameplan">Game Plan Change</SelectItem>
                  <SelectItem value="practice">Practice Focus</SelectItem>
                  <SelectItem value="personnel">Personnel Change</SelectItem>
                  <SelectItem value="rule">New Rule/Constraint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Action Title</Label>
            <Input
              placeholder="e.g., Add play-action constraint to Inside Zone"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the adjustment, when to use it, and expected outcome..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label>Target Games</Label>
            <Input
              placeholder="e.g., Week 5-7, Playoffs"
              value={targetGames}
              onChange={(e) => setTargetGames(e.target.value)}
            />
          </div>

          <Button onClick={handleCreateAction} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Create Action Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <CardTitle className="text-lg">Related Plays ({relatedPlays.length})</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Plays contributing to this tendency
          </p>
        </CardHeader>
        <CardContent>
          {relatedPlays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No related plays found</p>
          ) : (
            <div className="space-y-2">
              {relatedPlays.slice(0, 5).map((play) => (
                <div
                  key={play.id}
                  className="rounded-lg border border-border bg-background/40 p-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {play.playName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {play.down === 1 ? '1st' : play.down === 2 ? '2nd' : play.down === 3 ? '3rd' : '4th'} & {play.distance} · {play.fieldZone} · {play.result.yards >= 0 ? '+' : ''}{play.result.yards} yds
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {play.result.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="h-5 text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {relatedPlays.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{relatedPlays.length - 5} more plays
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Alert Context</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tendency Type:</span>
              <span className="font-medium text-foreground">{alert.tendencyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tendency %:</span>
              <span className="font-medium text-foreground">{alert.tendencyPct}%</span>
            </div>
            <div className="pt-2">
              <span className="text-muted-foreground">Note:</span>
              <p className="mt-1 text-foreground">{alert.note}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}