import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PenTool, Plus, CheckCircle, Clock, Layers, Save, X,
  Copy, FlipHorizontal, Eye, EyeOff, ChevronDown, ChevronRight,
  Sparkles, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FootballField from '@/components/play-designer/FootballField';

export default function DiagramTab({ playId, play, onChange }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [localDiagram, setLocalDiagram] = useState(play.diagram_data || null);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams', playId],
    queryFn: () => base44.entities.PlayDiagram.filter({ play_id: playId }, '-created_date'),
    enabled: !!playId,
  });

  const saveMutation = useMutation({
    mutationFn: async (diagramJson) => {
      const label = newVersionLabel.trim() || `v${diagrams.length + 1}`;
      const existing = diagrams.find(d => d.active);
      if (existing && !newVersionLabel.trim()) {
        // Update in-place
        return base44.entities.PlayDiagram.update(existing.id, { diagram_json: diagramJson });
      }
      // Mark all inactive
      if (diagrams.length > 0) {
        await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      }
      return base44.entities.PlayDiagram.create({
        play_id: playId, diagram_json: diagramJson, version_label: label, active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      onChange({ ...play, diagram_data: localDiagram });
      setEditing(false);
      setNewVersionLabel('');
      toast.success('Diagram saved');
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (src) => {
      await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.create({
        play_id: playId,
        diagram_json: src.diagram_json,
        version_label: `${src.version_label} (copy)`,
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      toast.success('Version cloned');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (diagramId) => {
      await Promise.all(diagrams.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.update(diagramId, { active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams', playId] }),
  });

  const deleteDiagramMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayDiagram.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams', playId] }),
  });

  const activeDiagram = diagrams.find(d => d.active);

  const startEdit = (src = null) => {
    setLocalDiagram(src?.diagram_json || activeDiagram?.diagram_json || play.diagram_data || null);
    setEditing(true);
  };

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <PenTool className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold">Save play first</p>
        <p className="text-sm text-muted-foreground mt-1">Save the play overview to enable the diagram editor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold">Play Diagram</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {diagrams.length} version{diagrams.length !== 1 ? 's' : ''}
            {activeDiagram ? ` · Active: ${activeDiagram.version_label}` : ' · No diagram yet'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => startEdit()} className="gap-1.5 rounded-xl text-xs h-8">
                <PenTool className="h-3.5 w-3.5" />
                {activeDiagram ? 'Edit' : 'Create Diagram'}
              </Button>
              {activeDiagram && (
                <Button variant="outline" size="sm" onClick={() => cloneMutation.mutate(activeDiagram)} className="gap-1.5 rounded-xl text-xs h-8">
                  <Copy className="h-3.5 w-3.5" /> Clone
                </Button>
              )}
            </>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setNewVersionLabel(''); }} className="rounded-xl text-xs h-8">
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate(localDiagram)}
                disabled={saveMutation.isPending} className="gap-1.5 rounded-xl text-xs h-8">
                {saveMutation.isPending ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Diagram
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      {editing ? (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Editing</span>
            <div className="flex-1" />
            <Input
              value={newVersionLabel}
              onChange={e => setNewVersionLabel(e.target.value)}
              placeholder="Version label (optional)"
              className="h-7 text-xs w-44 bg-secondary border-0"
            />
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
          <div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Diagram · {activeDiagram.version_label}
            </span>
            <Badge className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 ml-1">Live</Badge>
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
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/20">
          <div className="h-14 w-14 rounded-2xl bg-emerald-900/20 flex items-center justify-center mb-4 border border-emerald-900/10">
            <PenTool className="h-7 w-7 text-emerald-700/40" />
          </div>
          <p className="font-semibold">No diagram yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Draw routes, blocking assignments, motion, and more on the interactive field.
          </p>
          <Button size="sm" onClick={() => startEdit()} className="mt-4 gap-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Create Diagram
          </Button>
        </div>
      )}

      {/* ── Version list ── */}
      {diagrams.length > 0 && (
        <div>
          <button
            onClick={() => setShowVersions(v => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {showVersions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Layers className="h-3.5 w-3.5" />
            <span className="font-bold uppercase tracking-widest">{diagrams.length} Version{diagrams.length !== 1 ? 's' : ''}</span>
          </button>

          {showVersions && (
            <div className="space-y-2">
              {diagrams.map(d => (
                <div key={d.id} className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all",
                  d.active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-secondary/20"
                )}>
                  <div className="flex items-center gap-2">
                    {d.active
                      ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-sm font-medium">{d.version_label || 'Untitled'}</span>
                    {d.active && (
                      <Badge className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">Active</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => startEdit(d)}
                      className="h-7 px-2 text-xs rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      Edit
                    </button>
                    <button onClick={() => cloneMutation.mutate(d)}
                      className="h-7 px-2 text-xs rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      Clone
                    </button>
                    {!d.active && (
                      <button onClick={() => setActiveMutation.mutate(d.id)}
                        className="h-7 px-2 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors font-medium">
                        Set Active
                      </button>
                    )}
                    {!d.active && (
                      <button onClick={() => { if (confirm('Delete this version?')) deleteDiagramMutation.mutate(d.id); }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}