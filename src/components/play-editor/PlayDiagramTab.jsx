import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Plus, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function PlayDiagramTab({ playId, play }) {
  const [activeVersion, setActiveVersion] = useState(null);

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams', playId],
    queryFn: () => base44.entities.PlayDiagram.filter({ play_id: playId }),
    enabled: !!playId,
  });

  const activeDiagram = diagrams.find(d => d.active) || diagrams[0];
  const displayed = activeVersion ? diagrams.find(d => d.id === activeVersion) : activeDiagram;

  if (!playId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PenTool className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Save the play first to add a diagram.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-display font-bold">Play Diagram</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {diagrams.length === 0 ? 'No diagram yet' : `${diagrams.length} diagram version${diagrams.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {diagrams.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8">
              <Plus className="h-3.5 w-3.5" /> New Version
            </Button>
          )}
          <Button size="sm" className="gap-1.5 rounded-lg text-xs h-8"
            onClick={() => window.location.href = `/play-designer?id=${playId}&tab=draw`}>
            <PenTool className="h-3.5 w-3.5" /> Edit in Designer
          </Button>
        </div>
      </div>

      {/* Diagram preview */}
      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center aspect-[16/7] rounded-xl border-2 border-dashed border-border bg-secondary/20 text-center">
          <PenTool className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="font-display font-semibold text-base">No Diagram Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Use the Play Designer to draw player positions, routes, and blocking paths.
          </p>
          <Button className="mt-4 gap-2 rounded-xl"
            onClick={() => window.location.href = `/play-designer?id=${playId}&tab=draw`}>
            <PenTool className="h-4 w-4" /> Open Diagram Editor
          </Button>
        </div>
      ) : (
        <div className="aspect-[16/7] rounded-xl bg-emerald-900/10 dark:bg-emerald-950/30 border border-emerald-900/10 flex items-center justify-center relative overflow-hidden">
          {displayed?.thumbnail_url ? (
            <img src={displayed.thumbnail_url} alt="Play diagram" className="object-contain w-full h-full" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <PenTool className="h-10 w-10 text-emerald-700/30" />
              <p className="text-xs text-muted-foreground">Diagram data saved — open in designer to view</p>
            </div>
          )}
          {displayed?.version_label && (
            <Badge className="absolute top-3 left-3 text-[10px]">{displayed.version_label}</Badge>
          )}
          <Button size="sm" className="absolute top-3 right-3 gap-1.5 rounded-lg text-xs h-7"
            onClick={() => window.location.href = `/play-designer?id=${playId}&tab=draw`}>
            <ExternalLink className="h-3 w-3" /> Edit
          </Button>
        </div>
      )}

      {/* Version list */}
      {diagrams.length > 1 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">All Versions</p>
          <div className="space-y-2">
            {diagrams.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveVersion(activeVersion === d.id ? null : d.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                  activeVersion === d.id || (!activeVersion && d.id === activeDiagram?.id)
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/20 hover:bg-secondary/30"
                )}
              >
                <PenTool className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{d.version_label || 'Untitled Version'}</span>
                  {d.updated_date && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(d.updated_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {d.active && (
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" /> Active
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note about diagram editor */}
      <div className="bg-secondary/30 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Diagram Editor:</strong> The full visual diagram editor is built into the Play Designer page.
        Click "Edit in Designer" above to open the interactive field canvas where you can position players, draw routes, and add blocking paths.
        Diagram data is automatically linked to this play.
      </div>
    </div>
  );
}