import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

const FIELD = {
  width: 800, height: 520,
  hashLeft: 290, hashRight: 510,
  endZoneDepth: 44,
  losY: 290, // line of scrimmage Y
};

const PATH_STYLES = {
  run_path:       { stroke: '#f59e0b', dash: '' },
  pass_route:     { stroke: '#60a5fa', dash: '' },
  blocking_track: { stroke: '#fb923c', dash: '7,4' },
  pull_path:      { stroke: '#fb923c', dash: '4,3' },
  motion_path:    { stroke: '#a78bfa', dash: '10,5' },
  blitz_path:     { stroke: '#f87171', dash: '' },
  pursuit_path:   { stroke: '#f87171', dash: '5,4' },
  zone_drop:      { stroke: '#34d399', dash: '14,5' },
  contain_path:   { stroke: '#f87171', dash: '7,3' },
  ball_path:      { stroke: '#fde68a', dash: '' },
  fake_path:      { stroke: '#c084fc', dash: '5,4' },
};

const ROLE_COLORS = {
  ball_carrier: '#fbbf24', blocker: '#fb923c', receiver: '#60a5fa',
  lineman: '#94a3b8', defender: '#f87171', kicker: '#a78bfa',
  returner: '#34d399', other: '#e5e7eb',
};

function playerFill(player) {
  if (player.visual_style?.fill) return player.visual_style.fill;
  return ROLE_COLORS[player.role_type] || (player.team_side === 'defense' ? '#ef4444' : '#3b82f6');
}

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

