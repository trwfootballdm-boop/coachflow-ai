import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import DesignerCommandBar    from '@/components/play-designer/DesignerCommandBar';
import AIPlayCreatorPanel    from '@/components/ai-play/AIPlayCreatorPanel';
import ToolRail              from '@/components/play-designer/ToolRail';
import CanvasWorkspace       from '@/components/play-designer/CanvasWorkspace';
import InspectorPanel        from '@/components/play-designer/InspectorPanel';
import DesignerStatusBar     from '@/components/play-designer/DesignerStatusBar';
import { validateOffensivePlay } from '@/lib/football-engine/validation';

// ─── Default play skeleton ─────────────────────────────────────────────────────
const EMPTY_PLAY = {
  name: '', play_name: '', short_name: '',
  side: 'offense', run_pass: '', play_type: '', play_family: '',
  formation: '', personnel: '', motion: '', strength: 'any',
  concept: '', direction: 'any',
  hash_tags: [], down_distance_tags: [], field_zone_tags: [],
  opponent_front_tags: [], coverage_tags: [], tags: [],
  install_week: null, install_day: null,
  age_level_difficulty: '', risk_level: 'medium',
  coaching_points: '', notes: '',
  is_favorite: false, is_active: true, version: 1,
};

// ─── Default offense formation (half-field view) ───────────────────────────────
const DEFAULT_PLAYERS = [
  { token_id: 'C',   position_code: 'C',   display_label: 'C',   x: 450, y: 290, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'LG',  position_code: 'LG',  display_label: 'LG',  x: 410, y: 290, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RG',  position_code: 'RG',  display_label: 'RG',  x: 490, y: 290, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'LT',  position_code: 'LT',  display_label: 'LT',  x: 370, y: 290, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RT',  position_code: 'RT',  display_label: 'RT',  x: 530, y: 290, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'QB',  position_code: 'QB',  display_label: 'QB',  x: 450, y: 330, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: 'RB',  position_code: 'RB',  display_label: 'RB',  x: 450, y: 375, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: 'X',   position_code: 'WR',  display_label: 'X',   x: 140, y: 290, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Z',   position_code: 'WR',  display_label: 'Z',   x: 760, y: 290, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'H',   position_code: 'WR',  display_label: 'H',   x: 640, y: 290, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Y',   position_code: 'TE',  display_label: 'Y',   x: 570, y: 290, team_side: 'offense', role_type: 'receiver' },
];

