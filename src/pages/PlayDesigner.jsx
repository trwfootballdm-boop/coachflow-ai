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
import CollapsibleInspector  from '@/components/play-designer/CollapsibleInspector';
import BottomControlBar      from '@/components/play-designer/BottomControlBar';
import DesignerStatusBar     from '@/components/play-designer/DesignerStatusBar';
import { validateOffensivePlay } from '@/lib/football-engine/validation';
import { analyzeConcepts } from '@/lib/football-engine/concepts';
import { analyzeDefensiveReaction } from '@/lib/football-engine/reactions';
import { analyzeTiming } from '@/lib/football-engine/timing';
import { analyzeAdjustments } from '@/lib/football-engine/adjustments';
import { buildInstallReport } from '@/lib/football-engine/install';

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
// Two-tier state: `current` is the live (possibly mid-drag) diagram. `push` snapshots
// it onto an undo stack; `replace` updates the live state WITHOUT a history entry
// (used during drags so undo doesn't see 100 intermediate positions).
function useHistory(initial) {
  const [stack, setStack]   = useState([initial]);
  const [cursor, setCursor] = useState(0);
  const [live, setLive]     = useState(initial);

  // Whenever the cursor moves (undo/redo) or the stack is replaced, sync live state.
  useEffect(() => {
    setLive(stack[cursor]);
  }, [cursor, stack]);

  const push = useCallback((next) => {
    setLive(next);
    setStack(prev => {
      const trimmed = prev.slice(0, cursor + 1);
      const appended = [...trimmed, next];
      // Cap at 50 entries; if trimmed, also pull cursor down so it stays valid.
      if (appended.length > 50) {
        return appended.slice(-50);
      }
      return appended;
    });
    setCursor(prev => Math.min(prev + 1, 49));
  }, [cursor]);

  // Update live state without committing a history entry. Used for continuous gestures.
  const replace = useCallback((next) => {
    setLive(next);
  }, []);

  // Commit the current live state to the history stack (call on gesture end).
  const commit = useCallback(() => {
    setLive(currentLive => {
      setStack(prev => {
        if (prev[cursor] === currentLive) return prev;
        const trimmed = prev.slice(0, cursor + 1);
        const appended = [...trimmed, currentLive];
        return appended.length > 50 ? appended.slice(-50) : appended;
      });
      setCursor(c => Math.min(c + 1, 49));
      return currentLive;
    });
  }, [cursor]);

  const undo = useCallback(() => {
    setCursor(c => Math.max(0, c - 1));
  }, []);

  const redo = useCallback(() => {
    setCursor(c => Math.min(stack.length - 1, c + 1));
  }, [stack.length]);

  // Hard reset: replace the entire history with a single entry (used on load).
  const reset = useCallback((next) => {
    setStack([next]);
    setCursor(0);
    setLive(next);
  }, []);

  return {
    current: live,
    push,
    replace,
    commit,
    undo,
    redo,
    reset,
    canUndo: cursor > 0,
    canRedo: cursor < stack.length - 1,
  };
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

  // ── Animation state ──
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // ── Editor state ──
  const [activeTool,       setActiveTool]       = useState('select');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPathId,   setSelectedPathId]   = useState(null);
  const [drawingPts,       setDrawingPts]       = useState(0);

  // Track the diagram snapshot at the time of last save so we can detect diagram edits.
  const [savedDiagramJSON, setSavedDiagramJSON] = useState(null);
  const currentDiagramJSON = useMemo(
    () => JSON.stringify({ players: diagram.current.players, paths: diagram.current.paths, annotations: diagram.current.annotations }),
    [diagram.current]
  );
  const playMetaDirty = savedPlay ? JSON.stringify(play) !== JSON.stringify(savedPlay) : isNew;
  const diagramDirty = savedDiagramJSON !== null && savedDiagramJSON !== currentDiagramJSON;
  const isDirty = isNew ? true : (playMetaDirty || diagramDirty);

  // ── Load existing play ──
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    base44.entities.Play.filter({ id: editId }).then(plays => {
      if (plays[0]) {
        setPlay(plays[0]);
        setSaved(plays[0]);
        if (plays[0].diagram_data) {
          const { players, paths, annotations } = plays[0].diagram_data;
          const loaded = {
            players: players || DEFAULT_PLAYERS,
            paths:   paths   || [],
            annotations: annotations || [],
          };
          // Reset history so the loaded diagram is the *only* entry — undoing
          // after load should not revert to the default formation.
          diagram.reset(loaded);
          // Establish a baseline so subsequent diagram edits flip isDirty.
          setSavedDiagramJSON(JSON.stringify(loaded));
        } else {
          // No diagram saved yet on this play — treat the default formation
          // as the baseline.
          setSavedDiagramJSON(JSON.stringify({
            players: DEFAULT_PLAYERS, paths: [], annotations: [],
          }));
        }
      }
      setLoading(false);
    });
  // diagram.reset is stable (no deps) so excluding it is safe and matches the
  // original intent of running this effect only when editId changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (e.key === 'Escape') { 
        e.preventDefault();
        if (drawingPts > 0) {
          setDrawingPts(0);
        } else {
          setActiveTool('select'); 
          setSelectedPlayerId(null); 
          setSelectedPathId(null); 
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.isContentEditable) {
        if (selectedPlayerId) removePlayer(selectedPlayerId);
        if (selectedPathId) removePath(selectedPathId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [diagram, selectedPlayerId, selectedPathId, drawingPts]);

  // ── Diagram mutations ──
  const { current: diag } = diagram;

  const updateDiagram = useCallback((patch) => {
    diagram.push({ ...diag, ...patch });
  }, [diag, diagram]);

  // Continuous drag: update live state without spamming the history stack.
  // DesignerCanvas calls this on every pointermove during a drag, then calls
  // onCommitMove on pointerup so we get ONE undo entry per drag.
  const movePlayer = useCallback((id, x, y) => {
    const updated = diag.players.map(p =>
      p.token_id === id ? { ...p, x, y } : p
    );
    diagram.replace({ ...diag, players: updated });
  }, [diag, diagram]);

  const commitMove = useCallback(() => {
    diagram.commit();
  }, [diagram]);

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
    if (!newPath || !newPath.points || newPath.points.length < 2) {
      toast.error('Path needs at least 2 points');
      return;
    }
    // Auto-attach the path to the currently selected player so the animation
    // engine can run the route. If nothing is selected, attach it to the
    // nearest player to the path's first point (within 60 SVG units).
    let tokenId = newPath.token_id || selectedPlayerId || null;
    if (!tokenId && newPath.points.length > 0) {
      const start = newPath.points[0];
      let best = null;
      let bestDist = Infinity;
      for (const p of diag.players) {
        const d = Math.hypot(p.x - start.x, p.y - start.y);
        if (d < bestDist) { bestDist = d; best = p; }
      }
      if (best && bestDist <= 60) tokenId = best.token_id;
    }
    const finalPath = { ...newPath, token_id: tokenId };
    updateDiagram({ paths: [...diag.paths, finalPath] });
    toast.success(tokenId ? 'Route added' : 'Route added (unassigned — select a player first to attach it)');
  }, [diag, updateDiagram, selectedPlayerId]);

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
      // Snapshot diagram at save time so isDirty resets correctly.
      setSavedDiagramJSON(currentDiagramJSON);
      toast.success(editId ? 'Play saved' : 'Play created');
      if (isNew && saved?.id) navigate(`/play-designer?id=${saved.id}`, { replace: true });
    },
  });

  const handleSave = () => {
    const name = play.name || play.play_name;
    if (!name?.trim()) { toast.error('Play name is required — add it in the Play panel →'); return; }
    
    if (play.side === 'offense' && validation) {
      const errors = validation.messages.filter(m => m.severity === 'error');
      if (errors.length > 0) {
        toast.error('Cannot save: ' + errors[0].message);
        return;
      }
      
      const warnings = validation.messages.filter(m => m.severity === 'warning');
      if (warnings.length > 0) {
        const confirmed = window.confirm(
          `This play has ${warnings.length} warning(s):\n\n${warnings.map(w => '• ' + w.message).join('\n')}\n\nSave anyway?`
        );
        if (!confirmed) return;
      }
    }
    
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

  // ── Analysis Pipeline ──
  const validation = useMemo(() => {
    if (play.side !== 'offense') return null;
    return validateOffensivePlay(diag);
  }, [diag, play.side]);

  const concepts = useMemo(() => {
    if (play.side !== 'offense') return null;
    return analyzeConcepts(diag);
  }, [diag, play.side]);

  const reaction = useMemo(() => {
    if (!concepts) return null;
    return analyzeDefensiveReaction(diag, concepts, {
      coverageShell: 'cover_3',
      frontFamily: 'even',
      pressure: '4man',
      middleField: 'closed',
    });
  }, [diag, concepts]);

  const timing = useMemo(() => {
    if (!concepts) return null;
    return analyzeTiming(diag, concepts, {
      coverageShell: 'cover_3',
      frontFamily: 'even',
      pressure: '5man',
      middleField: 'closed',
    });
  }, [diag, concepts]);

  const adjustments = useMemo(() => {
    if (!concepts || !timing) return null;
    return analyzeAdjustments(diag, concepts, timing, {
      coverageShell: 'cover_3',
      frontFamily: 'even',
      pressure: '5man',
      middleField: 'closed',
    });
  }, [diag, concepts, timing]);

  const install = useMemo(() => {
    if (!concepts || !timing || !adjustments) return null;
    return buildInstallReport({
      diagram: diag,
      play,
      concepts,
      timing,
      adjustments,
      scenario: {
        coverageShell: 'cover_3',
        frontFamily: 'even',
        pressure: '5man',
        middleField: 'closed',
      },
    });
  }, [diag, play, concepts, timing, adjustments]);

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

      {/* Main canvas area with left tool rail and right inspector */}
      <div className="relative flex-1 flex overflow-hidden">
        <ToolRail
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onUndo={diagram.undo}
          onRedo={diagram.redo}
        />

        {/* Canvas + bottom bar */}
        <div className="relative flex-1 flex flex-col overflow-hidden min-w-0">
          <CanvasWorkspace
            players={diag.players}
            paths={diag.paths}
            annotations={diag.annotations}
            selectedPlayerId={selectedPlayerId}
            selectedPathId={selectedPathId}
            activeTool={activeTool}
            isAnimating={isAnimating}
            animationSpeed={animationSpeed}
            onAnimationEnd={() => setIsAnimating(false)}
            onSelectPlayer={(id) => { setSelectedPlayerId(id); if (id) setSelectedPathId(null); }}
            onSelectPath={(id) => { setSelectedPathId(id); if (id) setSelectedPlayerId(null); }}
            onMovePlayer={movePlayer}
            onCommitMove={commitMove}
            onAddPlayer={addPlayer}
            onCommitPath={commitPath}
            onDrawingChange={setDrawingPts}
            diag={diag}
            diagram={diagram}
          />

          {/* Bottom control bar with animation and save */}
          <BottomControlBar
            paths={diag.paths}
            players={diag.players}
            isAnimating={isAnimating}
            onToggleAnimation={() => setIsAnimating(!isAnimating)}
            onReset={() => setIsAnimating(false)}
            speed={animationSpeed}
            onSpeedChange={setAnimationSpeed}
            onSave={handleSave}
            isDirty={isDirty}
            isSaving={saveMutation.isPending}
          />
        </div>

        {/* Collapsible right inspector */}
        <CollapsibleInspector
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

      {/* Status bar */}
      <DesignerStatusBar
        activeTool={activeTool}
        playerCount={diag.players.length}
        pathCount={diag.paths.length}
        selectedType={selectedType}
        zoom={1}
        drawingPointCount={drawingPts}
        validation={validation}
        concepts={concepts}
        reaction={reaction}
        timing={timing}
        adjustments={adjustments}
        install={install}
      />
    </div>
  );
}