import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Edit2, Trash2, Shield, Mail, Phone, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffManagementPanel({ teamId }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', teamId],
    queryFn: async () => {
      const response = await base44.entities.Staff.filter({ team_id: teamId, is_active: true });
      return response;
    },
    enabled: !!teamId
  });

  const filteredStaff = staff?.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.position_group && s.position_group.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coaching Staff
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Coaching Staff Member</DialogTitle>
              </DialogHeader>
              <AddStaffForm 
                teamId={teamId} 
                onSuccess={() => {
                  queryClient.invalidateQueries(['staff', teamId]);
                  setIsAddDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No staff members found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStaff.map(member => (
              <StaffCard key={member.id} member={member} teamId={teamId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StaffCard({ member, teamId }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Staff.update(member.id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', teamId]);
    }
  });

  const roleColors = {
    head_coach: 'bg-red-500/10 text-red-500 border-red-500/30',
    offensive_coordinator: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    defensive_coordinator: 'bg-green-500/10 text-green-500 border-green-500/30',
    special_teams_coordinator: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    position_coach: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    analyst: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    graduate_assistant: 'bg-orange-500/10 text-orange-500 border-orange-500/30'
  };

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{member.full_name}</h4>
            {member.permissions?.is_admin && (
              <Badge variant="outline" className="h-5 text-[10px]">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant="outline" className={cn("text-xs", roleColors[member.role] || roleColors.analyst)}>
              {member.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {member.position_group && (
              <span className="text-xs">{member.position_group}</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {member.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AddStaffForm({ teamId, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'position_coach',
    position_group: '',
    side_of_ball: 'all'
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Staff.create({
        team_id: teamId,
        user_id: 'pending', // Will be linked when user registers
        ...formData,
        permissions: {
          can_create_plays: true,
          can_edit_plays: true,
          can_delete_plays: false,
          can_approve_plays: formData.role === 'head_coach' || formData.role === 'offensive_coordinator' || formData.role === 'defensive_coordinator',
          can_create_scripts: true,
          can_edit_scripts: true,
          can_approve_scripts: formData.role === 'head_coach',
          can_create_game_plans: true,
          can_edit_game_plans: true,
          can_approve_game_plans: formData.role === 'head_coach',
          can_invite_staff: formData.role === 'head_coach',
          is_admin: formData.role === 'head_coach'
        },
        joined_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    },
    onSuccess
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Full Name</label>
        <Input
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Role</label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="head_coach">Head Coach</SelectItem>
            <SelectItem value="offensive_coordinator">Offensive Coordinator</SelectItem>
            <SelectItem value="defensive_coordinator">Defensive Coordinator</SelectItem>
            <SelectItem value="special_teams_coordinator">Special Teams Coordinator</SelectItem>
            <SelectItem value="position_coach">Position Coach</SelectItem>
            <SelectItem value="analyst">Analyst</SelectItem>
            <SelectItem value="graduate_assistant">Graduate Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Position Group (Optional)</label>
        <Input
          placeholder="e.g., QBs, WRs, LBs"
          value={formData.position_group}
          onChange={(e) => setFormData({ ...formData, position_group: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Side of Ball</label>
        <Select
          value={formData.side_of_ball}
          onValueChange={(value) => setFormData({ ...formData, side_of_ball: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="offense">Offense</SelectItem>
            <SelectItem value="defense">Defense</SelectItem>
            <SelectItem value="special_teams">Special Teams</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={addMutation.isPending}>
        {addMutation.isPending ? 'Adding...' : 'Add Staff Member'}
      </Button>
    </form>
  );
}