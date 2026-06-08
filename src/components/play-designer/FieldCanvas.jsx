import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

// ─── Field dimensions (logical units, rendered into SVG viewBox) ──────────────
const FIELD = {
  width: 800,
  height: 500,
  yardLineCount: 11,    // 10-yard increments shown
  hashLeft: 280,
  hashRight: 520,
  endZoneDepth: 50,
  lineColor: 'rgba(255,255,255,0.25)',
  hashColor: 'rgba(255,255,255,0.35)',
  surfaceColor: '#1a5c2e',
  darkStripeColor: '#174f27',
};

const PATH_STYLES = {
  run_path:       { stroke: '#f59e0b', strokeDasharray: 'none' },
  pass_route:     { stroke: '#60a5fa', strokeDasharray: 'none' },
  blocking_track: { stroke: '#fb923c', strokeDasharray: '6,3' },
  pull_path:      { stroke: '#fb923c', strokeDasharray: '4,2' },
  motion_path:    { stroke: '#a78bfa', strokeDasharray: '8,4' },
  blitz_path:     { stroke: '#f87171', strokeDasharray: 'none' },
  pursuit_path:   { stroke: '#f87171', strokeDasharray: '4,4' },
  zone_drop:      { stroke: '#34d399', strokeDasharray: '12,4' },
  contain_path:   { stroke: '#f87171', strokeDasharray: '6,2' },
  ball_path:      { stroke: '#fde68a', strokeDasharray: 'none' },
  fake_path:      { stroke: '#c084fc', strokeDasharray: '4,4' },
};

const ROLE_COLORS = {
  ball_carrier: '#fbbf24',
  blocker:      '#fb923c',
  receiver:     '#60a5fa',
  lineman:      '#9ca3af',
  defender:     '#f87171',
  kicker:       '#a78bfa',
  returner:     '#34d399',
  other:        '#e5e7eb',
};

function playerFill(player) {
  if (player.visual_style?.fill) return player.visual_style.fill;
  return ROLE_COLORS[player.role_type] || (player.team_side === 'defense' ? '#ef4444' : '#3b82f6');
}

// ─── SVG path from points array ──────────────────────────────────────────────
function buildPathD(points, curveType = 'straight') {
  if (!points || points.length < 2) return '';
  if (curveType === 'curved' && points.length >= 3) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const cp = points[i];
      const end = points[i + 1] || points[i];
      d += ` Q ${cp.x} ${cp.y} ${end.x} ${end.y}`;
    }
    return d;
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// ─── Arrowhead marker defs ────────────────────────────────────────────────────
function ArrowDefs() {
  const arrowTypes = Object.entries(PATH_STYLES);
  return (
    <defs>
      {arrowTypes.map(([type, style]) => (
        <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={style.stroke} />
        </marker>
      ))}
      <marker id="arrow-flat" markerWidth="8" markerHeight="4" refX="0" refY="2" orient="auto">
        <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="2" />
      </marker>
    </defs>
  );
}

