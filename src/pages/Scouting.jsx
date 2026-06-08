import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar, Trash2, Eye } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";

export default function Scouting() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newOpp, setNewOpp] = useState({ name: '', game_date: '', offensive_tendencies: '', defensive_tendencies: '', strengths: '', weaknesses: '', notes: '' });

  const { data: opponents = [] } = useQuery({
    queryKey: ['opponents', activeTeamId],
    queryFn: () => base44.entities.Opponent.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Opponent.create({ ...data, team_id: activeTeamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] });
      setShowCreate(false);
      setNewOpp({ name: '', game_date: '', offensive_tendencies: '', defensive_tendencies: '', strengths: '', weaknesses: '', notes: '' });
      toast.success('Opponent added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Opponent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] });
      toast.success('Opponent removed');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Opponent Scouting</h1>
          <p className="text-sm text-muted-foreground">{opponents.length} opponents scouted</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Add Opponent</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">New Opponent Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label>Opponent Name</Label>
                <Input value={newOpp.name} onChange={(e) => setNewOpp({ ...newOpp, name: e.target.value })} placeholder="Team name" className="mt-1.5" />
              </div>
              <div>
                <Label>Game Date</Label>
                <Input type="date" value={newOpp.game_date} onChange={(e) => setNewOpp({ ...newOpp, game_date: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Offensive Tendencies</Label>
                <Textarea value={newOpp.offensive_tendencies} onChange={(e) => setNewOpp({ ...newOpp, offensive_tendencies: e.target.value })} placeholder="What do they like to do on offense..." className="mt-1.5" />
              </div>
              <div>
                <Label>Defensive Tendencies</Label>
                <Textarea value={newOpp.defensive_tendencies} onChange={(e) => setNewOpp({ ...newOpp, defensive_tendencies: e.target.value })} placeholder="What do they like to do on defense..." className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Strengths</Label>
                  <Textarea value={newOpp.strengths} onChange={(e) => setNewOpp({ ...newOpp, strengths: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Weaknesses</Label>
                  <Textarea value={newOpp.weaknesses} onChange={(e) => setNewOpp({ ...newOpp, weaknesses: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <Button onClick={() => createMutation.mutate(newOpp)} disabled={!newOpp.name} className="w-full">
                Save Opponent Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {opponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No opponent reports</h3>
          <p className="text-sm text-muted-foreground mt-1">Add opponents to start building scouting reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opponents.map(opp => (
            <Card key={opp.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{opp.name}</h3>
                    {opp.game_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(opp.game_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => deleteMutation.mutate(opp.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {opp.offensive_tendencies && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Offensive Tendencies</p>
                    <p className="text-sm mt-0.5 line-clamp-2">{opp.offensive_tendencies}</p>
                  </div>
                )}
                {opp.defensive_tendencies && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Defensive Tendencies</p>
                    <p className="text-sm mt-0.5 line-clamp-2">{opp.defensive_tendencies}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {opp.strengths && (
                    <div className="p-2 rounded-lg bg-emerald-500/5">
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Strengths</p>
                      <p className="text-xs mt-0.5 line-clamp-2">{opp.strengths}</p>
                    </div>
                  )}
                  {opp.weaknesses && (
                    <div className="p-2 rounded-lg bg-red-500/5">
                      <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase">Weaknesses</p>
                      <p className="text-xs mt-0.5 line-clamp-2">{opp.weaknesses}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}