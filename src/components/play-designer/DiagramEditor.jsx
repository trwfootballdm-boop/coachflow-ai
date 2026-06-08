import React, { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Play, Pause, RotateCcw, Eye, EyeOff, Sparkles,
  Layers, ChevronRight, FlipHorizontal, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import FieldCanvas from './FieldCanvas';
import DesignerToolbar from './DesignerToolbar';
import PlayerInspector from './PlayerInspector';
import PathInspector from './PathInspector';
import AnimationTimeline from './AnimationTimeline';
import { useAnimationEngine, generateDefaultTiming } from './useAnimationEngine';

// ─── Default formation (offense) ─────────────────────────────────────────────
const DEFAULT_OFFENSE_PLAYERS = [
  { token_id: 'C',   x: 400, y: 290, display_label: 'C',  position_code: 'C',   team_side: 'offense', role_type: 'lineman' },
  { token_id: 'LG',  x: 365, y: 290, display_label: 'LG', position_code: 'LG',  team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RG',  x: 435, y: 290, display_label: 'RG', position_code: 'RG',  team_side: 'offense', role_type: 'lineman' },
  { token_id: 'LT',  x: 325, y: 290, display_label: 'LT', position_code: 'LT',  team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RT',  x: 475, y: 290, display_label: 'RT', position_code: 'RT',  team_side: 'offense', role_type: 'lineman' },
  { token_id: 'QB',  x: 400, y: 330, display_label: 'QB', position_code: 'QB',  team_side: 'offense', role_type: 'other' },
  { token_id: 'RB',  x: 400, y: 370, display_label: 'RB', position_code: 'RB',  team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: 'X',   x: 120, y: 290, display_label: 'X',  position_code: 'WR',  team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Z',   x: 680, y: 290, display_label: 'Z',  position_code: 'WR',  team_side: 'offense', role_type: 'receiver' },
  { token_id: 'H',   x: 555, y: 290, display_label: 'H',  position_code: 'TE',  team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Y',   x: 510, y: 290, display_label: 'Y',  position_code: 'TE',  team_side: 'offense', role_type: 'blocker' },
];

const DEFAULT_DEFENSE_PLAYERS = [
  { token_id: 'DE1', x: 310, y: 250, display_label: 'E', position_code: 'DE', team_side: 'defense', role_type: 'defender' },
  { token_id: 'DT1', x: 365, y: 250, display_label: 'T', position_code: 'DT', team_side: 'defense', role_type: 'defender' },
  { token_id: 'NG',  x: 400, y: 250, display_label: 'N', position_code: 'NT', team_side: 'defense', role_type: 'defender' },
  { token_id: 'DT2', x: 435, y: 250, display_label: 'T', position_code: 'DT', team_side: 'defense', role_type: 'defender' },
  { token_id: 'DE2', x: 490, y: 250, display_label: 'E', position_code: 'DE', team_side: 'defense', role_type: 'defender' },
  { token_id: 'MLB', x: 400, y: 215, display_label: 'M', position_code: 'MLB', team_side: 'defense', role_type: 'defender' },
  { token_id: 'WLB', x: 345, y: 215, display_label: 'W', position_code: 'OLB', team_side: 'defense', role_type: 'defender' },
  { token_id: 'SLB', x: 455, y: 215, display_label: 'S', position_code: 'OLB', team_side: 'defense', role_type: 'defender' },
  { token_id: 'CB1', x: 140, y: 200, display_label: 'C', position_code: 'CB',  team_side: 'defense', role_type: 'defender' },
  { token_id: 'CB2', x: 660, y: 200, display_label: 'C', position_code: 'CB',  team_side: 'defense', role_type: 'defender' },
  { token_id: 'SS',  x: 350, y: 175, display_label: 'S', position_code: 'SS',  team_side: 'defense', role_type: 'defender' },
  { token_id: 'FS',  x: 450, y: 175, display_label: 'F', position_code: 'FS',  team_side: 'defense', role_type: 'defender' },
];

// ─── Undo / Redo stack hook ───────────────────────────────────────────────────
function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [cursor, setCursor] = useState(0);

  const present = history[cursor];

  const push = useCallback((newState) => {
    setHistory(h => [...h.slice(0, cursor + 1), newState]);
    setCursor(c => c + 1);
  }, [cursor]);

  const undo = useCallback(() => { if (cursor > 0) setCursor(c => c - 1); }, [cursor]);
  const redo = useCallback(() => { if (cursor < history.length - 1) setCursor(c => c + 1); }, [cursor, history.length]);

  return { present, push, undo, redo, canUndo: cursor > 0, canRedo: cursor < history.length - 1 };
}

// ─── Main DiagramEditor ───────────────────────────────────────────────────────
export default function DiagramEditor({ playId, play, existingDiagram, onSaved, onClose }) {
  const queryClient = useQueryClient();

  // ── State ─────────────────────────────────────────────────────────────────
  const initPlayers = existingDiagram?.diagram_json?.players
    || (play.side === 'defense' ? DEFAULT_DEFENSE_PLAYERS : DEFAULT_OFFENSE_PLAYERS);
  const initPaths = existingDiagram?.diagram_json?.paths || [];
  const initAnnotations = existingDiagram?.diagram_json?.annotations || [];
  const initTimeline = existingDiagram?.animation_json || null;

  const { present: diagramState, push: pushState, undo, redo, canUndo, canRedo } = useUndoRedo({
    players: initPlayers, paths: initPaths, annotations: initAnnotations,
  });

  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'player' | 'path'
  const [timeline, setTimeline] = useState(initTimeline);
  const [animFrame, setAnimFrame] = useState({ playerPositions: {}, activePaths: new Set() });
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [versionLabel, setVersionLabel] = useState(existingDiagram?.version_label || 'v1');
  const [isDirty, setIsDirty] = useState(false);
  const [inspectorMode, setInspectorMode] = useState('object'); // 'object' | 'event'
  const [selectedEventId, setSelectedEventId] = useState(null);

  const { players, paths, annotations } = diagramState;

  // ── Animation engine ───────────────────────────────────────────────────────
  const {
    isPlaying, currentTime, speed, isLooping,
    totalDuration, play: animPlay, pause: animPause, restart: animRestart,
    seekTo, stepForward, stepBack, setSpeed, setIsLooping,
  } = useAnimationEngine({
    players, paths, timeline,
    onFrame: setAnimFrame,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const diagramJson = { players, paths, annotations };
      const animJson = timeline;
      if (existingDiagram?.id) {
        return base44.entities.PlayDiagram.update(existingDiagram.id, {
          diagram_json: diagramJson,
          animation_json: animJson,
          version_label: versionLabel,
          active: true,
        });
      }
      // Deactivate existing
      const existing = await base44.entities.PlayDiagram.filter({ play_id: playId });
      await Promise.all(existing.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      return base44.entities.PlayDiagram.create({
        play_id: playId,
        diagram_json: diagramJson,
        animation_json: animJson,
        version_label: versionLabel,
        active: true,
      });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      setIsDirty(false);
      onSaved && onSaved(saved);
      toast.success('Diagram saved');
    },
  });

  const saveNewVersionMutation = useMutation({
    mutationFn: async () => {
      const diagramJson = { players, paths, annotations };
      // Deactivate all, create new
      const existing = await base44.entities.PlayDiagram.filter({ play_id: playId });
      await Promise.all(existing.map(d => base44.entities.PlayDiagram.update(d.id, { active: false })));
      const vNum = existing.length + 1;
      return base44.entities.PlayDiagram.create({
        play_id: playId,
        diagram_json: diagramJson,
        animation_json: timeline,
        version_label: `v${vNum}`,
        active: true,
      });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', playId] });
      setIsDirty(false);
      toast.success(`Saved as ${saved.version_label}`);
    },
  });

  // ── Mutate diagram state ───────────────────────────────────────────────────
  const updateState = useCallback((patch) => {
    pushState({ ...diagramState, ...patch });
    setIsDirty(true);
  }, [diagramState, pushState]);

  const handleMovePlayer = useCallback((tokenId, x, y) => {
    updateState({ players: players.map(p => p.token_id === tokenId ? { ...p, x, y } : p) });
  }, [players, updateState]);

  const handleAddPlayer = useCallback((newPlayer) => {
    updateState({ players: [...players, newPlayer] });
  }, [players, updateState]);

  const handleAddPath = useCallback((newPath) => {
    updateState({ paths: [...paths, newPath] });
    setSelectedId(newPath.path_id);
    setSelectedType('path');
    setActiveTool('select');
  }, [paths, updateState]);

  const handleSelectObject = useCallback((id, type) => {
    setSelectedId(id);
    setSelectedType(type);
    setInspectorMode('object');
  }, []);

  // Update selected player
  const handleUpdatePlayer = useCallback((updatedPlayer) => {
    updateState({ players: players.map(p => p.token_id === updatedPlayer.token_id ? updatedPlayer : p) });
  }, [players, updateState]);

  const handleDuplicatePlayer = useCallback(() => {
    const player = players.find(p => p.token_id === selectedId);
    if (!player) return;
    const dup = { ...player, token_id: `p_${Date.now()}`, x: player.x + 20, y: player.y + 20 };
    updateState({ players: [...players, dup] });
    setSelectedId(dup.token_id);
  }, [players, selectedId, updateState]);

  const handleRemovePlayer = useCallback(() => {
    updateState({ players: players.filter(p => p.token_id !== selectedId) });
    setSelectedId(null);
  }, [players, selectedId, updateState]);

  // Update selected path
  const handleUpdatePath = useCallback((updatedPath) => {
    updateState({ paths: paths.map(p => p.path_id === updatedPath.path_id ? updatedPath : p) });
  }, [paths, updateState]);

  const handleRemovePath = useCallback(() => {
    updateState({ paths: paths.filter(p => p.path_id !== selectedId) });
    setSelectedId(null);
  }, [paths, selectedId, updateState]);

  const handleFlipPath = useCallback(() => {
    const path = paths.find(p => p.path_id === selectedId);
    if (!path?.points) return;
    const cx = 400; // canvas center x
    const flipped = path.points.map(pt => ({ ...pt, x: cx + (cx - pt.x) }));
    handleUpdatePath({ ...path, points: flipped });
  }, [paths, selectedId, handleUpdatePath]);

  // ── Auto-generate timing ───────────────────────────────────────────────────
  const handleAutoGenerate = useCallback(() => {
    const generated = generateDefaultTiming(players, paths);
    setTimeline(generated);
    setIsDirty(true);
    toast.success('Animation timing generated');
  }, [players, paths]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const SHORTCUT_MAP = {
      'v': 'select', 'h': 'pan', 'a': 'add_player', 'f': 'load_formation',
      'r': 'draw_route', 'u': 'draw_run', 'b': 'draw_block', 'p': 'draw_pull',
      'm': 'draw_motion', 'z': 'draw_blitz', 'd': 'draw_zone', 'c': 'draw_contain',
      'l': 'draw_ball', 't': 'add_label', 'n': 'add_note',
      'Escape': 'select',
    };
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
        if (e.key === 's') { e.preventDefault(); saveMutation.mutate(); return; }
      }
      if (SHORTCUT_MAP[e.key]) setActiveTool(SHORTCUT_MAP[e.key]);
      if (e.key === ' ') { e.preventDefault(); isPlaying ? animPause() : animPlay(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedType === 'player') handleRemovePlayer();
        if (selectedType === 'path') handleRemovePath();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, isPlaying, animPlay, animPause, selectedType, handleRemovePlayer, handleRemovePath, saveMutation]);

  // Derive selected objects
  const selectedPlayer = selectedType === 'player' ? players.find(p => p.token_id === selectedId) : null;
  const selectedPath = selectedType === 'path' ? paths.find(p => p.path_id === selectedId) : null;
  const selectedEvent = timeline?.events?.find(e => e.event_id === selectedEventId);

  return (
    <div className="flex flex-col w-full h-full bg-[#111827] overflow-hidden">
      {/* ── Compact editor header ── */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/80 border-b border-gray-700/50 shrink-0">
        {/* Back */}
        {onClose && (
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Play name + meta */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-display font-semibold text-white text-sm truncate">
            {play.name || play.play_name || 'Untitled Play'}
          </span>
          {play.side && (
            <Badge className={cn("text-[9px] font-bold border",
              play.side === 'offense' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
              play.side === 'defense' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
              "bg-purple-500/20 text-purple-400 border-purple-500/30")}>
              {play.side}
            </Badge>
          )}
          {play.formation && (
            <span className="text-[10px] text-gray-400">{play.formation}</span>
          )}
          {/* Version selector */}
          <input
            value={versionLabel}
            onChange={e => setVersionLabel(e.target.value)}
            className="text-[10px] font-mono text-gray-400 bg-transparent border border-gray-700/50 rounded px-1.5 py-0.5 w-14 focus:border-gray-500 outline-none"
            placeholder="v1"
          />
          {isDirty && (
            <span className="text-[10px] text-amber-400 font-medium">● Unsaved</span>
          )}
        </div>

        {/* Animation controls in header */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
          <button onClick={animRestart}
            className="h-7 px-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={isPlaying ? animPause : animPlay}
            className="h-7 px-3 bg-primary rounded-md text-white font-bold text-[10px] flex items-center gap-1.5 transition-all hover:bg-primary/80"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-px" />}
            {isPlaying ? 'Pause' : 'Preview'}
          </button>
        </div>

        {/* Field view */}
        <Select defaultValue="half_field">
          <SelectTrigger className="h-7 w-28 text-[10px] bg-gray-800 border-gray-700 text-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="half_field">Half Field</SelectItem>
            <SelectItem value="full_field">Full Field</SelectItem>
            <SelectItem value="red_zone">Red Zone</SelectItem>
            <SelectItem value="goal_line">Goal Line</SelectItem>
          </SelectContent>
        </Select>

        {/* Flip */}
        <button
          onClick={() => {
            const cx = 400;
            updateState({ players: players.map(p => ({ ...p, x: cx + (cx - p.x) })), paths: paths.map(path => ({ ...path, points: path.points?.map(pt => ({ ...pt, x: cx + (cx - pt.x) })) })) });
          }}
          className="h-7 px-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-[10px] flex items-center gap-1.5"
          title="Flip Left/Right"
        >
          <FlipHorizontal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Flip</span>
        </button>

        {/* Save actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost" size="sm"
            className="h-7 text-[10px] text-gray-400 hover:text-white hover:bg-gray-700 gap-1"
            onClick={() => saveNewVersionMutation.mutate()}
            disabled={saveNewVersionMutation.isPending}
          >
            <Layers className="h-3 w-3" />
            <span className="hidden md:inline">New Version</span>
          </Button>
          <Button
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-primary hover:bg-primary/80"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>
        </div>
      </div>

      {/* ── Main editor body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Tool palette */}
        <DesignerToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onUndo={undo} onRedo={redo}
          canUndo={canUndo} canRedo={canRedo}
          onReset={() => setActiveTool('select')}
        />

        {/* Center: Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#0f1a0f] min-w-0">
          {/* Active tool indicator */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-black/60 text-white/60 text-[9px] font-mono px-2 py-1 rounded-md">
              {activeTool?.replace(/_/g, ' ').toUpperCase() || 'SELECT'} · ⌘Z undo · Space play · ESC select
            </div>
          </div>

          <FieldCanvas
            players={players}
            paths={paths}
            annotations={annotations}
            selectedId={selectedId}
            selectedType={selectedType}
            activeTool={activeTool}
            animatedPositions={animFrame.playerPositions}
            activePaths={animFrame.activePaths}
            isAnimating={isPlaying || currentTime > 0}
            onSelectObject={handleSelectObject}
            onMovePlayer={handleMovePlayer}
            onAddPlayer={handleAddPlayer}
            onAddPath={handleAddPath}
            onSelectAnnotation={() => {}}
          />
        </div>

        {/* Right: Inspector */}
        <div className="w-56 xl:w-64 shrink-0 border-l border-gray-700/50 bg-gray-900/60 overflow-y-auto flex flex-col">
          {/* Inspector tabs */}
          <div className="flex border-b border-gray-700/50 shrink-0">
            <button
              onClick={() => setInspectorMode('object')}
              className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                inspectorMode === 'object' ? "text-white border-b-2 border-primary" : "text-gray-500 hover:text-gray-300")}
            >
              {selectedType === 'player' ? 'Player' : selectedType === 'path' ? 'Path' : 'Inspector'}
            </button>
            <button
              onClick={() => setInspectorMode('event')}
              className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                inspectorMode === 'event' ? "text-white border-b-2 border-primary" : "text-gray-500 hover:text-gray-300")}
            >
              Timeline
            </button>
          </div>

          {inspectorMode === 'object' ? (
            <div className="flex-1 overflow-y-auto">
              {/* Override default colors for dark bg */}
              <div className="[&_.text-muted-foreground]:text-gray-400 [&_.text-foreground]:text-white [&_.bg-secondary\/50]:bg-gray-800 [&_.bg-secondary\/40]:bg-gray-800/60 [&_.bg-secondary\/30]:bg-gray-800/40 [&_.border-border]:border-gray-700 [&_.bg-card]:bg-gray-800 [&_.bg-secondary]:bg-gray-700">
                {selectedPlayer && (
                  <PlayerInspector
                    player={selectedPlayer}
                    onUpdate={handleUpdatePlayer}
                    onDuplicate={handleDuplicatePlayer}
                    onRemove={handleRemovePlayer}
                  />
                )}
                {selectedPath && (
                  <PathInspector
                    path={selectedPath}
                    players={players}
                    onUpdate={handleUpdatePath}
                    onRemove={handleRemovePath}
                    onFlip={handleFlipPath}
                  />
                )}
                {!selectedPlayer && !selectedPath && (
                  <div className="p-4 space-y-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Canvas Info</p>
                    <div className="space-y-1.5 text-[11px] text-gray-400">
                      <div className="flex justify-between">
                        <span>Players</span><span className="font-mono text-gray-300">{players.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paths</span><span className="font-mono text-gray-300">{paths.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeline events</span>
                        <span className="font-mono text-gray-300">{timeline?.events?.length || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleAutoGenerate}
                      className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/10 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Auto-generate timing
                    </button>
                    <div className="text-[9px] text-gray-600 space-y-0.5">
                      <p>V = Select · H = Pan · A = Add player</p>
                      <p>R = Route · B = Block · M = Motion</p>
                      <p>Space = Play/Pause · ⌘Z = Undo</p>
                      <p>Delete = Remove selected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Timeline Events</p>
              {!timeline?.events?.length ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-500">No timing set</p>
                  <button
                    onClick={handleAutoGenerate}
                    className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {(timeline?.events || []).filter(e => e.path_id).map(evt => (
                    <button
                      key={evt.event_id}
                      onClick={() => { setSelectedEventId(evt.event_id); }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-[10px] transition-colors border",
                        selectedEventId === evt.event_id
                          ? "bg-primary/20 border-primary/40 text-white"
                          : "bg-gray-800/50 border-gray-700/40 text-gray-400 hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{evt.label || evt.event_type}</span>
                        <span className="font-mono text-gray-500">{evt.time_ms}ms</span>
                      </div>
                      {evt.duration_ms && (
                        <div className="text-gray-600 mt-0.5">+{evt.duration_ms}ms duration</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="[&_.text-muted-foreground]:text-gray-400 [&_.bg-card\/90]:bg-gray-900/90 [&_.border-border]:border-gray-700 [&_.bg-secondary\/30]:bg-gray-800/40 [&_.bg-secondary\/60]:bg-gray-800/60 [&_.bg-secondary]:bg-gray-700 [&_.hover\:bg-secondary]:hover:bg-gray-700">
        <AnimationTimeline
          timeline={timeline}
          players={players}
          paths={paths}
          isPlaying={isPlaying}
          currentTime={currentTime}
          speed={speed}
          isLooping={isLooping}
          totalDuration={totalDuration}
          selectedEventId={selectedEventId}
          onPlay={animPlay}
          onPause={animPause}
          onRestart={animRestart}
          onSeek={seekTo}
          onStepForward={stepForward}
          onStepBack={stepBack}
          onSetSpeed={setSpeed}
          onToggleLoop={() => setIsLooping(l => !l)}
          onSelectEvent={(evt) => { setSelectedEventId(evt.event_id); setInspectorMode('event'); }}
          onAutoGenerate={handleAutoGenerate}
          onSave={() => saveMutation.mutate()}
          collapsed={timelineCollapsed}
          onToggleCollapsed={() => setTimelineCollapsed(c => !c)}
        />
      </div>
    </div>
  );
}