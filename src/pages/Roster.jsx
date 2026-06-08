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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const positions = ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'C', 'OG', 'OT', 'DL', 'DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS', 'K', 'P', 'LS', 'KR', 'PR', 'ATH'];

export default function Roster() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPos, setFilterPos] = useState('all');
  const [newPlayer, setNewPlayer] = useState({ first_name: '', last_name: '', number: '', position: '', grade: '', height: '', weight: '' });

  const { data: players = [] } = useQuery({
    queryKey: ['players', activeTeamId],
    queryFn: () => base44.entities.Player.filter({ team_id: activeTeamId }, 'number'),
    enabled: !!activeTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create({ ...data, team_id: activeTeamId, number: data.number ? parseInt(data.number) : undefined, weight: data.weight ? parseInt(data.weight) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowCreate(false);
      setNewPlayer({ first_name: '', last_name: '', number: '', position: '', grade: '', height: '', weight: '' });
      toast.success('Player added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player removed');
    },
  });

  const filtered = players.filter(p => {
    const matchSearch = !searchQuery || 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.number).includes(searchQuery);
    const matchPos = filterPos === 'all' || p.position === filterPos;
    return matchSearch && matchPos;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Roster & Depth Chart</h1>
          <p className="text-sm text-muted-foreground">{players.length} players</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Add Player</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input value={newPlayer.first_name} onChange={(e) => setNewPlayer({ ...newPlayer, first_name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={newPlayer.last_name} onChange={(e) => setNewPlayer({ ...newPlayer, last_name: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Number</Label>
                  <Input type="number" value={newPlayer.number} onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={newPlayer.position} onValueChange={(v) => setNewPlayer({ ...newPlayer, position: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pos" /></SelectTrigger>
                    <SelectContent>
                      {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input value={newPlayer.grade} onChange={(e) => setNewPlayer({ ...newPlayer, grade: e.target.value })} placeholder="e.g. 10th" className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Height</Label>
                  <Input value={newPlayer.height} onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })} placeholder="e.g. 5'11" className="mt-1.5" />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input type="number" value={newPlayer.weight} onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })} placeholder="lbs" className="mt-1.5" />
                </div>
              </div>
              <Button onClick={() => createMutation.mutate(newPlayer)} disabled={!newPlayer.first_name || !newPlayer.last_name} className="w-full">
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search players..." className="pl-9 bg-secondary/50 border-0" />
        </div>
        <Select value={filterPos} onValueChange={setFilterPos}>
          <SelectTrigger className="w-[120px] bg-secondary/50 border-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No players found</h3>
          <p className="text-sm text-muted-foreground mt-1">Add players to build your roster.</p>
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Grade</TableHead>
                <TableHead className="font-semibold">Height</TableHead>
                <TableHead className="font-semibold">Weight</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(player => (
                <TableRow key={player.id} className="hover:bg-secondary/30">
                  <TableCell className="font-bold">{player.number}</TableCell>
                  <TableCell className="font-medium">{player.first_name} {player.last_name}</TableCell>
                  <TableCell>
                    {player.position && <Badge variant="secondary" className="text-xs">{player.position}</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{player.grade}</TableCell>
                  <TableCell className="text-muted-foreground">{player.height}</TableCell>
                  <TableCell className="text-muted-foreground">{player.weight ? `${player.weight} lbs` : ''}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(player.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}