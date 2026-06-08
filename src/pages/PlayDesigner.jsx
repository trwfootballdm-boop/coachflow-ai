import React, { useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Loader2, AlertTriangle, ArrowLeft, Plus, Sparkles,
  Play, Pause, ChevronLeft, Eye, Download, RotateCcw, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FieldCanvas from '@/components/play-designer/FieldCanvas';
import ToolPalette from '@/components/play-designer/ToolPalette';
import PropertiesPanel from '@/components/play-designer/PropertiesPanel';
import VersionBar from '@/components/play-designer/VersionBar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _tokenId = 1;
const newTokenId = () => `tok_${Date.now()}_${_tokenId++}`;
let _pathId = 1;
const newPathId = () => `path_${Date.now()}_${_pathId++}`;
let _annId = 1;
const newAnnId = () => `ann_${Date.now()}_${_annId++}`;

const DEFAULT_OFFENSE_FORMATION = [
  { token_id: newTokenId(), position_code: 'C',  display_label: 'C',  x: 400, y: 255, team_side: 'offense', role_type: 'lineman' },
  { token_id: newTokenId(), position_code: 'LG', display_label: 'LG', x: 360, y: 255, team_side: 'offense', role_type: 'lineman' },
  { token_id: newTokenId(), position_code: 'RG', display_label: 'RG', x: 440, y: 255, team_side: 'offense', role_type: 'lineman' },
  { token_id: newTokenId(), position_code: 'LT', display_label: 'LT', x: 316, y: 255, team_side: 'offense', role_type: 'lineman' },
  { token_id: newTokenId(), position_code: 'RT', display_label: 'RT', x: 484, y: 255, team_side: 'offense', role_type: 'lineman' },
  { token_id: newTokenId(), position_code: 'QB', display_label: 'QB', x: 400, y: 290, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: newTokenId(), position_code: 'RB', display_label: 'RB', x: 400, y: 330, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: newTokenId(), position_code: 'WR', display_label: 'X',  x: 140, y: 255, team_side: 'offense', role_type: 'receiver' },
  { token_id: newTokenId(), position_code: 'WR', display_label: 'Z',  x: 660, y: 255, team_side: 'offense', role_type: 'receiver' },
  { token_id: newTokenId(), position_code: 'TE', display_label: 'TE', x: 532, y: 255, team_side: 'offense', role_type: 'receiver' },
];

// ─── Play selector sidebar ────────────────────────────────────────────────────
function PlaySelector({ plays, playsLoading, selectedPlayId, onSelect, onNew }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => plays.filter(p =>
    !search || [p.name, p.play_name, p.short_name].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  ), [plays, search]);

  return (
    <div className="w-52 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Plays</p>
          <button onClick={onNew}
            className="h-6 w-6 rounded flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
        {playsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.map(play => (
          <button key={play.id} onClick={() => onSelect(play)}
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors",
              selectedPlayId === play.id ? "bg-primary/20 border-l-2 border-primary" : "hover:bg-gray-800"
            )}>
            <p className="text-xs font-semibold text-white truncate">{play.name || play.play_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {play.short_name && <code className="text-[9px] text-gray-500 font-mono">{play.short_name}</code>}
              {play.side && (
                <span className={cn("text-[9px] font-bold",
                  play.side === 'offense' ? "text-sky-500" :
                  play.side === 'defense' ? "text-red-500" : "text-amber-500"
                )}>
                  {play.side === 'special_teams' ? 'ST' : play.side?.slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && !playsLoading && (
          <div className="py-8 text-center text-xs text-gray-600">No plays found</div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PlayDesigner() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  // ── Editor state ──
  const [selectedPlay, setSelectedPlay] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'player' | 'path'

  // ── Diagram state ──
  const [players, setPlayers] = useState(DEFAULT_OFFENSE_FORMATION.map(p => ({ ...p })));
  const [paths, setPaths] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [playMeta, setPlayMeta] = useState({ coaching_points: '', notes: '' });

  // ── Versions ──
  const [versions, setVersions] = useState([{ id: 'v1', version_number: 1, version_label: 'Base', variation_type: 'base', is_active: true }]);
  const [activeVersionId, setActiveVersionId] = useState('v1');

  // ── History (undo/redo) ──
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const pushHistory = useCallback((state) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), state].slice(-30));
    setHistoryIdx(prev => Math.min(prev + 1, 29));
  }, [historyIdx]);

  // ── Data ──
  const { data: plays = [], isLoading: playsLoading } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'name'),
    enabled: !!activeTeamId,
  });

  const { data: playVersions = [], refetch: refetchVersions } = useQuery({
    queryKey: ['playVersions', selectedPlay?.id],
    queryFn: () => base44.entities.PlayVersion.filter({ play_id: selectedPlay.id }, '-version_number'),
    enabled: !!selectedPlay?.id,
  });

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlay?.id || !activeTeamId) return;
      const diagramData = { players, paths, annotations };
      const existing = playVersions.find(v => v.id === activeVersionId);
      if (existing) {
        return base44.entities.PlayVersion.update(existing.id, { diagram_json: diagramData, paths, annotations });
      }
      return base44.entities.PlayVersion.create({
        play_id: selectedPlay.id,
        team_id: activeTeamId,
        version_number: 1,
        version_label: 'Base',
        variation_type: 'base',
        is_active: true,
        diagram_json: diagramData,
        paths,
        annotations,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      refetchVersions();
      toast.success('Play diagram saved');
    },
  });

  const createPlayMutation = useMutation({
    mutationFn: (name) => base44.entities.Play.create({
      team_id: activeTeamId,
      name,
      side: 'offense',
    }),
    onSuccess: (play) => {
      queryClient.invalidateQueries({ queryKey: ['plays', activeTeamId] });
      loadPlay(play);
      toast.success(`"${play.name}" created`);
    },
  });

  // ── Load play ──
  const loadPlay = (play) => {
    setSelectedPlay(play);
    setPlayers(DEFAULT_OFFENSE_FORMATION.map(p => ({ ...p, token_id: newTokenId() })));
    setPaths([]);
    setAnnotations([]);
    setSelectedId(null);
    setSelectedType(null);
    setIsDirty(false);
    setHistory([]);
    setHistoryIdx(-1);
  };

  const handleNewPlay = () => {
    const name = prompt('New play name:');
    if (name?.trim()) createPlayMutation.mutate(name.trim());
  };

  // ── Canvas operations ──
  const markDirty = () => setIsDirty(true);

  const addPlayer = useCallback((coords) => {
    const newPlayer = {
      token_id: newTokenId(),
      position_code: 'WR',
      display_label: 'WR',
      x: coords.x,
      y: coords.y,
      team_side: 'offense',
      role_type: 'receiver',
    };
    setPlayers(prev => [...prev, newPlayer]);
    markDirty();
    setActiveTool('select');
    setSelectedId(newPlayer.token_id);
    setSelectedType('player');
  }, []);

  const movePlayer = useCallback((tokenId, x, y) => {
    setPlayers(prev => prev.map(p => p.token_id === tokenId ? { ...p, x, y } : p));
    markDirty();
  }, []);

  const updatePlayer = useCallback((updated) => {
    setPlayers(prev => prev.map(p => p.token_id === updated.token_id ? updated : p));
    markDirty();
  }, []);

  const deletePlayer = useCallback((tokenId) => {
    setPlayers(prev => prev.filter(p => p.token_id !== tokenId));
    setPaths(prev => prev.filter(p => p.token_id !== tokenId));
    setSelectedId(null);
    setSelectedType(null);
    markDirty();
  }, []);

  const duplicatePlayer = useCallback((tokenId) => {
    const src = players.find(p => p.token_id === tokenId);
    if (!src) return;
    const copy = { ...src, token_id: newTokenId(), x: src.x + 20, y: src.y + 20 };
    setPlayers(prev => [...prev, copy]);
    setSelectedId(copy.token_id);
    markDirty();
  }, [players]);

  const addPath = useCallback((pathData) => {
    const newPath = {
      path_id: newPathId(),
      token_id: selectedId,
      path_type: pathData.type,
      points: pathData.points,
      curve_type: 'straight',
      arrowhead: 'open',
      line_style: 'solid',
      stroke_width: 2.5,
      visible: true,
    };
    setPaths(prev => [...prev, newPath]);
    markDirty();
  }, [selectedId]);

  const updatePath = useCallback((updated) => {
    setPaths(prev => prev.map(p => p.path_id === updated.path_id ? updated : p));
    markDirty();
  }, []);

  const deletePath = useCallback((pathId) => {
    setPaths(prev => prev.filter(p => p.path_id !== pathId));
    setSelectedId(null);
    setSelectedType(null);
    markDirty();
  }, []);

  const handleSelectPlayer = useCallback((tokenId) => {
    setSelectedId(tokenId);
    setSelectedType(tokenId ? 'player' : null);
  }, []);

  const handleAction = useCallback((actionId) => {
    if (actionId === 'undo') {
      if (historyIdx > 0) { setHistoryIdx(h => h - 1); }
    } else if (actionId === 'redo') {
      if (historyIdx < history.length - 1) { setHistoryIdx(h => h + 1); }
    } else if (actionId === 'flip') {
      setPlayers(prev => prev.map(p => ({ ...p, x: 800 - p.x })));
      setPaths(prev => prev.map(path => ({
        ...path,
        points: path.points.map(pt => ({ ...pt, x: 800 - pt.x }))
      })));
      markDirty();
      toast.success('Formation flipped');
    } else if (actionId === 'reset') {
      setPlayers(DEFAULT_OFFENSE_FORMATION.map(p => ({ ...p, token_id: newTokenId() })));
      setPaths([]);
      setAnnotations([]);
      markDirty();
      toast.success('Reset to default formation');
    } else if (actionId === 'animate') {
      toast.info('Animation preview coming soon');
    }
  }, [history, historyIdx]);

  const handleCreateVersion = (versionData) => {
    const id = `v${versions.length + 1}_${Date.now()}`;
    setVersions(prev => [...prev, { ...versionData, id, version_number: prev.length + 1 }]);
    setActiveVersionId(id);
    toast.success(`Version "${versionData.version_label}" created`);
  };

  const totalPlayers = players.length;
  const totalPaths = paths.length;

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden bg-gray-950">
      {/* ── Play selector sidebar ── */}
      <PlaySelector
        plays={plays}
        playsLoading={playsLoading}
        selectedPlayId={selectedPlay?.id}
        onSelect={loadPlay}
        onNew={handleNewPlay}
      />

      {/* ── Main editor area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Top toolbar ── */}
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {selectedPlay ? (
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white truncate">
                  {selectedPlay.name || selectedPlay.play_name}
                </h1>
                {selectedPlay.short_name && (
                  <code className="text-[10px] text-gray-500 font-mono">{selectedPlay.short_name}</code>
                )}
                <Badge variant="secondary" className="text-[9px] bg-gray-800 text-gray-400 border-gray-700">
                  {selectedPlay.side === 'special_teams' ? 'ST' : selectedPlay.side?.slice(0,3).toUpperCase() || 'OFF'}
                </Badge>
                <span className="text-[10px] text-gray-600">{totalPlayers}P · {totalPaths} paths</span>
                {isDirty && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                    <AlertTriangle className="h-3 w-3" /> Unsaved
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select or create a play to begin designing</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* AI helper */}
            <Button size="sm" variant="outline"
              className="gap-1.5 text-xs h-8 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => toast.info('AI assistant coming soon')}>
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="hidden sm:inline">AI Assist</span>
            </Button>

            <Button size="sm" className="gap-1.5 h-8 text-xs"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty || !selectedPlay}>
              {saveMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* ── Version bar ── */}
        <VersionBar
          versions={versions}
          activeVersionId={activeVersionId}
          onSelectVersion={(v) => setActiveVersionId(v.id)}
          onCreateVersion={handleCreateVersion}
          onCloneVersion={(v) => {
            const id = `v${versions.length + 1}_${Date.now()}`;
            setVersions(prev => [...prev, { ...v, id, version_label: `${v.version_label} (copy)`, is_active: false }]);
          }}
        />

        {/* ── Canvas + properties ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tool palette */}
          <ToolPalette activeTool={activeTool} onToolChange={setActiveTool} onAction={handleAction} />

          {/* Field canvas */}
          <div className="flex-1 relative bg-gray-950 overflow-hidden flex items-center justify-center">
            {!selectedPlay ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏈</span>
                </div>
                <h3 className="text-white font-display font-semibold mb-2">No play selected</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-xs">
                  Choose a play from the sidebar or create a new one to start designing.
                </p>
                <button onClick={handleNewPlay}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mx-auto">
                  <Plus className="h-4 w-4" /> Create New Play
                </button>
              </div>
            ) : (
              <FieldCanvas
                players={players}
                paths={paths}
                annotations={annotations}
                selectedId={selectedId}
                activeTool={activeTool}
                onSelectPlayer={handleSelectPlayer}
                onMovePlayer={movePlayer}
                onAddPlayer={addPlayer}
                onAddPath={addPath}
                onSelectAnnotation={(ann) => { setSelectedId(ann.ann_id); setSelectedType('annotation'); }}
              />
            )}

            {/* Tool hint */}
            {selectedPlay && activeTool && activeTool !== 'select' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-700 pointer-events-none">
                {activeTool === 'add_player' && 'Click field to place player'}
                {activeTool === 'draw_route' && 'Click to add points · Double-click to finish route'}
                {activeTool === 'draw_block' && 'Click to add points · Double-click to finish block track'}
                {activeTool === 'draw_motion' && 'Click to add points · Double-click to finish motion'}
                {activeTool === 'draw_blitz' && 'Click to add points · Double-click to finish blitz path'}
                {activeTool === 'draw_zone' && 'Click to add points · Double-click to finish zone drop'}
              </div>
            )}
          </div>

          {/* Properties panel */}
          <div className="w-60 xl:w-72 shrink-0 bg-gray-900 border-l border-gray-700 overflow-y-auto">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                {selectedType === 'player' ? 'Player Inspector' :
                 selectedType === 'path' ? 'Path Inspector' : 'Play Properties'}
              </p>
            </div>
            <PropertiesPanel
              selectedObject={selectedId}
              selectedType={selectedType}
              players={players}
              paths={paths}
              playData={playMeta}
              onUpdatePlayer={updatePlayer}
              onDeletePlayer={deletePlayer}
              onDuplicatePlayer={duplicatePlayer}
              onUpdatePath={updatePath}
              onDeletePath={deletePath}
              onUpdatePlay={(patch) => { setPlayMeta(m => ({ ...m, ...patch })); markDirty(); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}