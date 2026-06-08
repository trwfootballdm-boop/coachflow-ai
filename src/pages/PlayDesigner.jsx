import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save, ArrowLeft, Loader2, Star, Copy, ClipboardList, FileText,
  Power, PowerOff, Trash2, ChevronDown, AlertCircle
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import OverviewTab from '@/components/play-editor/OverviewTab';
import AssignmentsTab from '@/components/play-editor/AssignmentsTab';
import TagsTab from '@/components/play-editor/TagsTab';
import DiagramTab from '@/components/play-editor/DiagramTab';
import NotesTab from '@/components/play-editor/NotesTab';
import HistoryTab from '@/components/play-editor/HistoryTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'tags', label: 'Tags' },
  { id: 'diagram', label: 'Diagram' },
  { id: 'notes', label: 'Notes & Teaching' },
  { id: 'history', label: 'History' },
];

const BLANK_PLAY = {
  name: '', short_name: '', side: 'offense', run_pass: '', play_type: '',
  play_family: '', formation: '', personnel: '', motion: '', strength: 'any',
  concept: '', direction: 'any', hash_tags: ['any'], down_distance_tags: [],
  field_zone_tags: ['any'], opponent_front_tags: [], coverage_tags: [],
  install_week: null, install_day: null, age_level_difficulty: '', risk_level: 'medium',
  coaching_points: '', player_friendly_text: '', notes: '', tags: [],
  is_favorite: false, is_active: true, version: 1, diagram_data: null,
};

const SIDE_BADGE = {
  offense: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  defense: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  special_teams: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

export default function PlayDesigner() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [play, setPlay] = useState({ ...BLANK_PLAY, team_id: activeTeamId });
  const [savedPlay, setSavedPlay] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(!!editId);

  const isDirty = savedPlay && JSON.stringify(play) !== JSON.stringify(savedPlay);

  // Load existing play
  useEffect(() => {
    if (editId) {
      setLoading(true);
      base44.entities.Play.filter({ id: editId }).then(plays => {
        if (plays.length > 0) {
          setPlay(plays[0]);
          setSavedPlay(plays[0]);
        }
        setLoading(false);
      });
    }
  }, [editId]);

  // Related data counts
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', editId],
    queryFn: () => base44.entities.PlayAssignment.filter({ play_id: editId }),
    enabled: !!editId,
  });

  const allTags = [
    ...(play.down_distance_tags || []),
    ...(play.field_zone_tags || []).filter(t => t !== 'any'),
    ...(play.opponent_front_tags || []),
    ...(play.coverage_tags || []),
    ...(play.tags || []),
  ].filter(Boolean);

  const hasDiagram = !!(play.diagram_data && Object.keys(play.diagram_data || {}).length > 0);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, team_id: activeTeamId };
      if (editId) return base44.entities.Play.update(editId, payload);
      return base44.entities.Play.create(payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      setSavedPlay(play);
      toast.success(editId ? 'Play updated' : 'Play saved');
      if (!editId && result?.id) {
        navigate(`/play-designer?id=${result.id}`, { replace: true });
      }
    },
  });

  const handleSaveAsVersion = useCallback(async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = play;
    const newVersion = (play.version || 1) + 1;
    const created = await base44.entities.Play.create({ ...data, team_id: activeTeamId, version: newVersion, name: `${data.name} (v${newVersion})` });
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success(`Saved as version ${newVersion}`);
    navigate(`/play-designer?id=${created.id}`);
  }, [play, activeTeamId, navigate, queryClient]);

  const handleDuplicate = useCallback(async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = play;
    const created = await base44.entities.Play.create({ ...data, team_id: activeTeamId, name: `${data.name} (Copy)`, version: 1 });
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success('Play duplicated');
    navigate(`/play-designer?id=${created.id}`);
  }, [play, activeTeamId, navigate, queryClient]);

  const handleToggleActive = () => {
    setPlay(prev => ({ ...prev, is_active: prev.is_active === false ? true : false }));
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!window.confirm(`Delete "${play.name}"? This cannot be undone.`)) return;
    await base44.entities.Play.delete(editId);
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success('Play deleted');
    navigate('/play-library');
  };

  const canSave = !!play.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Sticky header ── */}
      <header className="bg-card border-b border-border shrink-0 z-10">
        <div className="flex items-center gap-2 px-4 sm:px-6 h-14">
          {/* Back */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/play-library')} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Title area */}
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <h1 className="font-display font-bold text-base truncate">
              {play.name || (editId ? 'Edit Play' : 'New Play')}
            </h1>
            {play.side && (
              <Badge className={cn("text-[10px] capitalize shrink-0 hidden sm:flex", SIDE_BADGE[play.side])}>
                {play.side.replace(/_/g, ' ')}
              </Badge>
            )}
            {play.formation && (
              <span className="text-xs text-muted-foreground truncate hidden md:block">{play.formation}</span>
            )}
            {isDirty && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            )}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Favorite */}
            <button
              onClick={() => setPlay(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
              className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                play.is_favorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-400 hover:bg-secondary"
              )}
            >
              <Star className={cn("h-4 w-4", play.is_favorite && "fill-current")} />
            </button>

            {/* Mobile action overflow */}
            <div className="flex sm:hidden">
              <Button
                size="sm"
                onClick={() => saveMutation.mutate(play)}
                disabled={!canSave || saveMutation.isPending}
                className="gap-1.5 rounded-xl h-8"
              >
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-1.5">
              {editId && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-1.5 rounded-xl h-8 text-xs">
                    <Copy className="h-3.5 w-3.5" /> Dupe
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveAsVersion} className="gap-1.5 rounded-xl h-8 text-xs">
                    <Save className="h-3.5 w-3.5" /> + Version
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={handleToggleActive}
                    className={cn("gap-1.5 rounded-xl h-8 text-xs", play.is_active === false && "text-muted-foreground")}
                  >
                    {play.is_active !== false
                      ? <><PowerOff className="h-3.5 w-3.5" /> Deactivate</>
                      : <><Power className="h-3.5 w-3.5 text-emerald-500" /> Activate</>
                    }
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={() => saveMutation.mutate(play)}
                disabled={!canSave || saveMutation.isPending}
                className="gap-1.5 rounded-xl h-8"
              >
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Play
              </Button>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex overflow-x-auto border-t border-border scrollbar-hide">
          {TABS.map(tab => {
            const count = tab.id === 'assignments' ? assignments.length
              : tab.id === 'tags' ? allTags.length
              : null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
                {count !== null && count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Tab content ── */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            play={play}
            onChange={setPlay}
            assignmentCount={assignments.length}
            tagCount={allTags.length}
            hasDiagram={hasDiagram}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsTab playId={editId} />
        )}
        {activeTab === 'tags' && (
          <TagsTab play={play} onChange={setPlay} />
        )}
        {activeTab === 'diagram' && (
          <DiagramTab play={play} onChange={setPlay} />
        )}
        {activeTab === 'notes' && (
          <NotesTab play={play} onChange={setPlay} />
        )}
        {activeTab === 'history' && (
          <HistoryTab play={play} onSaveAsNewVersion={handleSaveAsVersion} onDuplicate={handleDuplicate} />
        )}

        {/* Delete zone at bottom of any tab for existing plays */}
        {editId && activeTab === 'history' && (
          <div className="mt-8 pt-6 border-t border-border max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-3">Danger Zone</p>
            <Button variant="outline" size="sm" onClick={handleDelete}
              className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 h-8 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Delete This Play
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}