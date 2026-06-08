import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function LibraryImportDialog({ item, onClose }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list('team_name'),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeamId) throw new Error('Select a team first');

      // Build play data from library item
      const isBundle = item.bundle;
      if (isBundle) {
        // Bundle import — just record the import map for now
        await base44.entities.LibraryImportMap.create({
          team_id: selectedTeamId,
          library_bundle_id: item.bundle.id,
          import_type: 'bundle',
        });
        return { count: 1 };
      }

      // Single item import
      const playData = buildPlayFromItem(item, selectedTeamId);
      const play = item.item_type === 'formation'
        ? await base44.entities.Formation.create({
          team_id: selectedTeamId,
          side_of_ball: item.side_of_ball,
          formation_name: item.formation_name || item.item_name,
          formation_family: item.system_family || 'base',
          notes: item.short_description,
          diagram_data: item.diagram_data,
          active: true,
        })
        : await base44.entities.Play.create(playData);

      // Record the import
      await base44.entities.LibraryImportMap.create({
        team_id: selectedTeamId,
        library_item_id: item.id,
        import_type: item.item_type === 'formation' ? 'formation_only' : 'single_item',
        imported_play_id: play.id,
      });

      // Save diagram to PlayDiagram if it's a play
      if (item.item_type !== 'formation' && item.diagram_data?.players?.length) {
        await base44.entities.PlayDiagram.create({
          play_id: play.id,
          diagram_json: item.diagram_data,
          version_label: 'v1 (imported)',
          active: true,
        });
      }

      return { count: 1, playId: play.id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success(`Imported successfully into your playbook!`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Import failed');
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import to Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* What's being imported */}
          <div className="border border-border rounded-xl p-3 bg-secondary/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Importing</p>
            <p className="font-display font-bold">{item.bundle?.bundle_name || item.item_name}</p>
            {item.short_description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.short_description}</p>
            )}
            <div className="flex gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px] capitalize">
                {item.item_type || item.bundle?.bundle_type}
              </Badge>
              {item.side_of_ball && (
                <Badge variant="outline" className="text-[10px] capitalize">{item.side_of_ball}</Badge>
              )}
            </div>
          </div>

          {/* Team selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Import into Team
            </label>
            {teams.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-xl p-3">
                <Users className="h-4 w-4" />
                No teams found. Create a team first in Settings.
              </div>
            ) : (
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.team_name} ({team.age_group} · {team.season_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* What happens */}
          <div className="space-y-1.5">
            {[
              'Creates an editable copy in your team workspace',
              'The master library item is not modified',
              'You can edit, diagram, and animate the imported copy',
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!selectedTeamId || importMutation.isPending}
            className="flex-1 rounded-xl gap-2">
            <Download className="h-4 w-4" />
            {importMutation.isPending ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildPlayFromItem(item, teamId) {
  const sideMap = { offense: 'offense', defense: 'defense', special_teams: 'special_teams' };
  const runPassMap = { run: 'run', pass: 'pass', special_teams: 'special_teams', n_a: 'run' };
  return {
    team_id: teamId,
    name: item.item_name,
    short_name: item.item_name.replace(/\s+/g, ' ').slice(0, 20),
    side: sideMap[item.side_of_ball] || 'offense',
    play_family: item.concept_family?.replace(/_/g, ' '),
    run_pass: runPassMap[item.run_pass] || 'run',
    play_type: mapPlayType(item),
    formation: item.formation_name || '',
    concept: item.concept_family?.replace(/_/g, ' ') || '',
    direction: item.direction !== 'both' && item.direction !== 'n_a' ? item.direction : 'any',
    notes: item.coaching_points || item.short_description || '',
    age_level_difficulty: item.age_level === 'youth' ? 'youth' : 'middle_school',
    risk_level: item.difficulty_level === 'beginner' ? 'low' : item.difficulty_level === 'moderate' ? 'medium' : 'high',
    tags: item.tags || [],
    is_active: true,
    version: 1,
    diagram_data: item.diagram_data || null,
  };
}

function mapPlayType(item) {
  if (item.item_type === 'special_teams') return 'special_teams';
  if (item.run_pass === 'pass') {
    if (item.concept_family?.includes('boot') || item.concept_family?.includes('waggle')) return 'play_action';
    return 'pass';
  }
  return 'run';
}