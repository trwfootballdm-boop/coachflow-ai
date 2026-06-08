import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PenTool, Search, Star, MoreVertical, Trash2, Copy, Edit, Filter, Plus, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const playTypeColors = {
  run: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  screen: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  play_action: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rpo: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  trick: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  special_teams: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export default function PlayLibrary() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSide, setFilterSide] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Play.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Play deleted');
    },
  });

  const toggleFavMutation = useMutation({
    mutationFn: ({ id, isFav }) => base44.entities.Play.update(id, { is_favorite: !isFav }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plays'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (play) => {
      const { id, created_date, updated_date, created_by_id, ...data } = play;
      return base44.entities.Play.create({ ...data, name: `${data.name} (Copy)` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Play duplicated');
    },
  });

  const filteredPlays = plays.filter(play => {
    const matchSearch = !searchQuery || 
      play.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.formation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.concept?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || play.play_type === filterType;
    const matchSide = filterSide === 'all' || play.side === filterSide;
    const matchFav = !showFavoritesOnly || play.is_favorite;
    return matchSearch && matchType && matchSide && matchFav;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Play Library</h1>
          <p className="text-sm text-muted-foreground">{plays.length} plays in your playbook</p>
        </div>
        <Button onClick={() => navigate('/play-designer')} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          New Play
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-0"
          />
        </div>
        <Select value={filterSide} onValueChange={setFilterSide}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="offense">Offense</SelectItem>
            <SelectItem value="defense">Defense</SelectItem>
            <SelectItem value="special_teams">Special Teams</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-secondary/50 border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['run', 'pass', 'screen', 'play_action', 'rpo', 'trick'].map(t => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showFavoritesOnly ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="gap-1.5 rounded-lg"
        >
          <Star className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
          Favorites
        </Button>
      </div>

      {/* Play grid */}
      {filteredPlays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <Library className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">No plays found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {plays.length === 0 ? 'Create your first play to get started.' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlays.map((play) => (
            <Card
              key={play.id}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/play-designer?id=${play.id}`)}
            >
              <CardContent className="p-4">
                {/* Play header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{play.name}</h3>
                      {play.is_favorite && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    {play.formation && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{play.formation}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/play-designer?id=${play.id}`); }}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(play); }}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        toggleFavMutation.mutate({ id: play.id, isFav: play.is_favorite });
                      }}>
                        <Star className="h-4 w-4 mr-2" /> {play.is_favorite ? 'Unfavorite' : 'Favorite'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(play.id); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Play diagram placeholder */}
                <div className="aspect-[3/2] rounded-lg bg-emerald-900/20 dark:bg-emerald-900/30 mb-3 flex items-center justify-center overflow-hidden">
                  <PenTool className="h-8 w-8 text-emerald-700/30 dark:text-emerald-500/20" />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {play.play_type && (
                    <Badge variant="secondary" className={cn("text-[10px] px-2 py-0 capitalize", playTypeColors[play.play_type])}>
                      {play.play_type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {play.concept && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                      {play.concept}
                    </Badge>
                  )}
                  {play.personnel && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                      {play.personnel} personnel
                    </Badge>
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