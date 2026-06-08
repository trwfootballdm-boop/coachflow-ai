import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

export default function GameTrackerPanel({ tracker, availablePlays = [], onChange }) {
  const [selectedPlayId, setSelectedPlayId] = useState('');
  const [customPlayName, setCustomPlayName] = useState('');
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  const [yardLine, setYardLine] = useState(25);
  const [hash, setHash] = useState('middle');
  const [fieldZone, setFieldZone] = useState('open_field');
  const [playType, setPlayType] = useState('pass');
  const [yards, setYards] = useState(0);
  const [notes, setNotes] = useState('');

  const selectedPlay = availablePlays.find((p) => p.id === selectedPlayId);

  function handleLogPlay() {
    const play = {
      id: `play_${Date.now()}`,
      gameId: tracker.gameId,
      quarter: 1,
      clock: '12:00',
      down,
      distance,
      yardLine,
      hash,
      fieldZone,
      playId: selectedPlayId || undefined,
      playName: selectedPlay?.name || customPlayName || 'Custom Play',
      concept: selectedPlay?.concept,
      formation: selectedPlay?.formation,
      personnel: selectedPlay?.personnel,
      playType,
      result: {
        yards,
        tags: [
          yards >= distance ? 'first_down' : '',
          yards >= 20 ? 'explosive' : '',
          yards >= 0 && yards < distance ? 'success' : '',
        ].filter(Boolean),
      },
      notes: notes ? [notes] : [],
    };

    const next = {
      ...tracker,
      plays: [...tracker.plays, play],
    };
    onChange(next);

    setCustomPlayName('');
    setYards(0);
    setNotes('');
    setDown(down === 4 ? 1 : down + 1);
    setDistance(10);
    setYardLine(Math.min(100, yardLine + yards));
  }

  function handleRemovePlay(playId) {
    const next = {
      ...tracker,
      plays: tracker.plays.filter((p) => p.id !== playId),
    };
    onChange(next);
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log New Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Play</Label>
              <Select value={selectedPlayId} onValueChange={setSelectedPlayId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from playbook" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlays.map((play) => (
                    <SelectItem key={play.id} value={play.id}>
                      {play.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedPlayId && (
                <Input
                  className="mt-2"
                  placeholder="Or enter custom play name"
                  value={customPlayName}
                  onChange={(e) => setCustomPlayName(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label>Play Type</Label>
              <Select value={playType} onValueChange={setPlayType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="run">Run</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="rpo">RPO</SelectItem>
                  <SelectItem value="play_action">Play Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Down</Label>
              <Select value={down.toString()} onValueChange={(v) => setDown(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st</SelectItem>
                  <SelectItem value="2">2nd</SelectItem>
                  <SelectItem value="3">3rd</SelectItem>
                  <SelectItem value="4">4th</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Distance</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 10)}
              />
            </div>

            <div>
              <Label>Yard Line</Label>
              <Input
                type="number"
                value={yardLine}
                onChange={(e) => setYardLine(parseInt(e.target.value) || 25)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Hash</Label>
              <Select value={hash} onValueChange={setHash}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Field Zone</Label>
              <Select value={fieldZone} onValueChange={setFieldZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backed_up">Backed Up</SelectItem>
                  <SelectItem value="coming_out">Coming Out</SelectItem>
                  <SelectItem value="open_field">Open Field</SelectItem>
                  <SelectItem value="fringe">Fringe</SelectItem>
                  <SelectItem value="red_zone">Red Zone</SelectItem>
                  <SelectItem value="goal_line">Goal Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Yards Gained</Label>
              <Input
                type="number"
                value={yards}
                onChange={(e) => setYards(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleLogPlay} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Log Play
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logged Plays ({tracker.plays.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {tracker.plays.map((play, i) => (
                <div key={play.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{play.playName}</span>
                        <Badge variant="secondary" className="h-5 text-xs">
                          {play.down === 1 ? '1st' : play.down === 2 ? '2nd' : play.down === 3 ? '3rd' : '4th'} & {play.distance}
                        </Badge>
                        <Badge variant="outline" className="h-5 text-xs">
                          {play.fieldZone}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {play.concept && <span>{play.concept} • </span>}
                        {play.formation && <span>{play.formation} • </span>}
                        {play.personnel && <span>{play.personnel}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="font-semibold text-primary">{play.result.yards} yards</span>
                        {play.result.tags.map((tag) => (
                          <Badge key={tag} className="h-5 text-xs" variant={tag === 'explosive' ? 'default' : 'secondary'}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {play.notes?.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">{play.notes.join(', ')}</div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePlay(play.id)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}