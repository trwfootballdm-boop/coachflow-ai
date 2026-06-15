import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/components/TeamContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import FormationThumbnail from './FormationThumbnail';
import {
  extractFormationFromDiagram,
  suggestFormationType,
  autoShortName,
  personnelGrouping,
} from '@/lib/formationHelpers';

const FORMATION_TYPES = [
  { value: 'shotgun',      label: 'Shotgun' },
  { value: 'under_center', label: 'Under Center' },
  { value: 'pistol',       label: 'Pistol' },
  { value: 'empty',        label: 'Empty' },
  { value: 'spread',       label: 'Spread' },
  { value: 'i_formation',  label: 'I-Formation' },
  { value: '4-3',          label: '4-3 Defense' },
  { value: '3-4',          label: '3-4 Defense' },
  { value: 'nickel',       label: 'Nickel Defense' },
];

export default function SaveFormationDialog({
  open,
  onOpenChange,
  diagram,
  defaultName = '',
}) {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [formation_name, setName] = useState('');
  const [short_name, setShortName] = useState('');
  const [formation_type, setType] = useState('shotgun');

  const formationData = useMemo(
    () => extractFormationFromDiagram(diagram),
    [diagram]
  );

  useEffect(() => {
    if (open) {
      setName(defaultName || '');
      setShortName(autoShortName(defaultName || ''));
      setType(suggestFormationType(formationData.players));
    }
  }, [open, defaultName, formationData]);

  const playerCount = formationData.players.length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        team_id: activeTeamId,
        formation_name: formation_name.trim(),
        short_name: short_name.trim() || autoShortName(formation_name),
        formation_type,
        // Store players directly on the entity (new schema)
        players: formationData.players,
        is_favorite: false,
        player_count: playerCount,
        personnel: personnelGrouping(formationData.players),
      };
      return base44.entities.Formation.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success(`Saved "${formation_name}" to formation library`);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(`Failed to save formation: ${err?.message || 'unknown error'}`);
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!formation_name.trim()) { toast.error('Formation name is required'); return; }
    if (playerCount === 0) { toast.error('Cannot save an empty formation'); return; }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Formation</DialogTitle>
          <DialogDescription>
            Save the current player alignment to your formation library. Routes
            and annotations will not be included.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
          <FormationThumbnail
            players={formationData.players}
            width={100}
            height={68}
            showLabels={playerCount <= 14}
          />
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{playerCount} players</p>
            <p>{personnelGrouping(formationData.players)} personnel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Formation name <span className="text-destructive">*</span></Label>
            <Input
              value={formation_name}
              onChange={(e) => {
                setName(e.target.value);
                if (!short_name) setShortName(autoShortName(e.target.value));
              }}
              placeholder="e.g. Trips Right Shotgun"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Short name</Label>
              <Input
                value={short_name}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Trips Rt"
                maxLength={24}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={formation_type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saveMutation.isPending ? 'Saving…' : 'Save Formation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}