import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Calendar, Trash2, Clock } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";

const periodTypes = ['install', 'team_run', 'team_pass', 'red_zone', 'two_minute', 'goal_line', 'special_teams', 'walkthrough', 'custom'];

export default function PracticeScripts() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newScript, setNewScript] = useState({ title: '', practice_date: '', period_type: 'install', duration_minutes: 15 });

  const { data: scripts = [] } = useQuery({
    queryKey: ['practiceScripts', activeTeamId],
    queryFn: () => base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PracticeScript.create({ ...data, team_id: activeTeamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      setShowCreate(false);
      setNewScript({ title: '', practice_date: '', period_type: 'install', duration_minutes: 15 });
      toast.success('Practice script created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PracticeScript.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      toast.success('Script deleted');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Practice Scripts</h1>
          <p className="text-sm text-muted-foreground">{scripts.length} scripts</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Script</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">New Practice Script</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={newScript.title} onChange={(e) => setNewScript({ ...newScript, title: e.target.value })} placeholder="e.g. Tuesday Install Period" className="mt-1.5" />
              </div>
              <div>
                <Label>Practice Date</Label>
                <Input type="date" value={newScript.practice_date} onChange={(e) => setNewScript({ ...newScript, practice_date: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Period Type</Label>
                <Select value={newScript.period_type} onValueChange={(v) => setNewScript({ ...newScript, period_type: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {periodTypes.map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" value={newScript.duration_minutes} onChange={(e) => setNewScript({ ...newScript, duration_minutes: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              </div>
              <Button onClick={() => createMutation.mutate(newScript)} disabled={!newScript.title} className="w-full">
                Create Script
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No practice scripts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Build scripts to organize your practice periods.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map(script => (
            <Card key={script.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1">{script.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs capitalize">{script.period_type?.replace(/_/g, ' ')}</Badge>
                  {script.duration_minutes && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" /> {script.duration_minutes} min
                    </Badge>
                  )}
                </div>
                {script.practice_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(script.practice_date), 'MMM d, yyyy')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {script.play_sequence?.length || 0} plays in sequence
                </p>
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => deleteMutation.mutate(script.id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}