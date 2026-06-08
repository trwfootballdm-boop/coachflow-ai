import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

// ─── Field config ─────────────────────────────────────────────────────────────
const F = {
  width: 900, height: 540,
  hashLeft: 310, hashRight: 590,
  endZoneH: 55,
  losY: 290,  // line of scrimmage Y position
};

const PATH_STYLES = {
  pass_route:     { stroke: '#60a5fa', dash: '' },
  run_path:       { stroke: '#f59e0b', dash: '' },
  blocking_track: { stroke: '#fb923c', dash: '6 3' },
  pull_path:      { stroke: '#f97316', dash: '4 2' },
  motion_path:    { stroke: '#a78bfa', dash: '8 4' },
  blitz_path:     { stroke: '#f87171', dash: '' },
  pursuit_path:   { stroke: '#f87171', dash: '4 4' },
  zone_drop:      { stroke: '#34d399', dash: '12 4' },
  contain_path:   { stroke: '#fb7185', dash: '6 2' },
  ball_path:      { stroke: '#fde68a', dash: '' },
  fake_path:      { stroke: '#c084fc', dash: '4 4' },
};

const ROLE_FILL = {
  ball_carrier: '#fbbf24', blocker: '#fb923c',
  receiver: '#60a5fa',     lineman: '#6b7280',
  defender: '#ef4444',     kicker: '#a78bfa',
  returner: '#34d399',     other: '#9ca3af',
};

function getPlayerFill(p) {
  if (p.visual_style?.fill) return p.visual_style.fill;
  return ROLE_FILL[p.role_type] || (p.team_side === 'defense' ? '#ef4444' : '#3b82f6');
}

function buildD(pts, curve = 'straight') {
  if (!pts || pts.length < 2) return '';
  if (curve === 'curved' && pts.length >= 3) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const end = pts[i + 1] || pts[i];
      d += ` Q ${pts[i].x} ${pts[i].y} ${end.x} ${end.y}`;
    }
    return d;
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// Arrow marker defs per path type
function Markers() {
  return (
    <defs>
      {Object.entries(PATH_STYLES).map(([type, s]) => (
        <marker key={type} id={`arr-${type}`} markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={s.stroke} />
        </marker>
      ))}
    </defs>
  );
}

