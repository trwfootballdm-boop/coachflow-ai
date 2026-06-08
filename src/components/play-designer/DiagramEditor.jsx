import React, { useState, useReducer, useCallback, useRef } from 'react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ToolPalette from './ToolPalette';
import PropertiesPanel from './PropertiesPanel';
import VersionBar from './VersionBar';
import {
  autoGenerateTimeline, DEFAULT_TOTAL_MS,
  computeFrame, computePathProgress,
} from './AnimationEngine';

// ─── Default player sets ──────────────────────────────────────────────────────
const DEFAULT_OFFENSE = [
  { token_id: 'LT', position_code: 'LT', display_label: 'LT', x: 290, y: 250, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'LG', position_code: 'LG', display_label: 'LG', x: 325, y: 250, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'C',  position_code: 'C',  display_label: 'C',  x: 360, y: 250, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RG', position_code: 'RG', display_label: 'RG', x: 395, y: 250, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'RT', position_code: 'RT', display_label: 'RT', x: 430, y: 250, team_side: 'offense', role_type: 'lineman' },
  { token_id: 'QB', position_code: 'QB', display_label: 'QB', x: 360, y: 290, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: 'RB', position_code: 'RB', display_label: 'RB', x: 360, y: 330, team_side: 'offense', role_type: 'ball_carrier' },
  { token_id: 'X',  position_code: 'WR', display_label: 'X',  x: 130, y: 250, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Z',  position_code: 'WR', display_label: 'Z',  x: 590, y: 250, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'Y',  position_code: 'TE', display_label: 'Y',  x: 468, y: 250, team_side: 'offense', role_type: 'receiver' },
  { token_id: 'H',  position_code: 'WR', display_label: 'H',  x: 510, y: 260, team_side: 'offense', role_type: 'receiver' },
];

const FIELD = { width: 800, height: 500 };

const PATH_COLORS = {
  run_path:       '#f59e0b',
  pass_route:     '#60a5fa',
  blocking_track: '#fb923c',
  pull_path:      '#fb923c',
  motion_path:    '#a78bfa',
  blitz_path:     '#f87171',
  pursuit_path:   '#f87171',
  zone_drop:      '#34d399',
  contain_path:   '#f87171',
  ball_path:      '#fde68a',
  fake_path:      '#c084fc',
};

const PATH_DASH = {
  blocking_track: '6,3',
  pull_path: '4,2',
  motion_path: '8,4',
  pursuit_path: '4,4',
  zone_drop: '12,4',
  contain_path: '6,2',
  fake_path: '4,4',
};

const TOOL_TO_PATH_TYPE = {
  draw_route:  'pass_route',
  draw_block:  'blocking_track',
  draw_motion: 'motion_path',
  draw_blitz:  'blitz_path',
  draw_zone:   'zone_drop',
};

// ─── State reducer ─────────────────────────────────────────────────────────────
function diagramReducer(state, action) {
  switch (action.type) {
    case 'SET': return { ...action.payload };
    case 'ADD_PLAYER': return { ...state, players: [...state.players, action.player] };
    case 'UPDATE_PLAYER': return {
      ...state,
      players: state.players.map(p => p.token_id === action.player.token_id ? action.player : p),
    };
    case 'DELETE_PLAYER': return {
      ...state,
      players: state.players.filter(p => p.token_id !== action.token_id),
      paths: state.paths.filter(p => p.token_id !== action.token_id),
    };
    case 'ADD_PATH': return { ...state, paths: [...state.paths, action.path] };
    case 'UPDATE_PATH': return {
      ...state,
      paths: state.paths.map(p => p.path_id === action.path.path_id ? action.path : p),
    };
    case 'DELETE_PATH': return {
      ...state,
      paths: state.paths.filter(p => p.path_id !== action.path_id),
    };
    case 'ADD_ANNOTATION': return { ...state, annotations: [...(state.annotations || []), action.annotation] };
    case 'RESET': return {
      players: DEFAULT_OFFENSE.map(p => ({ ...p })),
      paths: [],
      annotations: [],
    };
    default: return state;
  }
}

// ─── Field SVG ─────────────────────────────────────────────────────────────────
function FieldSVG({ diagram, activeTool, selectedId, selectedType, drawingPath, timeline, currentMs, isAnimating, onSVGClick, onSVGDblClick, onPlayerMouseDown, onPlayerHover, hoverPlayer, svgRef }) {
  const playableH = FIELD.height - 100;
  const yardLines = Array.from({ length: 13 }, (_, i) =>
    50 + (i * playableH) / 12
  );

  const players = isAnimating && timeline
    ? computeFrame(diagram, timeline, currentMs).players
    : diagram.players;

  const activeEventIds = isAnimating && timeline
    ? computeFrame(diagram, timeline, currentMs).activeEventIds
    : [];

  const losBand = FIELD.height / 2;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FIELD.width} ${FIELD.height}`}
      className="w-full h-full select-none"
      style={{ cursor: activeTool?.startsWith('draw') || activeTool === 'add_player' ? 'crosshair' : 'default' }}
      onClick={onSVGClick}
      onDoubleClick={onSVGDblClick}
    >
      <defs>
        {Object.entries(PATH_COLORS).map(([type, color]) => (
          <marker key={type} id={`arr-${type}`} markerWidth="7" markerHeight="7" refX="5.5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Field surface */}
      <rect width={FIELD.width} height={FIELD.height} fill="#1a5c2e" />
      {yardLines.map((y, i) => i % 2 === 0 && (
        <rect key={i} x={0} y={y} width={FIELD.width}
          height={playableH / 12} fill="#174f27" opacity={0.4} />
      ))}

      {/* End zones */}
      <rect x={0} y={0} width={FIELD.width} height={50} fill="#14532d" opacity={0.75} />
      <rect x={0} y={FIELD.height - 50} width={FIELD.width} height={50} fill="#14532d" opacity={0.75} />

      {/* Yard lines */}
      {yardLines.map((y, i) => (
        <line key={i} x1={0} y1={y} x2={FIELD.width} y2={y}
          stroke="rgba(255,255,255,0.22)" strokeWidth={i === 0 || i === yardLines.length - 1 ? 2 : 1} />
      ))}

      {/* Hash marks */}
      {yardLines.slice(1, -1).map((y, i) => (
        <g key={i}>
          {[280, 520].map(hx => (
            <line key={hx} x1={hx - 8} y1={y} x2={hx + 8} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
          ))}
        </g>
      ))}

      {/* LOS */}
      <line x1={0} y1={losBand} x2={FIELD.width} y2={losBand}
        stroke="rgba(255,255,80,0.45)" strokeWidth={2} strokeDasharray="8,6" />
      <text x={8} y={losBand - 4} fill="rgba(255,255,80,0.5)" fontSize={10} fontFamily="monospace">LOS</text>

      {/* Completed paths */}
      {diagram.paths.map(path => {
        const pts = path.points;
        if (!pts || pts.length < 2) return null;
        const color = PATH_COLORS[path.path_type] || '#60a5fa';
        const dash = PATH_DASH[path.path_type];

        let progress = { visible: true, t: 1 };
        if (isAnimating && timeline) {
          progress = computePathProgress(path, timeline, currentMs);
        }
        if (!progress.visible) return null;

        // Build partial path if animating
        let d = '';
        if (progress.t < 1 && isAnimating) {
          const totalSeg = pts.length - 1;
          const segT = progress.t * totalSeg;
          const fullSegs = Math.floor(segT);
          const lt = segT - fullSegs;
          const drawPts = pts.slice(0, fullSegs + 1);
          if (fullSegs < totalSeg) {
            const p1 = pts[fullSegs];
            const p2 = pts[fullSegs + 1];
            drawPts.push({ x: p1.x + (p2.x - p1.x) * lt, y: p1.y + (p2.y - p1.y) * lt });
          }
          d = drawPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        } else {
          d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        }

        const isSelected = selectedType === 'path' && selectedId === path.path_id;
        const opacity = isAnimating ? (progress.t > 0 ? 0.85 : 0.15) : 0.85;

        return (
          <path
            key={path.path_id}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={path.stroke_width || 2.5}
            strokeDasharray={dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={progress.t >= 0.98 ? `url(#arr-${path.path_type})` : undefined}
            opacity={opacity}
            className={isSelected ? "cursor-pointer" : "cursor-pointer"}
            style={{ filter: isSelected ? `drop-shadow(0 0 4px ${color})` : 'none' }}
          />
        );
      })}

      {/* In-progress drawing path */}
      {drawingPath && drawingPath.points.length >= 1 && (
        <g>
          {drawingPath.points.length >= 2 && (
            <path
              d={drawingPath.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke={PATH_COLORS[drawingPath.type] || '#60a5fa'}
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.7}
              strokeLinecap="round"
            />
          )}
          {drawingPath.points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={3.5}
              fill={PATH_COLORS[drawingPath.type] || '#60a5fa'}
              opacity={0.8}
            />
          ))}
          <text
            x={drawingPath.points[drawingPath.points.length - 1].x + 6}
            y={drawingPath.points[drawingPath.points.length - 1].y - 6}
            fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="monospace"
          >
            dbl-click to finish
          </text>
        </g>
      )}

      {/* Annotations */}
      {(diagram.annotations || []).map(ann => {
        if (ann.ann_type === 'zone_marker') {
          return (
            <rect key={ann.ann_id} x={ann.x - 30} y={ann.y - 20} width={60} height={40}
              fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.5)"
              strokeWidth={1} strokeDasharray="4,2" rx={4} className="cursor-pointer" />
          );
        }
        return (
          <text key={ann.ann_id} x={ann.x} y={ann.y}
            fill="rgba(255,255,255,0.85)" fontSize={12} fontFamily="sans-serif" className="cursor-pointer">
            {ann.text}
          </text>
        );
      })}

      {/* Players */}
      {players.map(player => {
        const isSelected = selectedType === 'player' && selectedId === player.token_id;
        const isHover = hoverPlayer === player.token_id;
        const isDefense = player.team_side === 'defense';
        const isActive = activeEventIds.includes(player.token_id);

        const fill = player.visual_style?.fill ||
          (player.team_side === 'defense' ? '#ef4444' :
            player.role_type === 'lineman' ? '#6b7280' :
            player.role_type === 'receiver' ? '#3b82f6' :
            player.role_type === 'ball_carrier' ? '#fbbf24' : '#3b82f6');

        return (
          <g key={player.token_id}
            transform={`translate(${player.x}, ${player.y})`}
            style={{ cursor: activeTool === 'select' || !activeTool ? 'grab' : 'default' }}
            onMouseDown={e => onPlayerMouseDown(e, player)}
            onMouseEnter={() => onPlayerHover(player.token_id)}
            onMouseLeave={() => onPlayerHover(null)}
          >
            {/* Active glow */}
            {isActive && (
              <circle r={20} fill="none" stroke={fill} strokeWidth={1.5} opacity={0.4}>
                <animate attributeName="r" values="16;22;16" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.8s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Selection / hover ring */}
            {(isSelected || isHover) && (
              <circle r={17} fill="none"
                stroke="white"
                strokeWidth={isSelected ? 2.5 : 1}
                opacity={isSelected ? 0.9 : 0.35}
                strokeDasharray={isSelected ? 'none' : '4,2'}
              />
            )}
            {/* Body */}
            {isDefense ? (
              <rect x={-12} y={-12} width={24} height={24} rx={3}
                fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
            ) : (
              <circle r={12} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
            )}
            {/* Label */}
            <text textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={9} fontWeight="bold" fontFamily="monospace"
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {(player.display_label || player.position_code || '?').slice(0, 3)}
            </text>
          </g>
        );
      })}

      {/* Ball */}
      <ellipse cx={FIELD.width / 2} cy={losBand} rx={9} ry={5.5}
        fill="#b45309" stroke="#fef3c7" strokeWidth={1.5} opacity={0.85} />
    </svg>
  );
}