// ─── Main field canvas ────────────────────────────────────────────────────────
export default function FieldCanvas({
  players = [],
  paths = [],
  annotations = [],
  selectedId,
  activeTool,
  onSelectPlayer,
  onMovePlayer,
  onAddPlayer,
  onAddPath,
  onSelectAnnotation,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [drawingPath, setDrawingPath] = useState(null); // {type, points[]}
  const [hoverPlayer, setHoverPlayer] = useState(null);

  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }, []);

  const handleSVGClick = useCallback((e) => {
    if (dragging) return;
    const coords = getSVGCoords(e);

    if (activeTool === 'add_player') {
      onAddPlayer && onAddPlayer(coords);
      return;
    }

    if (['draw_route', 'draw_block', 'draw_motion', 'draw_blitz', 'draw_zone'].includes(activeTool)) {
      if (!drawingPath) {
        const typeMap = {
          draw_route: 'pass_route',
          draw_block: 'blocking_track',
          draw_motion: 'motion_path',
          draw_blitz: 'blitz_path',
          draw_zone: 'zone_drop',
        };
        setDrawingPath({ type: typeMap[activeTool], points: [coords] });
      } else {
        const updated = { ...drawingPath, points: [...drawingPath.points, coords] };
        setDrawingPath(updated);
      }
      return;
    }

    // deselect
    onSelectPlayer && onSelectPlayer(null);
  }, [activeTool, dragging, drawingPath, getSVGCoords, onAddPlayer, onSelectPlayer]);

  const handleSVGDblClick = useCallback((e) => {
    if (drawingPath && drawingPath.points.length >= 2) {
      onAddPath && onAddPath(drawingPath);
      setDrawingPath(null);
    }
  }, [drawingPath, onAddPath]);

  const handlePlayerMouseDown = useCallback((e, player) => {
    e.stopPropagation();
    if (activeTool === 'select' || !activeTool) {
      onSelectPlayer && onSelectPlayer(player.token_id);
      setDragging({ id: player.token_id, startX: player.x, startY: player.y });
    }
  }, [activeTool, onSelectPlayer]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const coords = getSVGCoords(e);
      onMovePlayer && onMovePlayer(dragging.id, coords.x, coords.y);
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, getSVGCoords, onMovePlayer]);

  // Yard line Y positions (top=endzone, playable from endZoneDepth to height-endZoneDepth)
  const playableH = FIELD.height - FIELD.endZoneDepth * 2;
  const yardLines = Array.from({ length: FIELD.yardLineCount + 2 }, (_, i) => {
    return FIELD.endZoneDepth + (i * playableH) / (FIELD.yardLineCount + 1);
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FIELD.width} ${FIELD.height}`}
      className="w-full h-full select-none"
      style={{ cursor: activeTool === 'add_player' ? 'crosshair' : activeTool?.startsWith('draw') ? 'crosshair' : 'default' }}
      onClick={handleSVGClick}
      onDoubleClick={handleSVGDblClick}
    >
      <ArrowDefs />

      {/* Field surface with alternating stripes */}
      <rect width={FIELD.width} height={FIELD.height} fill={FIELD.surfaceColor} />
      {yardLines.map((y, i) => i % 2 === 0 && (
        <rect key={i} x={0} y={y} width={FIELD.width}
          height={(playableH) / (FIELD.yardLineCount + 1)}
          fill={FIELD.darkStripeColor} opacity={0.4} />
      ))}

      {/* End zones */}
      <rect x={0} y={0} width={FIELD.width} height={FIELD.endZoneDepth} fill="#14532d" opacity={0.8} />
      <rect x={0} y={FIELD.height - FIELD.endZoneDepth} width={FIELD.width} height={FIELD.endZoneDepth} fill="#14532d" opacity={0.8} />

      {/* Yard lines */}
      {yardLines.map((y, i) => (
        <line key={i} x1={0} y1={y} x2={FIELD.width} y2={y}
          stroke={FIELD.lineColor} strokeWidth={i === 0 || i === yardLines.length - 1 ? 2 : 1} />
      ))}

      {/* Hash marks */}
      {yardLines.slice(1, -1).map((y, i) => (
        <g key={i}>
          <line x1={FIELD.hashLeft - 8} y1={y} x2={FIELD.hashLeft + 8} y2={y} stroke={FIELD.hashColor} strokeWidth={2} />
          <line x1={FIELD.hashRight - 8} y1={y} x2={FIELD.hashRight + 8} y2={y} stroke={FIELD.hashColor} strokeWidth={2} />
        </g>
      ))}

      {/* LOS marker */}
      <line x1={0} y1={FIELD.height / 2} x2={FIELD.width} y2={FIELD.height / 2}
        stroke="rgba(255,255,100,0.5)" strokeWidth={2} strokeDasharray="8,4" />
      <text x={8} y={FIELD.height / 2 - 4} fill="rgba(255,255,100,0.6)" fontSize={10} fontFamily="monospace">LOS</text>

      {/* Paths */}
      {paths.map(path => {
        const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
        const d = buildPathD(path.points, path.curve_type);
        if (!d) return null;
        return (
          <path
            key={path.path_id}
            d={d}
            fill="none"
            stroke={style.stroke}
            strokeWidth={path.stroke_width || 2.5}
            strokeDasharray={style.strokeDasharray !== 'none' ? style.strokeDasharray : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#arrow-${path.path_type})`}
            opacity={0.9}
          />
        );
      })}

      {/* Drawing-in-progress path */}
      {drawingPath && drawingPath.points.length >= 1 && (
        <g>
          {drawingPath.points.length >= 2 && (
            <path
              d={buildPathD(drawingPath.points)}
              fill="none"
              stroke={(PATH_STYLES[drawingPath.type] || PATH_STYLES.pass_route).stroke}
              strokeWidth={2}
              strokeDasharray="6,3"
              opacity={0.7}
            />
          )}
          {drawingPath.points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={4}
              fill={(PATH_STYLES[drawingPath.type] || PATH_STYLES.pass_route).stroke}
              opacity={0.8}
            />
          ))}
        </g>
      )}

      {/* Annotations */}
      {annotations.map(ann => (
        ann.ann_type === 'text_label' || ann.ann_type === 'coaching_note' ? (
          <text key={ann.ann_id} x={ann.x} y={ann.y}
            fill="rgba(255,255,255,0.85)" fontSize={12} fontFamily="sans-serif"
            className="cursor-pointer" onClick={e => { e.stopPropagation(); onSelectAnnotation?.(ann); }}>
            {ann.text}
          </text>
        ) : ann.ann_type === 'zone_marker' ? (
          <rect key={ann.ann_id} x={ann.x - 30} y={ann.y - 20} width={60} height={40}
            fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.5)" strokeWidth={1} strokeDasharray="4,2" rx={4}
            className="cursor-pointer" onClick={e => { e.stopPropagation(); onSelectAnnotation?.(ann); }} />
        ) : null
      ))}

      {/* Players */}
      {players.map(player => {
        const isSelected = selectedId === player.token_id;
        const isHover = hoverPlayer === player.token_id;
        const fill = playerFill(player);
        const isDefense = player.team_side === 'defense';

        return (
          <g key={player.token_id}
            transform={`translate(${player.x}, ${player.y})`}
            style={{ cursor: activeTool === 'select' || !activeTool ? 'grab' : 'default' }}
            onMouseDown={e => handlePlayerMouseDown(e, player)}
            onMouseEnter={() => setHoverPlayer(player.token_id)}
            onMouseLeave={() => setHoverPlayer(null)}
          >
            {/* Selection ring */}
            {(isSelected || isHover) && (
              <circle r={18} fill="none" stroke="white" strokeWidth={isSelected ? 2.5 : 1}
                opacity={isSelected ? 0.9 : 0.4} strokeDasharray={isSelected ? 'none' : '4,2'} />
            )}

            {/* Player shape */}
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
              {player.display_label || player.position_code || '?'}
            </text>

            {/* Jersey number below */}
            {player.jersey_number && (
              <text y={18} textAnchor="middle"
                fill="rgba(255,255,255,0.6)" fontSize={8} fontFamily="monospace"
                style={{ pointerEvents: 'none' }}>
                #{player.jersey_number}
              </text>
            )}
          </g>
        );
      })}

      {/* Ball marker at LOS center */}
      <ellipse cx={FIELD.width / 2} cy={FIELD.height / 2} rx={10} ry={6}
        fill="#b45309" stroke="#fef3c7" strokeWidth={1.5} opacity={0.85} />
    </svg>
  );
}