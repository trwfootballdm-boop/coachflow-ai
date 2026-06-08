import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, Search, Star, Trash2, Download, X, 
  ChevronRight, Users, PlayCircle, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function FormationLibraryPanel({ isOpen, onClose, onLoadFormation }) {
  const { activeTeamId } = useTeam();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data: formations, isLoading, refetch } = useQuery({
    queryKey: ['formations', activeTeamId],
    queryFn: () => base44.entities.Formation.filter({ 
      team_id: activeTeamId, 
      is_active: true 
    }),
    enabled: isOpen && !!activeTeamId,
  });

  const filteredFormations = (formations || []).filter(f => {
    const matchesSearch = f.formation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.short_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || f.formation_type === filterType;
    return matchesSearch && matchesType;
  });

  const formationTypes = ['all', 'shotgun', 'under_center', 'pistol', 'empty', 'spread', 'i_formation', '4-3', '3-4', 'nickel'];

  const handleLoad = (formation) => {
    onLoadFormation?.(formation);
    toast.success(`Loaded ${formation.formation_name}`);
    onClose?.();
  };

  const handleDelete = async (formationId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this formation? This cannot be undone.')) {
      await base44.entities.Formation.delete(formationId);
      await refetch();
      toast.success('Formation deleted');
    }
  };

  const handleToggleFavorite = async (formation, e) => {
    e.stopPropagation();
    await base44.entities.Formation.update(formation.id, { 
      is_favorite: !formation.is_favorite 
    });
    await refetch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[900px] h-[650px] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Formation Library</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredFormations.length} formation{filteredFormations.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search formations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto">
            {formationTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {type === 'all' ? 'All' : type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-5 grid grid-cols-2 gap-3">
              {isLoading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm">Loading formations...</p>
                  </div>
                </div>
              ) : filteredFormations.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground">No formations found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery ? 'Try adjusting your search' : 'Save your first formation from the designer'}
                  </p>
                </div>
              ) : (
                filteredFormations.map(formation => (
                  <FormationCard
                    key={formation.id}
                    formation={formation}
                    onLoad={() => handleLoad(formation)}
                    onDelete={(e) => handleDelete(formation.id, e)}
                    onToggleFavorite={(e) => handleToggleFavorite(formation, e)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function FormationCard({ formation, onLoad, onDelete, onToggleFavorite }) {
  const playerCount = formation.diagram_data?.players?.length || formation.player_count || 11;
  
  return (
    <div
      onClick={onLoad}
      className="group relative p-4 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-accent/30 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate pr-2">
            {formation.formation_name}
          </h3>
          {formation.short_name && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {formation.short_name}
            </p>
          )}
        </div>
        <button
          onClick={onToggleFavorite}
          className={cn(
            "p-1 rounded transition-colors",
            formation.is_favorite 
              ? "text-accent hover:text-accent/80" 
              : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", formation.is_favorite && "fill-current")} />
        </button>
      </div>

      {/* Preview Grid */}
      <div className="relative h-24 mb-3 rounded-lg bg-muted/30 border border-border/50 overflow-hidden">
        {formation.diagram_data?.players ? (
          <FormationPreview players={formation.diagram_data.players} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Users className="h-6 w-6 opacity-30" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 px-1.5 text-[9px]">
            {playerCount} players
          </Badge>
          {formation.formation_type && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[9px]">
              {formation.formation_type.replace('_', ' ')}
            </Badge>
          )}
        </div>
        
        {formation.usage_count > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <PlayCircle className="h-3 w-3" />
            <span>{formation.usage_count}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FormationPreview({ players = [] }) {
  const width = 200;
  const height = 96;
  const losY = height / 2;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* LOS */}
      <line
        x1={0}
        y1={losY}
        x2={width}
        y2={losY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      
      {/* Players */}
      {players.map((player) => {
        const normalizedX = (player.x / 900) * width;
        const normalizedY = (player.y / 540) * height;
        const isOffense = player.team_side === 'offense';
        
        return (
          <circle
            key={player.token_id}
            cx={normalizedX}
            cy={normalizedY}
            r={5}
            fill={isOffense ? '#3b82f6' : '#ef4444'}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}