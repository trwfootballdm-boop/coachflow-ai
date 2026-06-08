import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Plus, CheckCircle, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FootballField from '@/components/play-designer/FootballField';

export default function DiagramTab({ playId, play, onChange }) {
  const queryClient = useQueryClient();
  const [editingDiagram, setEditingDiagram] = useState(false);
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

  const setActiveMutation = useMutation({
    mutationFn: async (diagramId) => {
      await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.update(diagramId, { active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams', playId] }),
  });

  const activeDiagram = diagrams.find(d => d.active);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Play Diagram</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {diagrams.length} diagram version{diagrams.length !== 1 ? 's' : ''} · {activeDiagram ? 'Active version set' : 'No active diagram'}
          </p>
        </div>
        <div className="flex gap-2">
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
          </div>
          <div className="p-4">
            <FootballField
              diagramData={activeDiagram.diagram_json}
              onChange={() => {}}
              side={play.side}
              readOnly
            />
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
                </div>
                {!d.active && (
                  <Button size="sm" variant="outline" onClick={() => setActiveMutation.mutate(d.id)} className="rounded-lg h-7 text-xs">
                    Set Active
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}