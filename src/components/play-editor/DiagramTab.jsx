import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Plus, CheckCircle, Clock, Layers, Play, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DiagramEditor from '@/components/play-designer/DiagramEditor';
import DiagramPreview from '@/components/play-designer/DiagramPreview';

export default function DiagramTab({ playId, play, onChange }) {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDiagramId, setEditingDiagramId] = useState(null);

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams', playId],
    queryFn: () => base44.entities.PlayDiagram.filter({ play_id: playId }, '-created_date'),
    enabled: !!playId,
  });

  const setActiveMutation = useMutation({
    mutationFn: async (diagramId) => {
      await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.update(diagramId, { active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams', playId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayDiagram.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      toast.success('Diagram version deleted');
    },
  });

  const activeDiagram = diagrams.find(d => d.active) || diagrams[0];

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <PenTool className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold">Save play first</p>
        <p className="text-sm text-muted-foreground mt-1">Save the play overview before drawing the diagram.</p>
      </div>
    );
  }

  // ── Full-screen editor overlay ─────────────────────────────────────────────
  if (editorOpen) {
    const targetDiagram = editingDiagramId
      ? diagrams.find(d => d.id === editingDiagramId)
      : activeDiagram;

    return (
      <div className="fixed inset-0 z-[100] bg-gray-950">
        <DiagramEditor
          playId={playId}
          play={play}
          existingDiagram={targetDiagram}
          onSaved={(saved) => {
            queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
            onChange({ ...play, diagram_data: saved.diagram_json });
          }}
          onClose={() => { setEditorOpen(false); setEditingDiagramId(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-semibold">Play Diagram</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {diagrams.length} version{diagrams.length !== 1 ? 's' : ''} ·{' '}
            {activeDiagram
              ? `Active: ${activeDiagram.version_label || 'v1'}`
              : 'No diagram yet'}
            {activeDiagram?.animation_json && ' · Animation saved'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingDiagramId(null); setEditorOpen(true); }}
          className="gap-1.5 rounded-xl text-xs h-8"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          {activeDiagram ? 'Open Diagram Editor' : 'Create Diagram'}
        </Button>
      </div>

      {/* Active diagram preview */}
      {activeDiagram ? (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {activeDiagram.version_label || 'Active'} · {activeDiagram.diagram_json?.players?.length || 0} players · {activeDiagram.diagram_json?.paths?.length || 0} paths
            </span>
            {activeDiagram.animation_json && (
              <Badge className="ml-auto text-[9px] bg-primary/10 text-primary border-primary/20">
                <Play className="h-2.5 w-2.5 mr-1" />
                Animated
              </Badge>
            )}
            <Button
              variant="ghost" size="sm"
              className="ml-auto h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => { setEditingDiagramId(activeDiagram.id); setEditorOpen(true); }}
            >
              <PenTool className="h-3 w-3" /> Edit
            </Button>
          </div>
          <div className="aspect-[16/9] relative">
            <DiagramPreview
              diagramJson={activeDiagram.diagram_json}
              animationJson={activeDiagram.animation_json}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
          <div className="h-14 w-14 rounded-2xl bg-emerald-900/20 flex items-center justify-center mb-4 border border-emerald-900/10">
            <PenTool className="h-7 w-7 text-emerald-700/40" />
          </div>
          <p className="font-semibold">No diagram yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Open the diagram editor to place players, draw routes, blocks, and add animation timing.
          </p>
          <Button
            size="sm"
            onClick={() => setEditorOpen(true)}
            className="mt-4 gap-1.5 rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" /> Create Diagram
          </Button>
        </div>
      )}

      {/* All versions */}
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {d.active
                    ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{d.version_label || 'Unnamed'}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {d.diagram_json?.players?.length || 0}p · {d.diagram_json?.paths?.length || 0} paths
                      {d.animation_json ? ' · animated' : ''}
                    </span>
                  </div>
                  {d.active && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 ml-auto mr-2">Active</Badge>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => { setEditingDiagramId(d.id); setEditorOpen(true); }}>
                    <PenTool className="h-3 w-3" /> Edit
                  </Button>
                  {!d.active && (
                    <Button size="sm" variant="outline"
                      onClick={() => setActiveMutation.mutate(d.id)}
                      className="rounded-lg h-7 text-xs">
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