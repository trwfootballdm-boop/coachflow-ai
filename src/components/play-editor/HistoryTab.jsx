import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, Copy } from "lucide-react";
import { format } from "date-fns";

export default function HistoryTab({ play, onDuplicate }) {
  const version = play.version || play.version_no || 1;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-display font-semibold">Version History</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Track play versions and manage edits over time.</p>
      </div>

      {/* Current version card */}
      <div className="border border-primary/20 bg-primary/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Version {version}</p>
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Current</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {play.updated_date ? `Last modified ${format(new Date(play.updated_date), 'MMMM d, yyyy')}` : 'Not yet saved'}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onDuplicate} className="gap-1.5 rounded-xl text-xs h-8">
            <Copy className="h-3.5 w-3.5" /> Duplicate as New
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Play Name</p>
            <p className="mt-0.5 truncate">{play.name || play.play_name || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Formation</p>
            <p className="mt-0.5 truncate">{play.formation || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Version Number</p>
            <p className="mt-0.5 font-mono">v{version}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Created</p>
            <p className="mt-0.5">
              {play.created_date ? format(new Date(play.created_date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow guide */}
      <div className="bg-secondary/40 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Version Workflow</h4>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { action: 'Save', description: 'Updates the current version in place. Use for small corrections and edits.' },
            { action: 'Save as New Version', description: 'Creates a new play record with version incremented. The old version is preserved.' },
            { action: 'Duplicate', description: 'Creates a full copy of this play. Use to create a variation or alternate version.' },
          ].map(item => (
            <div key={item.action} className="flex gap-3">
              <div className="shrink-0">
                <Badge variant="secondary" className="text-[10px] font-semibold">{item.action}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50">
        Full version history and change tracking coming in a future update.
      </p>
    </div>
  );
}