import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import PlayEditorHeader from '@/components/play-editor/PlayEditorHeader';
import OverviewTab from '@/components/play-editor/OverviewTab';
import AssignmentsTab from '@/components/play-editor/AssignmentsTab';
import TagsTab from '@/components/play-editor/TagsTab';
import DiagramTab from '@/components/play-editor/DiagramTab';
import NotesTab from '@/components/play-editor/NotesTab';
import HistoryTab from '@/components/play-editor/HistoryTab';
import PlaySummaryPanel from '@/components/play-editor/PlaySummaryPanel';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'tags', label: 'Tags' },
  { id: 'diagram', label: 'Diagram' },
  { id: 'notes', label: 'Notes & Teaching' },
  { id: 'history', label: 'History' },
];

const EMPTY_PLAY = {
  name: '', play_name: '', short_name: '',
  side: 'offense', run_pass: '', play_type: '', play_family: '',
  formation: '', personnel: '', motion: '', strength: 'any',
  concept: '', direction: 'any',
  hash_tags: [], down_distance_tags: [], field_zone_tags: [],
  opponent_front_tags: [], coverage_tags: [], tags: [],
  install_week: null, install_day: null,
  age_level_difficulty: '', risk_level: 'medium',
  coaching_points: '', player_friendly_text: '', notes: '',
  is_favorite: false, is_active: true, version: 1, diagram_data: null,
};

export default function PlayDesigner() {
  const { activeTeamId } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  const isNew = !editId;

  const [play, setPlay] = useState({ ...EMPTY_PLAY, team_id: activeTeamId });
  const [savedPlay, setSavedPlay] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(!!editId);

  // Track unsaved changes
  const isDirty = savedPlay ? JSON.stringify(play) !== JSON.stringify(savedPlay) : !isNew;

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

  // Sync team_id when it changes
  useEffect(() => {
    if (activeTeamId && isNew) {
      setPlay(prev => ({ ...prev, team_id: activeTeamId }));
    }
  }, [activeTeamId, isNew]);

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', editId],
    queryFn: () => base44.entities.PlayAssignment.filter({ play_id: editId }),
    enabled: !!editId,
  });

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams', editId],
    queryFn: () => base44.entities.PlayDiagram.filter({ play_id: editId }),
    enabled: !!editId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, team_id: activeTeamId };
      // Sync name fields
      if (payload.name) payload.play_name = payload.name;
      if (payload.play_name && !payload.name) payload.name = payload.play_name;
      if (editId) return base44.entities.Play.update(editId, payload);
      return base44.entities.Play.create(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      setSavedPlay({ ...play });
      toast.success(editId ? 'Play updated' : 'Play created');
      if (isNew && saved?.id) {
        navigate(`/play-designer?id=${saved.id}`, { replace: true });
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const { id, created_date, updated_date, created_by_id, ...data } = play;
      return base44.entities.Play.create({
        ...data, team_id: activeTeamId,
        name: `${play.name || play.play_name} (Copy)`,
        play_name: `${play.name || play.play_name} (Copy)`,
      });
    },
    onSuccess: (newPlay) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Play duplicated');
      navigate(`/play-designer?id=${newPlay.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Play.delete(editId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success('Play deleted');
      navigate('/play-library');
    },
  });

  const handleSaveNewVersion = async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = play;
    const newVersion = (play.version || 1) + 1;
    const created = await base44.entities.Play.create({
      ...data, team_id: activeTeamId,
      version: newVersion,
      name: play.name || play.play_name,
      play_name: play.name || play.play_name,
    });
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success(`Saved as version ${newVersion}`);
    navigate(`/play-designer?id=${created.id}`);
  };

  const validate = () => {
    const name = play.name || play.play_name;
    if (!name?.trim()) { toast.error('Play name is required'); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate(play);
  };

  const allTagCount = [
    ...(play.down_distance_tags || []),
    ...(play.field_zone_tags || []),
    ...(play.hash_tags || []),
    ...(play.opponent_front_tags || []),
    ...(play.coverage_tags || []),
    ...(play.tags || []),
  ].filter(t => t && t !== 'any').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-0px)] overflow-hidden">
      {/* Sticky header */}
      <PlayEditorHeader
        play={play}
        isDirty={isDirty}
        isSaving={saveMutation.isPending}
        isNew={isNew}
        onBack={() => navigate('/play-library')}
        onSave={handleSave}
        onSaveNewVersion={handleSaveNewVersion}
        onDuplicate={() => duplicateMutation.mutate()}
        onToggleFav={() => setPlay(p => ({ ...p, is_favorite: !p.is_favorite }))}
        onToggleActive={() => setPlay(p => ({ ...p, is_active: p.is_active === false ? true : false }))}
        onDelete={() => {
          if (window.confirm('Delete this play? This cannot be undone.')) deleteMutation.mutate();
        }}
        onAddToScript={() => toast.info('Open Practice Scripts to add this play.')}
        onAddToGamePlan={() => toast.info('Open Game Planning to add this play.')}
      />

      {/* Tabs bar */}
      <div className="border-b border-border bg-background shrink-0 overflow-x-auto">
        <div className="flex px-6 gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
              {tab.id === 'assignments' && assignments.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5 font-bold">
                  {assignments.length}
                </span>
              )}
              {tab.id === 'tags' && allTagCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5 font-bold">
                  {allTagCount}
                </span>
              )}
              {tab.id === 'diagram' && diagrams.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-emerald-500/10 text-emerald-600 rounded-full px-1.5 py-0.5 font-bold">
                  {diagrams.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                play={play}
                onChange={setPlay}
                assignmentCount={assignments.length}
                tagCount={allTagCount}
                hasDiagram={diagrams.length > 0}
              />
            )}
            {activeTab === 'assignments' && (
              <AssignmentsTab playId={editId} />
            )}
            {activeTab === 'tags' && (
              <TagsTab play={play} onChange={setPlay} />
            )}
            {activeTab === 'diagram' && (
              <DiagramTab playId={editId} play={play} onChange={setPlay} />
            )}
            {activeTab === 'notes' && (
              <NotesTab play={play} onChange={setPlay} />
            )}
            {activeTab === 'history' && (
              <HistoryTab play={play} onDuplicate={() => duplicateMutation.mutate()} />
            )}
          </div>
        </div>

        {/* Right summary panel — desktop only */}
        <div className="hidden 2xl:block w-72 shrink-0 border-l border-border overflow-y-auto p-5">
          <PlaySummaryPanel
            play={play}
            isSaving={saveMutation.isPending}
            onSave={handleSave}
            onDuplicate={() => duplicateMutation.mutate()}
            onAddToScript={() => toast.info('Open Practice Scripts to add this play.')}
            onAddToGamePlan={() => toast.info('Open Game Planning to add this play.')}
          />
        </div>
      </div>
    </div>
  );
}