// ─── Main DiagramEditor ─────────────────────────────────────────────────────────
export default function DiagramEditor({
  initialDiagram,
  versions = [],
  activeVersionId,
  onSave,
  onSelectVersion,
  onCreateVersion,
  onCloneVersion,
  playData,
  onUpdatePlay,
}) {
  const svgRef = useRef(null);

  const [diagram, dispatch] = useReducer(diagramReducer, {
    players: (initialDiagram?.players || DEFAULT_OFFENSE).map(p => ({ ...p })),
    paths: initialDiagram?.paths || [],
    annotations: initialDiagram?.annotations || [],
  });

  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [drawingPath, setDrawingPath] = useState(null);
  const [hoverPlayer, setHoverPlayer] = useState(null);

  // Animation state
  const [timeline, setTimeline] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const animRef = useRef(null);
  const lastRef = useRef(null);

  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, []);

  // ── Handle SVG click ─────────────────────────────────────────────────────
  const handleSVGClick = useCallback((e) => {
    const coords = getSVGCoords(e);

    if (activeTool === 'add_player') {
      const newPlayer = {
        token_id: `p_${Date.now()}`,
        position_code: 'PL',
        display_label: 'PL',
        x: coords.x, y: coords.y,
        team_side: 'offense',
        role_type: 'other',
      };
      dispatch({ type: 'ADD_PLAYER', player: newPlayer });
      return;
    }

    if (activeTool === 'add_label') {
      const text = window.prompt('Label text:');
      if (text) {
        dispatch({ type: 'ADD_ANNOTATION', annotation: { ann_id: `ann_${Date.now()}`, ann_type: 'text_label', text, x: coords.x, y: coords.y } });
      }
      return;
    }

    if (activeTool === 'add_zone') {
      dispatch({ type: 'ADD_ANNOTATION', annotation: { ann_id: `ann_${Date.now()}`, ann_type: 'zone_marker', x: coords.x, y: coords.y } });
      return;
    }

    const drawTool = TOOL_TO_PATH_TYPE[activeTool];
    if (drawTool) {
      if (!drawingPath) {
        setDrawingPath({ type: drawTool, points: [coords] });
      } else {
        setDrawingPath(dp => ({ ...dp, points: [...dp.points, coords] }));
      }
      return;
    }

    // Deselect
    setSelectedId(null);
    setSelectedType(null);
  }, [activeTool, getSVGCoords, drawingPath]);

  const handleSVGDblClick = useCallback((e) => {
    if (drawingPath && drawingPath.points.length >= 2) {
      const newPath = {
        path_id: `path_${Date.now()}`,
        path_type: drawingPath.type,
        points: drawingPath.points,
        curve_type: 'straight',
        arrowhead: 'open',
        stroke_width: 2.5,
        visible: true,
        token_id: null,
      };
      dispatch({ type: 'ADD_PATH', path: newPath });
      setDrawingPath(null);
      setSelectedId(newPath.path_id);
      setSelectedType('path');
    }
  }, [drawingPath]);

  const handlePlayerMouseDown = useCallback((e, player) => {
    e.stopPropagation();
    setSelectedId(player.token_id);
    setSelectedType('player');

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: player.x, y: player.y };

    const onMove = (me) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const sx = FIELD.width / rect.width;
      const sy = FIELD.height / rect.height;
      const dx = (me.clientX - startX) * sx;
      const dy = (me.clientY - startY) * sy;
      dispatch({ type: 'UPDATE_PLAYER', player: { ...player, x: Math.round(startPos.x + dx), y: Math.round(startPos.y + dy) } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // ── Animation playback ────────────────────────────────────────────────────
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    lastRef.current = null;
    setCurrentMs(0);
  }, []);

  const startAnimation = useCallback(() => {
    let tl = timeline;
    if (!tl) {
      tl = autoGenerateTimeline(diagram);
      setTimeline(tl);
    }
    setIsAnimating(true);
    setCurrentMs(0);
    lastRef.current = null;

    const total = tl.totalDuration;
    const tick = (now) => {
      if (!lastRef.current) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      setCurrentMs(prev => {
        const next = prev + delta;
        if (next >= total) {
          setIsAnimating(false);
          return total;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [timeline, diagram]);

  // ── Toolbar actions ───────────────────────────────────────────────────────
  const handleAction = useCallback((action) => {
    if (action === 'reset') {
      dispatch({ type: 'RESET' });
      stopAnimation();
    } else if (action === 'animate') {
      isAnimating ? stopAnimation() : startAnimation();
    } else if (action === 'flip') {
      const flipped = {
        ...diagram,
        players: diagram.players.map(p => ({ ...p, x: FIELD.width - p.x })),
        paths: diagram.paths.map(path => ({
          ...path,
          points: path.points.map(pt => ({ ...pt, x: FIELD.width - pt.x })),
        })),
      };
      dispatch({ type: 'SET', payload: flipped });
    } else if (action === 'undo') {
      toast.info('Undo coming soon — use Reset to start over');
    }
  }, [isAnimating, startAnimation, stopAnimation, diagram]);

  const handleSave = useCallback(() => {
    onSave && onSave(diagram);
    toast.success('Diagram saved');
  }, [onSave, diagram]);

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Version bar */}
      <VersionBar
        versions={versions}
        activeVersionId={activeVersionId}
        onSelectVersion={onSelectVersion}
        onCreateVersion={onCreateVersion}
        onCloneVersion={onCloneVersion}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Tool palette */}
        <ToolPalette
          activeTool={activeTool}
          onToolChange={t => { setActiveTool(t); setDrawingPath(null); }}
          onAction={handleAction}
        />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-900">
          <FieldSVG
            diagram={diagram}
            activeTool={activeTool}
            selectedId={selectedId}
            selectedType={selectedType}
            drawingPath={drawingPath}
            timeline={isAnimating ? timeline : null}
            currentMs={currentMs}
            isAnimating={isAnimating}
            onSVGClick={handleSVGClick}
            onSVGDblClick={handleSVGDblClick}
            onPlayerMouseDown={handlePlayerMouseDown}
            onPlayerHover={setHoverPlayer}
            hoverPlayer={hoverPlayer}
            svgRef={svgRef}
          />

          {/* Save button overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-lg hover:bg-primary/90 transition-all"
            >
              Save Diagram
            </button>
          </div>

          {/* Animation status badge */}
          {isAnimating && (
            <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Previewing Animation
              <button onClick={stopAnimation} className="ml-1 hover:text-red-400 transition-colors">✕</button>
            </div>
          )}

          {/* Drawing hint */}
          {drawingPath && (
            <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-medium px-3 py-1 rounded-full">
              {drawingPath.points.length} point{drawingPath.points.length !== 1 ? 's' : ''} · double-click to finish
            </div>
          )}
        </div>

        {/* Properties panel */}
        <div className="w-52 shrink-0 bg-gray-900 border-l border-gray-700 overflow-y-auto">
          <PropertiesPanel
            selectedObject={selectedId}
            selectedType={selectedType}
            players={diagram.players}
            paths={diagram.paths}
            playData={playData}
            onUpdatePlayer={p => dispatch({ type: 'UPDATE_PLAYER', player: p })}
            onDeletePlayer={id => { dispatch({ type: 'DELETE_PLAYER', token_id: id }); setSelectedId(null); setSelectedType(null); }}
            onDuplicatePlayer={id => {
              const orig = diagram.players.find(p => p.token_id === id);
              if (orig) dispatch({ type: 'ADD_PLAYER', player: { ...orig, token_id: `p_${Date.now()}`, x: orig.x + 20, y: orig.y + 20 } });
            }}
            onUpdatePath={p => dispatch({ type: 'UPDATE_PATH', path: p })}
            onDeletePath={id => { dispatch({ type: 'DELETE_PATH', path_id: id }); setSelectedId(null); setSelectedType(null); }}
            onUpdatePlay={onUpdatePlay}
          />
        </div>
      </div>
    </div>
  );
}