function ArrowDefs() {
  return (
    <defs>
      {Object.entries(PATH_STYLES).map(([type, style]) => (
        <marker key={type} id={`arr-${type}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={style.stroke} />
        </marker>
      ))}
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

export default function FieldCanvas({
  players = [], paths = [], annotations = [],
  selectedId, selectedType, // 'player' | 'path' | null
  activeTool,
  animatedPositions = {}, // { token_id: {x,y} } during animation
  activePaths = new Set(),
  isAnimating = false,
  onSelectObject, // (id, type)
  onMovePlayer,
  onAddPlayer,
  onAddPath,
  onMovePath,
  onSelectAnnotation,
  fieldView = 'half_field', // half_field | full_field | red_zone | goal_line
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { id, type }
  const [drawingPath, setDrawingPath] = useState(null); // { pathType, points[] }
  const [hoverToken, setHoverToken] = useState(null);

  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: Math.round((clientX - rect.left) * scaleX), y: Math.round((clientY - rect.top) * scaleY) };
  }, []);

  // Draw tool type mapping
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

  const isDrawTool = activeTool && !!DRAW_TOOL_MAP[activeTool];

  const handleSVGClick = useCallback((e) => {
    if (dragging) return;
    const coords = getSVGCoords(e);

    if (activeTool === 'add_player') {
      const newId = `p_${Date.now()}`;
      onAddPlayer && onAddPlayer({
        token_id: newId, x: coords.x, y: coords.y,
        display_label: '?', position_code: '', team_side: 'offense',
        role_type: 'other', visual_style: {},
      });
      return;
    }

    if (isDrawTool) {
      const pathType = DRAW_TOOL_MAP[activeTool];
      if (!drawingPath) {
        setDrawingPath({ pathType, points: [coords], startedAt: Date.now() });
      } else {
        setDrawingPath(prev => ({ ...prev, points: [...prev.points, coords] }));
      }
      return;
    }

    if (activeTool === 'select' || !activeTool) {
      onSelectObject && onSelectObject(null, null);
    }
  }, [activeTool, dragging, drawingPath, getSVGCoords, isDrawTool, onAddPlayer, onSelectObject]);

  const handleSVGDblClick = useCallback(() => {
    if (drawingPath && drawingPath.points.length >= 2) {
      const newPath = {
        path_id: `path_${Date.now()}`,
        path_type: drawingPath.pathType,
        points: drawingPath.points,
        curve_type: 'straight',
        arrowhead: 'open',
        stroke_width: 2.5,
        anim_start_ms: 1000,
        anim_duration_ms: 1500,
      };
      onAddPath && onAddPath(newPath);
      setDrawingPath(null);
    }
  }, [drawingPath, onAddPath]);

  const handlePlayerMouseDown = useCallback((e, player) => {
    e.stopPropagation();
    if (player.locked) return;
    if (activeTool === 'select' || !activeTool) {
      onSelectObject && onSelectObject(player.token_id, 'player');
      setDragging({ id: player.token_id, type: 'player' });
    }
  }, [activeTool, onSelectObject]);

  const handlePathClick = useCallback((e, path) => {
    e.stopPropagation();
    if (activeTool === 'select' || !activeTool) {
      onSelectObject && onSelectObject(path.path_id, 'path');
    }
  }, [activeTool, onSelectObject]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const coords = getSVGCoords(e);
      if (dragging.type === 'player') onMovePlayer && onMovePlayer(dragging.id, coords.x, coords.y);
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, getSVGCoords, onMovePlayer]);

  // ── Field rendering ──────────────────────────────────────────────────────
  const numYardLines = 11;
  const playableH = FIELD.height - FIELD.endZoneDepth * 2;
  const yardLines = Array.from({ length: numYardLines + 2 }, (_, i) =>
    FIELD.endZoneDepth + (i * playableH) / (numYardLines + 1)
  );
  const yardNumbers = [40, 30, 20, 10, 20, 30, 40];

  const activeCursor = activeTool === 'add_player' || isDrawTool
    ? 'crosshair' : activeTool === 'pan' ? 'grab' : 'default';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FIELD.width} ${FIELD.height}`}
      className="w-full h-full select-none touch-none"
      style={{ cursor: dragging ? 'grabbing' : activeCursor }}
      onClick={handleSVGClick}
      onDoubleClick={handleSVGDblClick}
    >
      <ArrowDefs />

      {/* Field background */}
      <rect width={FIELD.width} height={FIELD.height} fill="#1a5c2e" />

      {/* Alternating yard stripes */}
      {yardLines.map((y, i) => i % 2 === 0 && (
        <rect key={i} x={0} y={y} width={FIELD.width}
          height={playableH / (numYardLines + 1)} fill="#174f27" opacity={0.5} />
      ))}

      {/* End zones */}
      <rect x={0} y={0} width={FIELD.width} height={FIELD.endZoneDepth} fill="#14532d" opacity={0.85} />
      <rect x={0} y={FIELD.height - FIELD.endZoneDepth} width={FIELD.width} height={FIELD.endZoneDepth} fill="#14532d" opacity={0.85} />

      {/* Yard lines */}
      {yardLines.map((y, i) => (
        <line key={i} x1={30} y1={y} x2={FIELD.width - 30} y2={y}
          stroke="rgba(255,255,255,0.2)" strokeWidth={i === 0 || i === yardLines.length - 1 ? 2 : 1} />
      ))}

      {/* Yard numbers */}
      {yardLines.slice(1, -1).map((y, i) => yardNumbers[i] && (
        <g key={i}>
          <text x={55} y={y + 4} textAnchor="middle" fill="rgba(255,255,255,0.25)"
            fontSize={11} fontFamily="monospace" fontWeight="bold">
            {yardNumbers[i]}
          </text>
          <text x={FIELD.width - 55} y={y + 4} textAnchor="middle" fill="rgba(255,255,255,0.25)"
            fontSize={11} fontFamily="monospace" fontWeight="bold">
            {yardNumbers[i]}
          </text>
        </g>
      ))}

      {/* Hash marks */}
      {yardLines.slice(1, -1).map((y, i) => (
        <g key={i}>
          <line x1={FIELD.hashLeft - 8} y1={y} x2={FIELD.hashLeft + 8} y2={y}
            stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
          <line x1={FIELD.hashRight - 8} y1={y} x2={FIELD.hashRight + 8} y2={y}
            stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
        </g>
      ))}

      {/* Sidelines */}
      <rect x={30} y={0} width={FIELD.width - 60} height={FIELD.height}
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />

      {/* Line of scrimmage */}
      <line x1={30} y1={FIELD.losY} x2={FIELD.width - 30} y2={FIELD.losY}
        stroke="rgba(255,220,50,0.6)" strokeWidth={2.5} strokeDasharray="10,6" />
      <text x={38} y={FIELD.losY - 5} fill="rgba(255,220,50,0.6)"
        fontSize={9} fontFamily="monospace" fontWeight="bold">LOS</text>

      {/* ── Paths ── */}
      {paths.map(path => {
        const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
        const d = buildPathD(path.points, path.curve_type);
        if (!d) return null;
        const isSelected = selectedId === path.path_id && selectedType === 'path';
        const isActive = activePaths.has(path.path_id);
        const opacity = isAnimating ? (isActive ? 1 : 0.25) : 1;

        return (
          <g key={path.path_id} onClick={e => handlePathClick(e, path)} style={{ cursor: 'pointer' }}>
            {/* Hit zone */}
            <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
            {/* Visible path */}
            <path
              d={d} fill="none"
              stroke={style.stroke}
              strokeWidth={isSelected ? (path.stroke_width || 2.5) + 1 : (path.stroke_width || 2.5)}
              strokeDasharray={path.line_style === 'dashed' ? '8,4' : style.dash || undefined}
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={path.arrowhead !== 'none' ? `url(#arr-${path.path_type})` : undefined}
              opacity={opacity}
              filter={isSelected ? 'url(#glow)' : undefined}
            />
            {/* Control points when selected */}
            {isSelected && path.points?.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r={5}
                fill="white" stroke={style.stroke} strokeWidth={2} opacity={0.9} />
            ))}
          </g>
        );
      })}

      {/* ── In-progress drawing path ── */}
      {drawingPath && drawingPath.points.length >= 1 && (
        <g>
          {drawingPath.points.length >= 2 && (
            <path
              d={buildPathD(drawingPath.points)}
              fill="none"
              stroke={(PATH_STYLES[drawingPath.pathType] || PATH_STYLES.pass_route).stroke}
              strokeWidth={2.5} strokeDasharray="8,4" opacity={0.8}
            />
          )}
          {drawingPath.points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={4}
              fill={(PATH_STYLES[drawingPath.pathType] || PATH_STYLES.pass_route).stroke} opacity={0.9} />
          ))}
          <text x={drawingPath.points.at(-1).x + 8} y={drawingPath.points.at(-1).y - 8}
            fill="white" fontSize={9} fontFamily="monospace" opacity={0.7}>
            dbl-click to finish
          </text>
        </g>
      )}

      {/* ── Annotations ── */}
      {annotations.map(ann => {
        if (ann.ann_type === 'text_label' || ann.ann_type === 'coaching_note') {
          return (
            <g key={ann.ann_id} className="cursor-pointer"
              onClick={e => { e.stopPropagation(); onSelectAnnotation?.(ann); }}>
              <rect x={ann.x - 2} y={ann.y - 12} width={(ann.text?.length || 4) * 7 + 8} height={16}
                fill="rgba(0,0,0,0.5)" rx={3} />
              <text x={ann.x + 2} y={ann.y} fill="rgba(255,255,255,0.9)"
                fontSize={11} fontFamily="sans-serif">{ann.text}</text>
            </g>
          );
        }
        if (ann.ann_type === 'zone_marker') {
          return (
            <rect key={ann.ann_id} x={ann.x - 35} y={ann.y - 25} width={70} height={50}
              fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.5)" strokeWidth={1.5}
              strokeDasharray="5,3" rx={6} className="cursor-pointer"
              onClick={e => { e.stopPropagation(); onSelectAnnotation?.(ann); }} />
          );
        }
        return null;
      })}

      {/* ── Players ── */}
      {players.map(player => {
        // Use animated position if available
        const animPos = animatedPositions[player.token_id];
        const px = animPos ? animPos.x : player.x;
        const py = animPos ? animPos.y : player.y;
        const isSelected = selectedId === player.token_id && selectedType === 'player';
        const isHover = hoverToken === player.token_id;
        const fill = playerFill(player);
        const isDefense = player.team_side === 'defense';
        const r = 14;

        return (
          <g key={player.token_id}
            transform={`translate(${px}, ${py})`}
            style={{ cursor: player.locked ? 'not-allowed' : activeTool === 'select' || !activeTool ? 'grab' : 'crosshair' }}
            onMouseDown={e => handlePlayerMouseDown(e, player)}
            onMouseEnter={() => setHoverToken(player.token_id)}
            onMouseLeave={() => setHoverToken(null)}
          >
            {/* Selection / hover ring */}
            {(isSelected || isHover) && (
              <circle r={r + 7} fill="none"
                stroke={isSelected ? 'white' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isSelected ? 2.5 : 1}
                strokeDasharray={isSelected ? '' : '4,2'}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
            )}

            {/* Trail circle during animation */}
            {isAnimating && animPos && (
              <circle r={r + 10} fill={fill} opacity={0.08} />
            )}

            {/* Player shape */}
            {isDefense ? (
              <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3}
                fill={fill} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
            ) : (
              <circle r={r} fill={fill} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
            )}

            {/* Label */}
            <text textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={9} fontWeight="bold" fontFamily="'Space Grotesk', monospace"
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {player.display_label || player.position_code || '?'}
            </text>

            {/* Jersey number */}
            {player.jersey_number && (
              <text y={r + 9} textAnchor="middle"
                fill="rgba(255,255,255,0.55)" fontSize={8} fontFamily="monospace"
                style={{ pointerEvents: 'none' }}>
                #{player.jersey_number}
              </text>
            )}

            {/* Lock badge */}
            {player.locked && (
              <text x={r - 2} y={-(r - 2)} textAnchor="middle"
                fill="rgba(250,204,21,0.8)" fontSize={8}>🔒</text>
            )}
          </g>
        );
      })}

      {/* ── Ball ── */}
      <ellipse cx={FIELD.width / 2} cy={FIELD.losY} rx={9} ry={5.5}
        fill="#b45309" stroke="#fef3c7" strokeWidth={1.5} opacity={0.9} />
    </svg>
  );
}