// ─── DesignerCanvas ───────────────────────────────────────────────────────────
export default function DesignerCanvas({
  players = [], paths = [], annotations = [],
  selectedPlayerId, selectedPathId,
  activeTool,
  onSelectPlayer, onSelectPath,
  onMovePlayer, onAddPlayer, onCommitPath,
  zoom = 1, pan = { x: 0, y: 0 },
  onDrawingChange,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [drawing, setDrawing]   = useState(null); // { type, points[] }
  const [cursor, setCursor]     = useState({ x: 0, y: 0 });
  const [hover, setHover]       = useState(null);

  const toSVG = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.round(((cx - rect.left) / rect.width)  * F.width),
      y: Math.round(((cy - rect.top)  / rect.height) * F.height),
    };
  }, []);

  // ESC cancels drawing
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && drawing) {
        setDrawing(null);
        onDrawingChange?.(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawing, onDrawingChange]);

  // Notify parent of drawing points count
  useEffect(() => {
    onDrawingChange?.(drawing?.points.length || 0);
  }, [drawing, onDrawingChange]);

  const DRAW_TOOL_MAP = {
    draw_route:   'pass_route',
    draw_run:     'run_path',
    draw_block:   'blocking_track',
    draw_pull:    'pull_path',
    draw_motion:  'motion_path',
    draw_blitz:   'blitz_path',
    draw_zone:    'zone_drop',
    draw_contain: 'contain_path',
    draw_ball:    'ball_path',
    draw_fake:    'fake_path',
  };

  const isDrawTool = activeTool && DRAW_TOOL_MAP[activeTool];

  const handleSVGMouseMove = useCallback((e) => {
    const coords = toSVG(e);
    setCursor(coords);
    if (dragging && activeTool === 'select') {
      const player = players.find(p => p.token_id === dragging);
      if (player && !player.locked) {
        onMovePlayer(dragging, coords.x, coords.y);
      }
    }
  }, [dragging, activeTool, players, toSVG, onMovePlayer]);

  const handleSVGMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleSVGClick = useCallback((e) => {
    if (dragging) return;
    const coords = toSVG(e);

    if (activeTool === 'add_player') {
      onAddPlayer?.(coords);
      return;
    }
    if (isDrawTool) {
      const pathType = DRAW_TOOL_MAP[activeTool];
      setDrawing(prev => {
        if (!prev) return { type: pathType, points: [coords] };
        return { ...prev, points: [...prev.points, coords] };
      });
      return;
    }
    // deselect
    onSelectPlayer?.(null);
    onSelectPath?.(null);
  }, [dragging, activeTool, isDrawTool, toSVG, onAddPlayer, onSelectPlayer, onSelectPath]);

  const handleSVGDblClick = useCallback((e) => {
    if (drawing && drawing.points.length >= 2) {
      onCommitPath?.({ ...drawing, path_id: `path_${Date.now()}`, stroke_width: 2.5 });
      setDrawing(null);
    }
  }, [drawing, onCommitPath]);

  // Global mouse up
  useEffect(() => {
    window.addEventListener('mouseup', handleSVGMouseUp);
    return () => window.removeEventListener('mouseup', handleSVGMouseUp);
  }, [handleSVGMouseUp]);

  // Yard lines
  const playableH = F.height - F.endZoneH * 2;
  const yardLines = Array.from({ length: 12 }, (_, i) =>
    F.endZoneH + (i * playableH) / 11
  );

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${F.width} ${F.height}`}
        className="w-full h-full"
        style={{
          cursor: activeTool === 'add_player' || isDrawTool ? 'crosshair'
                : activeTool === 'pan' ? 'grab'
                : 'default',
        }}
        onClick={handleSVGClick}
        onDoubleClick={handleSVGDblClick}
        onMouseMove={handleSVGMouseMove}
      >
        <Markers />

        {/* ── Field ── */}
        <rect width={F.width} height={F.height} fill="#1a5c2e" />

        {/* Alternating stripe */}
        {yardLines.map((y, i) => i % 2 === 0 && (
          <rect key={i} x={0} y={y} width={F.width}
            height={playableH / 11} fill="#174f27" opacity={0.5} />
        ))}

        {/* End zones */}
        <rect x={0} y={0} width={F.width} height={F.endZoneH} fill="#14532d" />
        <rect x={0} y={F.height - F.endZoneH} width={F.width} height={F.endZoneH} fill="#14532d" />

        {/* Sidelines */}
        <rect x={20} y={F.endZoneH} width={F.width - 40} height={playableH}
          fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />

        {/* Yard lines */}
        {yardLines.map((y, i) => (
          <line key={i} x1={20} y1={y} x2={F.width - 20} y2={y}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={i === 0 || i === 11 ? 2 : 1} />
        ))}

        {/* Hash marks */}
        {yardLines.slice(1, -1).map((y, i) => (
          <g key={i}>
            <line x1={F.hashLeft - 8} y1={y} x2={F.hashLeft + 8} y2={y}
              stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
            <line x1={F.hashRight - 8} y1={y} x2={F.hashRight + 8} y2={y}
              stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
          </g>
        ))}

        {/* LOS */}
        <line x1={20} y1={F.losY} x2={F.width - 20} y2={F.losY}
          stroke="rgba(96,165,250,0.7)" strokeWidth={2} strokeDasharray="10 5" />
        <text x={28} y={F.losY - 5} fill="rgba(96,165,250,0.7)" fontSize={9} fontFamily="monospace" fontWeight="bold">
          LOS
        </text>

        {/* ── Committed Paths ── */}
        {paths.map(path => {
          const s = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
          const d = buildD(path.points, path.curve_type);
          if (!d) return null;
          const isSelPath = selectedPathId === path.path_id;
          return (
            <g key={path.path_id} onClick={e => { e.stopPropagation(); onSelectPath?.(path.path_id); }}>
              {/* Wider invisible hit area */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: 'pointer' }} />
              <path
                d={d}
                fill="none"
                stroke={s.stroke}
                strokeWidth={isSelPath ? (path.stroke_width || 2.5) + 1 : (path.stroke_width || 2.5)}
                strokeDasharray={s.dash || undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arr-${path.path_type})`}
                opacity={isSelPath ? 1 : 0.88}
                filter={isSelPath ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : undefined}
              />
              {/* Control point handles when selected */}
              {isSelPath && path.points?.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={5}
                  fill={s.stroke} stroke="white" strokeWidth={1.5} opacity={0.9} />
              ))}
            </g>
          );
        })}

        {/* ── Drawing In Progress ── */}
        {drawing && drawing.points.length >= 1 && (
          <g>
            {drawing.points.length >= 2 && (
              <path d={buildD(drawing.points)} fill="none"
                stroke={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke}
                strokeWidth={2} strokeDasharray="6 3" opacity={0.7} />
            )}
            {/* Ghost line to cursor */}
            {drawing.points.length >= 1 && (
              <line
                x1={drawing.points[drawing.points.length - 1].x}
                y1={drawing.points[drawing.points.length - 1].y}
                x2={cursor.x} y2={cursor.y}
                stroke={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke}
                strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4} />
            )}
            {/* Point markers */}
            {drawing.points.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r={4}
                fill={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke} opacity={0.85} />
            ))}
          </g>
        )}

        {/* ── Annotations ── */}
        {annotations.map(ann => {
          if (ann.ann_type === 'text_label' || ann.ann_type === 'coaching_note') {
            return (
              <text key={ann.ann_id} x={ann.x} y={ann.y}
                fill="rgba(255,255,255,0.85)" fontSize={12} fontFamily="sans-serif"
                style={{ cursor: 'pointer', userSelect: 'none' }}>
                {ann.text}
              </text>
            );
          }
          if (ann.ann_type === 'zone_marker') {
            return (
              <rect key={ann.ann_id} x={ann.x - 35} y={ann.y - 25} width={70} height={50}
                fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.5)"
                strokeWidth={1} strokeDasharray="5 3" rx={4} style={{ cursor: 'pointer' }} />
            );
          }
          return null;
        })}

        {/* ── Players ── */}
        {players.map(player => {
          const isSel  = selectedPlayerId === player.token_id;
          const isHov  = hover === player.token_id;
          const fill   = getPlayerFill(player);
          const isDef  = player.team_side === 'defense';
          const shape  = player.visual_style?.shape || (isDef ? 'square' : 'circle');
          const r      = 14;

          return (
            <g key={player.token_id}
              transform={`translate(${player.x}, ${player.y})`}
              style={{ cursor: player.locked ? 'not-allowed' : 'grab' }}
              onMouseDown={e => {
                e.stopPropagation();
                if (activeTool === 'select' || !activeTool || activeTool === '') {
                  onSelectPlayer?.(player.token_id);
                  if (!player.locked) setDragging(player.token_id);
                }
              }}
              onMouseEnter={() => setHover(player.token_id)}
              onMouseLeave={() => setHover(null)}
              onClick={e => { e.stopPropagation(); onSelectPlayer?.(player.token_id); onSelectPath?.(null); }}
            >
              {/* Glow ring when selected */}
              {(isSel || isHov) && (
                <circle r={r + 7} fill="none"
                  stroke={isSel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSel ? 2 : 1}
                  strokeDasharray={isSel ? undefined : '3 2'} />
              )}

              {/* Body */}
              {shape === 'square' && (
                <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3}
                  fill={fill} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              )}
              {shape === 'triangle' && (
                <polygon points={`0,${-r} ${r},${r} ${-r},${r}`}
                  fill={fill} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              )}
              {shape !== 'square' && shape !== 'triangle' && (
                <circle r={r} fill={fill} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              )}

              {/* Lock icon */}
              {player.locked && (
                <text y={1} textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>🔒</text>
              )}

              {/* Label */}
              <text textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={player.locked ? 0 : 10}
                fontWeight="bold" fontFamily="monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {player.display_label || player.position_code || '?'}
              </text>

              {/* Jersey # below */}
              {player.jersey_number && !player.locked && (
                <text y={r + 9} textAnchor="middle"
                  fill="rgba(255,255,255,0.5)" fontSize={7} fontFamily="monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  #{player.jersey_number}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Ball ── */}
        <ellipse cx={F.width / 2} cy={F.losY}
          rx={11} ry={7} fill="#92400e" stroke="#fef3c7" strokeWidth={1.5} opacity={0.9} />
        <line x1={F.width / 2 - 8} y1={F.losY} x2={F.width / 2 + 8} y2={F.losY}
          stroke="#fef3c7" strokeWidth={0.7} opacity={0.5} />
      </svg>

      {/* Crosshair coords when drawing */}
      {isDrawTool && (
        <div className="absolute bottom-2 left-2 text-[9px] font-mono text-gray-500 pointer-events-none bg-gray-900/60 px-1 rounded">
          {cursor.x}, {cursor.y}
        </div>
      )}
    </div>
  );
}