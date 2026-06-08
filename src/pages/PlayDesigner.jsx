import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import FootballField from '@/components/play-designer/FootballField';
import PlayDetailsForm from '@/components/play-designer/PlayDetailsForm';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

export default function PlayDesigner() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [play, setPlay] = useState({
    team_id: activeTeamId,
    name: '',
    side: 'offense',
    play_type: '',
    formation: '',
    concept: '',
    personnel: '',
    hash: 'any',
    field_zone: 'any',
    tags: [],
    notes: '',
    is_favorite: false,
    diagram_data: null,
  });

  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      base44.entities.Play.filter({ id: editId }).then(plays => {
        if (plays.length > 0) {
          setPlay(plays[0]);
        }
        setLoading(false);
      });
    }
  }, [editId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, team_id: activeTeamId };
      if (editId) {
        return base44.entities.Play.update(editId, payload);
      }
      return base44.entities.Play.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success(editId ? 'Play updated' : 'Play saved');
      navigate('/play-library');
    },
  });

  const handleDiagramChange = (diagramData) => {
    setPlay(prev => ({ ...prev, diagram_data: diagramData }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {editId ? 'Edit Play' : 'New Play'}
            </h1>
            <p className="text-sm text-muted-foreground">Design your play on the field</p>
          </div>
        </div>
        <Button
          onClick={() => saveMutation.mutate(play)}
          disabled={!play.name || saveMutation.isPending}
          className="gap-2 rounded-xl"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Play
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="p-5 border-0 shadow-sm">
            <FootballField
              diagramData={play.diagram_data}
              onChange={handleDiagramChange}
              side={play.side}
            />
          </Card>
        </div>
        <div>
          <Card className="p-5 border-0 shadow-sm">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Play Details
            </h2>
            <PlayDetailsForm play={play} onChange={setPlay} />
          </Card>
        </div>
      </div>
    </div>
  );
}