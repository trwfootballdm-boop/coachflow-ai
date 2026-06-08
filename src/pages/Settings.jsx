import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings as SettingsIcon, Trash2, Save, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const levels = [
  { value: 'youth', label: 'Youth Football' },
  { value: 'middle_school', label: 'Middle School' },
  { value: 'high_school', label: 'High School' },
  { value: 'club', label: 'Club / Travel' },
];

const offSystems = ['spread', 'pro_style', 'wing_t', 'flexbone', 'pistol', 'single_wing', 'i_formation', 'shotgun', 'custom'];
const defSystems = ['4-3', '3-4', '4-2-5', '3-3-5', '5-3', '6-2', '46', 'cover_3', 'custom'];

export default function Settings() {
  const { activeTeamId, setActiveTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', level: 'high_school', season: '', mascot: '', primary_color: '#10b981', secondary_color: '#ffffff' });
  const [editTeam, setEditTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  useEffect(() => {
    if (activeTeam && !editTeam) {
      setEditTeam({ ...activeTeam });
    }
  }, [activeTeam]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setActiveTeamId(team.id);
      setShowCreate(false);
      toast.success('Team created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.update(activeTeam.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team settings saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await base44.users.inviteUser(inviteEmail.trim(), 'user');
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Team Settings</h1>
          <p className="text-sm text-muted-foreground">Manage teams, members, and preferences</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Team Name</Label>
                <Input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g. Westfield Eagles" className="mt-1.5" />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={newTeam.level} onValueChange={(v) => setNewTeam({ ...newTeam, level: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Season</Label>
                <Input value={newTeam.season} onChange={(e) => setNewTeam({ ...newTeam, season: e.target.value })} placeholder="e.g. Fall 2024" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={newTeam.primary_color} onChange={(e) => setNewTeam({ ...newTeam, primary_color: e.target.value })} className="h-9 w-9 rounded cursor-pointer" />
                    <Input value={newTeam.primary_color} onChange={(e) => setNewTeam({ ...newTeam, primary_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={newTeam.secondary_color} onChange={(e) => setNewTeam({ ...newTeam, secondary_color: e.target.value })} className="h-9 w-9 rounded cursor-pointer" />
                    <Input value={newTeam.secondary_color} onChange={(e) => setNewTeam({ ...newTeam, secondary_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
              </div>
              <Button onClick={() => createMutation.mutate(newTeam)} disabled={!newTeam.name} className="w-full">
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Settings */}
      {editTeam && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-muted-foreground" />
              {editTeam.name || 'Team'} Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Team Name</Label>
                <Input value={editTeam.name || ''} onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Season</Label>
                <Input value={editTeam.season || ''} onChange={(e) => setEditTeam({ ...editTeam, season: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Offensive System</Label>
                <Select value={editTeam.offensive_system || ''} onValueChange={(v) => setEditTeam({ ...editTeam, offensive_system: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {offSystems.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Defensive System</Label>
                <Select value={editTeam.defensive_system || ''} onValueChange={(v) => setEditTeam({ ...editTeam, defensive_system: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {defSystems.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Upcoming Opponent</Label>
                <Input value={editTeam.upcoming_opponent || ''} onChange={(e) => setEditTeam({ ...editTeam, upcoming_opponent: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Next Game Date</Label>
                <Input type="date" value={editTeam.next_game_date || ''} onChange={(e) => setEditTeam({ ...editTeam, next_game_date: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <Button
              onClick={() => updateMutation.mutate(editTeam)}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Coaches */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Invite Coaches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Invite assistant coaches to collaborate on your playbook and game plans.</p>
          <div className="flex gap-3">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="coach@email.com"
              className="flex-1"
            />
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      {teams.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">All Teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  {team.primary_color && (
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.primary_color }} />
                  )}
                  <div>
                    <p className="font-medium text-sm">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.season} · {team.level?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setActiveTeamId(team.id); setEditTeam({ ...team }); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(team.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}