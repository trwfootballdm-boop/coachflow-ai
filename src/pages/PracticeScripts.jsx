import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Calendar, Trash2, Clock, ChevronRight, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ScriptBuilder from '@/components/practice-scripts/ScriptBuilder';
import NewScriptDialog from '@/components/practice-scripts/NewScriptDialog';

export default function PracticeScripts() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [openScriptId, setOpenScriptId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['practiceScripts', activeTeamId],
    queryFn: () => base44.entities.PracticeScript.filter({ team_id: activeTeamId }, '-updated_date'),
    enabled: !!activeTeamId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PracticeScript.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceScripts'] });
      toast.success('Script deleted');
    },
  });

  const openScript = scripts.find(s => s.id === openScriptId);

  const filtered = scripts.filter(s =>
    !search || s.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (openScriptId && openScript) {
    return (
      <ScriptBuilder
        script={openScript}
        onBack={() => setOpenScriptId(null)}
        teamId={activeTeamId}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Practice Scripts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{scripts.length} script{scripts.length !== 1 ? 's' : ''} · Build structured practice plans from your playbook</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl shrink-0">
          <Plus className="h-4 w-4" /> New Script
        </Button>
      </div>

      {/* Search */}
      {scripts.length > 3 && (
        <div className="relative max-w-xs">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts..." className="pl-9 bg-secondary/50 border-0 h-9" />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold">
            {scripts.length === 0 ? 'No practice scripts yet' : 'No scripts match your search'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {scripts.length === 0
              ? 'Build structured practice plans by pulling plays from your library and organizing them into timed periods.'
              : 'Try a different search term.'}
          </p>
          {scripts.length === 0 && (
            <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Create First Script
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(script => (
            <ScriptCard
              key={script.id}
              script={script}
              onOpen={() => setOpenScriptId(script.id)}
              onDelete={() => deleteMutation.mutate(script.id)}
            />
          ))}
        </div>
      )}

      <NewScriptDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        teamId={activeTeamId}
        onCreated={(id) => { setShowCreate(false); setOpenScriptId(id); }}
      />
    </div>
  );
}

function ScriptCard({ script, onOpen, onDelete }) {
  const dayColors = {
    monday_install: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    tuesday_team: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    wednesday_polish: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    thursday_walkthrough: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  };

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display font-semibold text-sm leading-tight">{script.title}</h3>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {script.practice_day && (
          <Badge variant="secondary" className={cn("text-[10px] capitalize", dayColors[script.practice_day] || '')}>
            {script.practice_day.replace(/_/g, ' ')}
          </Badge>
        )}
        {script.focus_area && (
          <Badge variant="outline" className="text-[10px]">{script.focus_area}</Badge>
        )}
        {script.generated_by_ai && (
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">AI</Badge>
        )}
      </div>

      {script.script_date && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
          <Calendar className="h-3 w-3" />
          {format(new Date(script.script_date), 'EEE, MMM d, yyyy')}
        </p>
      )}

      {script.coaching_emphasis && (
        <p className="text-xs text-muted-foreground italic truncate">"{script.coaching_emphasis}"</p>
      )}

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {script.updated_date ? `Updated ${format(new Date(script.updated_date), 'MMM d')}` : 'Draft'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this script?')) onDelete(); }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </button>
  );
}