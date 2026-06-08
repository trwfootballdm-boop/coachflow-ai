import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Plus, CheckCircle, Clock, Layers, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FootballField from '@/components/play-designer/FootballField';
import AnimationPlayer from '@/components/play-designer/AnimationPlayer';

export default function DiagramTab({ playId, play, onChange }) {
  const queryClient = useQueryClient();
  const [editingDiagram, setEditingDiagram] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [localDiagram, setLocalDiagram] = useState(play.diagram_data || null);

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams', playId],
    queryFn: () => base44.entities.PlayDiagram.filter({ play_id: playId }, '-created_date'),
    enabled: !!playId,
  });

  const saveDiagramMutation = useMutation({
    mutationFn: async (diagramJson) => {
      const existing = diagrams.find(d => d.active);
      if (existing) {
        return base44.entities.PlayDiagram.update(existing.id, { diagram_json: diagramJson });
      }
      return base44.entities.PlayDiagram.create({
        play_id: playId, diagram_json: diagramJson, version_label: 'v1', active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      onChange({ ...play, diagram_data: localDiagram });
      setEditingDiagram(false);
      toast.success('Diagram saved');
    },
  });

  const saveAnimationMutation = useMutation({
    mutationFn: async (animationJson) => {
      const existing = diagrams.find(d => d.active);
      if (existing) {
        return base44.entities.PlayDiagram.update(existing.id, { animation_json: animationJson });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      toast.success('Animation timing saved');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (diagramId) => {
      await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.update(diagramId, { active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams', playId] }),
  });

  const activeDiagram = diagrams.find(d => d.active);
  const activeDiagramData = activeDiagram?.diagram_json || localDiagram;
  const players = activeDiagramData?.players || [];
  const paths = activeDiagramData?.paths || activeDiagramData?.routes?.map((r, i) => ({
    path_id: `route_${i}`,
    path_type: r.type === 'block' ? 'blocking_track' : 'pass_route',
    token_id: r.playerId,
    points: r.points,
    curve_type: 'straight',
    stroke_width: 2.5,
  })) || [];

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <PenTool className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold">Save play first</p>
        <p className="text-sm text-muted-foreground mt-1">Save the play overview to enable diagram editing.</p>
      </div>
    );
  }

  // ── Full-screen animation player ──────────────────────────────────────────
  if (showAnimation) {
    return (
      <div className="-m-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <Play className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-white">{play.name || play.play_name || 'Play Animation'}</span>
            {play.formation && <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">{play.formation}</Badge>}
          </div>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white gap-1.5"
            onClick={() => setShowAnimation(false)}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AnimationPlayer
            players={players}
            paths={paths}
            initialTimeline={activeDiagram?.animation_json || null}
            onSave={(timeline) => saveAnimationMutation.mutate(timeline)}
            onClose={() => setShowAnimation(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-semibold">Play Diagram</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {diagrams.length} diagram version{diagrams.length !== 1 ? 's' : ''} · {activeDiagram ? 'Active version set' : 'No active diagram'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeDiagram && !editingDiagram && (
            <Button size="sm" variant="outline" onClick={() => setShowAnimation(true)} className="gap-1.5 rounded-xl text-xs h-8">
              <Play className="h-3.5 w-3.5 text-primary" /> Preview Animation
            </Button>
          )}
          {!editingDiagram && (
            <Button size="sm" onClick={() => setEditingDiagram(true)} className="gap-1.5 rounded-xl text-xs h-8">
              <PenTool className="h-3.5 w-3.5" /> {activeDiagram ? 'Edit Diagram' : 'Create Diagram'}
            </Button>
          )}
          {editingDiagram && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditingDiagram(false)} className="rounded-xl text-xs h-8">Cancel</Button>
              <Button size="sm" onClick={() => saveDiagramMutation.mutate(localDiagram)} className="gap-1.5 rounded-xl text-xs h-8">
                Save Diagram
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor or Preview */}
      {editingDiagram ? (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editing Diagram</span>
          </div>
          <div className="p-4">
            <FootballField
              diagramData={localDiagram}
              onChange={setLocalDiagram}
              side={play.side}
            />
          </div>
        </div>
      ) : activeDiagram ? (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Diagram · {activeDiagram.version_label}</span>
            {activeDiagram.animation_json && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 ml-auto">Animation saved</Badge>
            )}
          </div>
          <div className="p-4">
            <FootballField
              diagramData={activeDiagram.diagram_json}
              onChange={() => {}}
              side={play.side}
              readOnly
            />
          </div>
          <div className="px-4 pb-3 flex items-center gap-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => setShowAnimation(true)} className="gap-1.5 text-xs h-8 rounded-xl">
              <Play className="h-3.5 w-3.5 text-primary" /> Preview & Edit Animation
            </Button>
            {activeDiagram.animation_json && (
              <span className="text-[10px] text-muted-foreground">
                Timeline: {(activeDiagram.animation_json.total_duration_ms / 1000).toFixed(1)}s · {activeDiagram.animation_json.events?.length || 0} events
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
          <div className="h-14 w-14 rounded-2xl bg-emerald-900/20 flex items-center justify-center mb-4 border border-emerald-900/10">
            <PenTool className="h-7 w-7 text-emerald-700/40" />
          </div>
          <p className="font-semibold">No diagram yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">Draw the play on the interactive field to visualize blocking, routes, and assignments.</p>
          <Button size="sm" onClick={() => setEditingDiagram(true)} className="mt-4 gap-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Create Diagram
          </Button>
        </div>
      )}

      {/* Version list */}
      {diagrams.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">All Versions</h4>
          </div>
          <div className="space-y-2">
            {diagrams.map(d => (
              <div key={d.id} className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                d.active ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              )}>
                <div className="flex items-center gap-2">
                  {d.active
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : <Clock className="h-4 w-4 text-muted-foreground" />
                  }
                  <span className="text-sm font-medium">{d.version_label || 'Unnamed'}</span>
                  {d.active && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Active</Badge>}
                  {d.animation_json && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Animated</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {d.active && (
                    <Button size="sm" variant="outline" onClick={() => setShowAnimation(true)} className="rounded-lg h-7 text-xs gap-1.5">
                      <Play className="h-3 w-3" /> Animate
                    </Button>
                  )}
                  {!d.active && (
                    <Button size="sm" variant="outline" onClick={() => setActiveMutation.mutate(d.id)} className="rounded-lg h-7 text-xs">
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}