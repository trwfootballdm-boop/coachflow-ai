import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, Search, Star, Trash2, FlipHorizontal,
  Loader2, PlayCircle, Plus, Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FormationThumbnail from '@/components/play-designer/FormationThumbnail';
import { mirrorFormationDiagram, deepClone } from '@/lib/formationHelpers';

const FORMATION_TYPES = [
  { value: 'all',          label: 'All' },
  { value: 'shotgun',      label: 'Shotgun' },
  { value: 'under_center', label: 'Under Center' },
  { value: 'pistol',       label: 'Pistol' },
  { value: 'empty',        label: 'Empty' },
  { value: 'spread',       label: 'Spread' },
  { value: 'i_formation',  label: 'I-Form' },
  { value: '4-3',          label: '4-3' },
  { value: '3-4',          label: '3-4' },
  { value: 'nickel',       label: 'Nickel' },
];

export default function Formations() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations', activeTeamId],
    queryFn: () => base44.entities.Formation.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return formations
      .filter((f) => {
        if (filterType !== 'all' && f.formation_type !== filterType) return false;
        if (showFavoritesOnly && !f.is_favorite) return false;
        if (!q) return true;
        return (
          f.formation_name?.toLowerCase().includes(q) ||
          f.short_name?.toLowerCase().includes(q) ||
          f.formation_type?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
        if ((b.usage_count || 0) !== (a.usage_count || 0)) return (b.usage_count || 0) - (a.usage_count || 0);
        return (a.formation_name || '').localeCompare(b.formation_name || '');
      });
  }, [formations, search, filterType, showFavoritesOnly]);

  const favoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.Formation.update(id, { is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Formation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Formation deleted');
    },
  });

  const mirrorMutation = useMutation({
    mutationFn: async (formation) => {
      // Mirror using the players array (new schema)
      const currentPlayers = formation.players || [];
      const mirroredPlayers = currentPlayers.map(p => ({ ...p, x: 450 + (450 - p.x) }));
      return base44.entities.Formation.create({
        team_id: activeTeamId,
        formation_name: `${formation.formation_name} (Mirrored)`,
        short_name: formation.short_name ? `${formation.short_name} M` : undefined,
        formation_type: formation.formation_type,
        players: mirroredPlayers,
        is_favorite: false,
        player_count: formation.player_count,
        personnel: formation.personnel,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Mirrored copy created');
    },
  });

  const handleLoadIntoDesigner = async (formation) => {
    try {
      await base44.entities.Formation.update(formation.id, {
        usage_count: (formation.usage_count || 0) + 1,
      });
    } catch (_) { /* non-blocking */ }
    queryClient.invalidateQueries({ queryKey: ['formations'] });
    navigate(`/play-designer?formation_id=${formation.id}`);
  };

  const handleDelete = (formation) => {
    if (window.confirm(`Delete "${formation.formation_name}"? This cannot be undone.`)) {
      deleteMutation.mutate(formation.id);
    }
  };

  return (
    <div className="page-shell">
      {/* Page header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Playbook</p>
          <h1 className="page-title">Formation Library</h1>
          <p className="page-subtitle">
            Save and reuse offensive and defensive alignments across your playbook.
          </p>
        </div>
        <div className="page-actions">
          <Button onClick={() => navigate('/play-designer')} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Formation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
            placeholder="Search formations…"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FORMATION_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filterType === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            showFavoritesOnly
              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Star className="h-3.5 w-3.5" /> Favorites
        </button>
        <span className="text-xs text-muted-foreground self-center">
          {filtered.length} of {formations.length} formation{formations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading formations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFormations={formations.length > 0} onCreate={() => navigate('/play-designer')} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
              onLoad={() => handleLoadIntoDesigner(formation)}
              onToggleFavorite={() => favoriteMutation.mutate({ id: formation.id, is_favorite: !formation.is_favorite })}
              onMirror={() => mirrorMutation.mutate(formation)}
              onDelete={() => handleDelete(formation)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormationCard({ formation, onLoad, onToggleFavorite, onMirror, onDelete }) {
  const playerCount = formation.players?.length || formation.player_count || 0;

  return (
    <div className="group surface-card overflow-hidden hover:border-primary/40 transition-colors cursor-pointer" onClick={onLoad}>
      {/* Header */}
      <div className="flex items-start justify-between p-2 pb-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-foreground truncate">{formation.formation_name}</h3>
          {formation.short_name && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">{formation.short_name}</Badge>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={cn(
            'shrink-0 rounded-md p-1 transition-colors',
            formation.is_favorite
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100'
          )}
        >
          <Star className="h-3.5 w-3.5" fill={formation.is_favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Preview */}
      <div className="mx-2 mb-2 rounded overflow-hidden bg-muted/30 h-24 flex items-center justify-center">
        {formation.players?.length ? (
          <FormationThumbnail players={formation.players} width={200} height={96} showLabels={playerCount <= 14} />
        ) : (
          <LayoutGrid className="h-6 w-6 text-muted-foreground/30" />
        )}
      </div>

      {/* Meta */}
      <div className="px-2 pb-1.5 flex flex-wrap items-center gap-1">
        <span className="text-[10px] text-muted-foreground">{playerCount}p</span>
        {formation.formation_type && (
          <Badge variant="outline" className="text-[9px] px-1 py-0">{formation.formation_type.replace('_', ' ')}</Badge>
        )}
        {formation.personnel && (
          <Badge variant="outline" className="text-[9px] px-1 py-0">{formation.personnel}</Badge>
        )}
        {formation.usage_count > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">×{formation.usage_count}</span>
        )}
      </div>

      {/* Action bar */}
      <div className="flex border-t border-border/50 divide-x divide-border/50">
        <button
          onClick={(e) => { e.stopPropagation(); onLoad(); }}
          className="flex-1 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Load
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="px-2.5 py-1.5 text-muted-foreground hover:bg-muted/50 transition-colors">
              <MoreHorizontalIcon />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMirror(); }}>
              <FlipHorizontal className="h-4 w-4 mr-2" /> Mirror Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete formation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function EmptyState({ hasFormations, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-3">
      <LayoutGrid className="h-12 w-12 text-muted-foreground/30" />
      <div>
        <h2 className="text-lg font-semibold">{hasFormations ? 'No formations match your filters' : 'No formations yet'}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hasFormations
            ? 'Try adjusting your search or filter selection.'
            : 'Design a play, set your alignment, then choose "Save as Formation" from the play designer header.'}
        </p>
      </div>
      {!hasFormations && (
        <Button onClick={onCreate} variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" /> Open Play Designer
        </Button>
      )}
    </div>
  );
}