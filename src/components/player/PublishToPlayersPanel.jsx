import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Users, Calendar, Eye } from 'lucide-react';

export default function PublishToPlayersPanel({ selectedPlays = [], onSuccess }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [opponentName, setOpponentName] = useState('');
  const [requiresQuiz, setRequiresQuiz] = useState(false);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('publishToPlayers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerContent'] });
      setOpen(false);
      setTitle('');
      setDescription('');
      setSelectedPositions([]);
      if (onSuccess) onSuccess();
    }
  });

  const positionGroups = [
    { value: 'qb', label: 'Quarterbacks' },
    { value: 'rb', label: 'Running Backs' },
    { value: 'wr', label: 'Wide Receivers' },
    { value: 'te', label: 'Tight Ends' },
    { value: 'ol', label: 'Offensive Line' },
    { value: 'dl', label: 'Defensive Line' },
    { value: 'lb', label: 'Linebackers' },
    { value: 'cb', label: 'Cornerbacks' },
    { value: 's', label: 'Safeties' },
    { value: 'all', label: 'All Players' },
  ];

  const handlePublish = () => {
    if (selectedPlays.length === 0) return;

    publishMutation.mutate({
      content_type: 'play',
      content_ids: selectedPlays.map(p => p.id),
      target_groups: selectedPositions.length > 0 ? selectedPositions : ['all'],
      publish_date: new Date(publishDate).toISOString(),
      week_number: weekNumber,
      opponent_name: opponentName
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Send className="h-4 w-4" />
          Publish to Players
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish to Player Portal</DialogTitle>
          <DialogDescription>
            Select which position groups should receive this content and add coaching notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Plays */}
          <div>
            <Label>Selected Content</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPlays.map(play => (
                <Badge key={play.id} variant="secondary">
                  {play.name || play.title}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedPlays.length} play{selectedPlays.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <Label htmlFor="title">Player-Facing Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 3 Red Zone Install"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Coaching Points</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key points players should focus on..."
              rows={3}
            />
          </div>

          {/* Week & Opponent */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="week">Week Number</Label>
              <Input
                id="week"
                type="number"
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opponent">Opponent</Label>
              <Input
                id="opponent"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="e.g., Eagles"
              />
            </div>
          </div>

          {/* Position Groups */}
          <div className="space-y-2">
            <Label>Target Position Groups</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {positionGroups.map((pos) => (
                <div key={pos.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={pos.value}
                    checked={selectedPositions.includes(pos.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPositions([...selectedPositions, pos.value]);
                      } else {
                        setSelectedPositions(selectedPositions.filter(p => p !== pos.value));
                      }
                    }}
                  />
                  <label
                    htmlFor={pos.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {pos.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Date */}
          <div className="space-y-2">
            <Label htmlFor="publishDate">Publish Date</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                id="publishDate"
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quiz Option */}
          <div className="flex items-center space-x-2">
            <Switch
              id="quiz"
              checked={requiresQuiz}
              onCheckedChange={setRequiresQuiz}
            />
            <Label htmlFor="quiz">Require quiz completion</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={publishMutation.isPending || selectedPlays.length === 0}
          >
            {publishMutation.isPending ? 'Publishing...' : 'Publish to Players'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}