// ─── History helpers ───────────────────────────────────────────────────────────
function useHistory(initial) {
  const [stack, setStack]   = useState([initial]);
  const [cursor, setCursor] = useState(0);

  const current = stack[cursor];

  const push = useCallback((next) => {
    setStack(prev => {
      const trimmed = prev.slice(0, cursor + 1);
      return [...trimmed, next].slice(-40); // keep 40 states
    });
    setCursor(prev => Math.min(prev + 1, 39));
  }, [cursor]);

  const undo = useCallback(() => setCursor(c => Math.max(0, c - 1)), []);
  const redo = useCallback(() => setStack(s => { setCursor(c => Math.min(s.length - 1, c + 1)); return s; }), []);

  return { current, push, undo, redo, canUndo: cursor > 0, canRedo: cursor < stack.length - 1 };
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PlayDesigner() {
  const { activeTeamId } = useTeam();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const urlParams        = new URLSearchParams(window.location.search);
  const editId           = urlParams.get('id');
  const isNew            = !editId;

  // ── Play metadata ──
  const [play, setPlay]       = useState({ ...EMPTY_PLAY, team_id: activeTeamId });
  const [savedPlay, setSaved] = useState(null);
  const [loading, setLoading] = useState(!!editId);

  // ── Diagram state (history-tracked) ──
  const diagram = useHistory({ players: DEFAULT_PLAYERS, paths: [], annotations: [] });

  // ── AI panel state ──
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // ── Editor state ──
  const [activeTool,       setActiveTool]       = useState('select');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPathId,   setSelectedPathId]   = useState(null);
  const [drawingPts,       setDrawingPts]       = useState(0);

  const isDirty = savedPlay ? JSON.stringify(play) !== JSON.stringify(savedPlay) : !isNew;

  // ── Load existing play ──
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    base44.entities.Play.filter({ id: editId }).then(plays => {
      if (plays[0]) {
        setPlay(plays[0]);
        setSaved(plays[0]);
        // Load diagram data if stored on play
        if (plays[0].diagram_data) {
          const { players, paths, annotations } = plays[0].diagram_data;
          diagram.push({
            players: players || DEFAULT_PLAYERS,
            paths:   paths   || [],
            annotations: annotations || [],
          });
        }
      }
      setLoading(false);
    });
  }, [editId]);

  useEffect(() => {
    if (activeTeamId && isNew) setPlay(p => ({ ...p, team_id: activeTeamId }));
  }, [activeTeamId, isNew]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); diagram.undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); diagram.redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      if (e.key === 'p' || e.key === 'P') setActiveTool('add_player');
      if (e.key === 'Escape') { setActiveTool('select'); setSelectedPlayerId(null); setSelectedPathId(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.isContentEditable) {
        if (selectedPlayerId) removePlayer(selectedPlayerId);
        if (selectedPathId) removePath(selectedPathId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [diagram, selectedPlayerId, selectedPathId]);

  // ── Diagram mutations ──
  const { current: diag } = diagram;

  const updateDiagram = useCallback((patch) => {
    diagram.push({ ...diag, ...patch });
  }, [diag, diagram]);

  const movePlayer = useCallback((id, x, y) => {
    const updated = diag.players.map(p => p.token_id === id ? { ...p, x, y } : p);
    // live move without history push (push on mouse-up via onSelectPlayer settle)
    diagram.push({ ...diag, players: updated });
  }, [diag, diagram]);

  const addPlayer = useCallback((coords) => {
    const newId = `player_${Date.now()}`;
    const newPlayer = {
      token_id: newId,
      position_code: 'WR', display_label: 'WR',
      x: coords.x, y: coords.y,
      team_side: play.side === 'defense' ? 'defense' : 'offense',
      role_type: 'other',
    };
    updateDiagram({ players: [...diag.players, newPlayer] });
    setSelectedPlayerId(newId);
    setActiveTool('select');
  }, [diag, updateDiagram, play.side]);

  const removePlayer = useCallback((id) => {
    updateDiagram({ players: diag.players.filter(p => p.token_id !== id) });
    setSelectedPlayerId(null);
  }, [diag, updateDiagram]);

  const updatePlayer = useCallback((updated) => {
    updateDiagram({ players: diag.players.map(p => p.token_id === updated.token_id ? updated : p) });
  }, [diag, updateDiagram]);

  const duplicatePlayer = useCallback(() => {
    const src = diag.players.find(p => p.token_id === selectedPlayerId);
    if (!src) return;
    const newId = `player_${Date.now()}`;
    const copy = { ...src, token_id: newId, x: src.x + 20, y: src.y + 20 };
    updateDiagram({ players: [...diag.players, copy] });
    setSelectedPlayerId(newId);
  }, [diag, selectedPlayerId, updateDiagram]);

  const commitPath = useCallback((newPath) => {
    updateDiagram({ paths: [...diag.paths, newPath] });
  }, [diag, updateDiagram]);

  const removePath = useCallback((id) => {
    updateDiagram({ paths: diag.paths.filter(p => p.path_id !== id) });
    setSelectedPathId(null);
  }, [diag, updateDiagram]);

  const updatePath = useCallback((updated) => {
    updateDiagram({ paths: diag.paths.map(p => p.path_id === updated.path_id ? updated : p) });
  }, [diag, updateDiagram]);

  const flipHorizontal = useCallback(() => {
    const midX = 450;
    const flippedPlayers = diag.players.map(p => ({ ...p, x: midX + (midX - p.x) }));
    const flippedPaths = diag.paths.map(path => ({
      ...path,
      points: path.points.map(pt => ({ ...pt, x: midX + (midX - pt.x) })),
    }));
    updateDiagram({ players: flippedPlayers, paths: flippedPaths });
    toast.success('Play flipped horizontally');
  }, [diag, updateDiagram]);

  // ── Save ──
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data, team_id: activeTeamId,
        diagram_data: { players: diag.players, paths: diag.paths, annotations: diag.annotations },
      };
      if (payload.name) payload.play_name = payload.name;
      if (payload.play_name && !payload.name) payload.name = payload.play_name;
      if (editId) return base44.entities.Play.update(editId, payload);
      return base44.entities.Play.create(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      setSaved({ ...play });
      toast.success(editId ? 'Play saved' : 'Play created');
      if (isNew && saved?.id) navigate(`/play-designer?id=${saved.id}`, { replace: true });
    },
  });

  const handleSave = () => {
    const name = play.name || play.play_name;
    if (!name?.trim()) { toast.error('Play name is required — add it in the Play panel →'); return; }
    saveMutation.mutate(play);
  };

  const handleSaveNewVersion = async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = play;
    const v = (play.version || 1) + 1;
    const created = await base44.entities.Play.create({
      ...data, team_id: activeTeamId, version: v,
      name: play.name || play.play_name, play_name: play.name || play.play_name,
      diagram_data: { players: diag.players, paths: diag.paths, annotations: diag.annotations },
    });
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success(`Saved as v${v}`);
    navigate(`/play-designer?id=${created.id}`);
  };

  const handleDuplicate = async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = play;
    const newPlay = await base44.entities.Play.create({
      ...data, team_id: activeTeamId,
      name: `${play.name || play.play_name} (Copy)`,
      play_name: `${play.name || play.play_name} (Copy)`,
      diagram_data: { players: diag.players, paths: diag.paths, annotations: diag.annotations },
    });
    queryClient.invalidateQueries({ queryKey: ['plays'] });
    toast.success('Play duplicated');
    navigate(`/play-designer?id=${newPlay.id}`);
  };

  const handleDelete = () => {
    if (!editId) return;
    if (window.confirm('Delete this play? This cannot be undone.')) {
      base44.entities.Play.delete(editId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['plays'] });
        toast.success('Play deleted');
        navigate('/play-library');
      });
    }
  };

  // ── Derived selection objects ──
  const selectedPlayer = diag.players.find(p => p.token_id === selectedPlayerId) || null;
  const selectedPath   = diag.paths.find(p => p.path_id === selectedPathId)     || null;
  const selectedType   = selectedPlayer ? 'player' : selectedPath ? 'path' : null;

  // ── Validation ──
  const validation = useMemo(() => {
    if (play.side !== 'offense') return null;
    return validateOffensivePlay(diag);
  }, [diag, play.side]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="designer-shell">
      <DesignerCommandBar
        play={play}
        isDirty={isDirty}
        isSaving={saveMutation.isPending}
        isNew={isNew}
        onBack={() => navigate('/play-library')}
        onSave={handleSave}
        onSaveNewVersion={handleSaveNewVersion}
        onDuplicate={handleDuplicate}
        onFlip={flipHorizontal}
        onToggleFav={() => setPlay(p => ({ ...p, is_favorite: !p.is_favorite }))}
        onDelete={handleDelete}
        onAICreate={() => setAiPanelOpen(true)}
      />

      <div className="designer-body">
        <ToolRail
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onUndo={diagram.undo}
          onRedo={diagram.redo}
        />

        <CanvasWorkspace
          players={diag.players}
          paths={diag.paths}
          annotations={diag.annotations}
          selectedPlayerId={selectedPlayerId}
          selectedPathId={selectedPathId}
          activeTool={activeTool}
          onSelectPlayer={(id) => { setSelectedPlayerId(id); setSelectedPathId(null); }}
          onSelectPath={(id) => { setSelectedPathId(id); setSelectedPlayerId(null); }}
          onMovePlayer={movePlayer}
          onAddPlayer={addPlayer}
          onCommitPath={commitPath}
          onDrawingChange={setDrawingPts}
          diag={diag}
          diagram={diagram}
        />

        <InspectorPanel
          play={play}
          onPlayChange={setPlay}
          selectedPlayer={selectedPlayer}
          onPlayerChange={updatePlayer}
          onDuplicatePlayer={duplicatePlayer}
          onRemovePlayer={() => removePlayer(selectedPlayerId)}
          selectedPath={selectedPath}
          onPathChange={updatePath}
          onRemovePath={() => removePath(selectedPathId)}
        />
      </div>

      <DesignerStatusBar
        activeTool={activeTool}
        playerCount={diag.players.length}
        pathCount={diag.paths.length}
        selectedType={selectedType}
        zoom={1}
        drawingPointCount={drawingPts}
      />
    </div>
  );
}