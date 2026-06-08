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
import { Textarea } from "@/components/ui/textarea";
import { Plus, ClipboardList, Calendar, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CallSheet from './CallSheet';

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  finalized: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export default function GamePlanning() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [newPlan, setNewPlan] = useState({ title: '', opponent_name: '', game_date: '', notes: '' });

  const { data: plans = [] } = useQuery({
    queryKey: ['gamePlans', activeTeamId],
    queryFn: () => base44.entities.GamePlan.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GamePlan.create({ ...data, team_id: activeTeamId, status: 'draft' }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      setShowCreate(false);
      setNewPlan({ title: '', opponent_name: '', game_date: '', notes: '' });
      setActivePlan(created);
      toast.success('Game plan created — open Call Sheet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GamePlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePlans'] });
      toast.success('Game plan deleted');
    },
  });

  if (activePlan) {
    return <CallSheet plan={activePlan} onBack={() => setActivePlan(null)} />;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Game Planning</h1>
          <p className="text-sm text-muted-foreground">{plans.length} game plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Game Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">New Game Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={newPlan.title} onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })} placeholder="e.g. Week 3 vs Eagles" className="mt-1.5" />
              </div>
              <div>
                <Label>Opponent</Label>
                <Input value={newPlan.opponent_name} onChange={(e) => setNewPlan({ ...newPlan, opponent_name: e.target.value })} placeholder="Opponent name" className="mt-1.5" />
              </div>
              <div>
                <Label>Game Date</Label>
                <Input type="date" value={newPlan.game_date} onChange={(e) => setNewPlan({ ...newPlan, game_date: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={newPlan.notes} onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })} placeholder="Game plan notes..." className="mt-1.5" />
              </div>
              <Button onClick={() => createMutation.mutate(newPlan)} disabled={!newPlan.title} className="w-full">
                Create & Open Call Sheet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No game plans yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a game plan to start building your call sheet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className="border shadow-sm hover:shadow-md transition-all group cursor-pointer"
              onClick={() => setActivePlan(plan)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{plan.title}</h3>
                    {plan.opponent_name && <p className="text-sm text-muted-foreground">vs {plan.opponent_name}</p>}
                  </div>
                  <Badge variant="secondary" className={statusColors[plan.status] || ''}>
                    {plan.status?.replace('_', ' ')}
                  </Badge>
                </div>
                {plan.game_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(plan.game_date), 'EEE, MMM d, yyyy')}
                  </div>
                )}
                {plan.notes && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{plan.notes}</p>}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="ghost" className="text-xs gap-1 text-primary flex-1">
                    <ArrowRight className="h-3 w-3" /> Open Call Sheet
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(plan.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
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