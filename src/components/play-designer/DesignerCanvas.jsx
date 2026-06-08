import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Crosshair, Move, Plus, Route, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Field config ─────────────────────────────────────────────────────────────
const F = {
  width: 900,
  height: 540,
  hashLeft: 310,
  hashRight: 590,
  endZoneH: 55,
  losY: 290,
};

const FIELD_THEME = {
  workspace: "#0b1020",
  workspaceGlow: "rgba(59,130,246,0.08)",
  board: "#0f172a",
  boardBorder: "rgba(255,255,255,0.08)",
  turf: "#1d5b43",
  turfAlt: "#194f3b",
  endZone: "#163f32",
  line: "rgba(255,255,255,0.18)",
  lineStrong: "rgba(255,255,255,0.28)",
  hash: "rgba(255,255,255,0.28)",
  los: "rgba(96,165,250,0.85)",
  text: "rgba(255,255,255,0.82)",
  textMuted: "rgba(255,255,255,0.45)",
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
  ball_carrier: '#fbbf24',
  blocker: '#fb923c',
  receiver: '#60a5fa',
  lineman: '#64748b',
  defender: '#ef4444',
  kicker: '#a78bfa',
  returner: '#34d399',
  other: '#94a3b8',
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
        <marker
          key={type}
          id={`arr-${type}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L0,7 L8,3.5 z" fill={s.stroke} />
        </marker>
      ))}
    </defs>
  );
}

function HudChip({ icon: Icon, children, muted = false }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] backdrop-blur-xl",
        muted
          ? "border-white/10 bg-black/20 text-white/60"
          : "border-white/10 bg-black/35 text-white/85"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>{children}</span>
    </div>
  );
}

function getToolMeta(activeTool, isDrawTool) {
  if (activeTool === 'select' || !activeTool) {
    return {
      label: 'Select',
      hint: 'Drag players or select routes and objects.',
      icon: MousePointer2,
    };
  }

  if (activeTool === 'add_player') {
    return {
      label: 'Add Player',
      hint: 'Click anywhere on the field to place a new player token.',
      icon: Plus,
    };
  }

  if (activeTool === 'pan') {
    return {
      label: 'Pan',
      hint: 'Move around the canvas.',
      icon: Move,
    };
  }

  if (isDrawTool) {
    return {
      label: 'Route Tool',
      hint: 'Click to add points. Double-click to finish the path.',
      icon: Route,
    };
  }

  return {
    label: 'Canvas',
    hint: 'Interact with the field.',
    icon: Crosshair,
  };
}

// ─── DesignerCanvas ───────────────────────────────────────────────────────────
export default function DesignerCanvas({
  players = [],
  paths = [],
  annotations = [],
  selectedPlayerId,
  selectedPathId,
  activeTool,
  onSelectPlayer,
  onSelectPath,
  onMovePlayer,
  onAddPlayer,
  onCommitPath,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onDrawingChange,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(null);

  const toSVG = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: Math.round(((cx - rect.left) / rect.width) * F.width),
      y: Math.round(((cy - rect.top) / rect.height) * F.height),
    };
  }, []);

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

  useEffect(() => {
    onDrawingChange?.(drawing?.points.length || 0);
  }, [drawing, onDrawingChange]);

  const DRAW_TOOL_MAP = {
    draw_route: 'pass_route',
    draw_run: 'run_path',
    draw_block: 'blocking_track',
    draw_pull: 'pull_path',
    draw_motion: 'motion_path',
    draw_blitz: 'blitz_path',
    draw_zone: 'zone_drop',
    draw_contain: 'contain_path',
    draw_ball: 'ball_path',
    draw_fake: 'fake_path',
  };

  const isDrawTool = activeTool && DRAW_TOOL_MAP[activeTool];
  const toolMeta = getToolMeta(activeTool, isDrawTool);
  const ToolIcon = toolMeta.icon;

  const handleSVGMouseMove = useCallback((e) => {
    const coords = toSVG(e);
    setCursor(coords);

    if (dragging && activeTool === 'select') {
      const player = players.find((p) => p.token_id === dragging);
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
      setDrawing((prev) => {
        if (!prev) return { type: pathType, points: [coords] };
        return { ...prev, points: [...prev.points, coords] };
      });
      return;
    }

    onSelectPlayer?.(null);
    onSelectPath?.(null);
  }, [dragging, activeTool, isDrawTool, toSVG, onAddPlayer, onSelectPlayer, onSelectPath]);

  const handleSVGDblClick = useCallback(() => {
    if (drawing && drawing.points.length >= 2) {
      onCommitPath?.({
        ...drawing,
        path_id: `path_${Date.now()}`,
        stroke_width: 2.5,
      });
      setDrawing(null);
    }
  }, [drawing, onCommitPath]);

  useEffect(() => {
    window.addEventListener('mouseup', handleSVGMouseUp);
    return () => window.removeEventListener('mouseup', handleSVGMouseUp);
  }, [handleSVGMouseUp]);

  const playableH = F.height - F.endZoneH * 2;
  const yardLines = Array.from({ length: 12 }, (_, i) => F.endZoneH + (i * playableH) / 11);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at top, ${FIELD_THEME.workspaceGlow}, transparent 42%), ${FIELD_THEME.workspace}`,
        }}
      />

      <div className="absolute left-4 top-4 z-10 flex max-w-[60%] flex-wrap items-center gap-2">
        <HudChip icon={ToolIcon}>{toolMeta.label}</HudChip>
        <HudChip muted>{toolMeta.hint}</HudChip>
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <HudChip muted>Half Field</HudChip>
        <HudChip muted>{Math.round(zoom * 100)}%</HudChip>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        {isDrawTool ? (
          <>
            <HudChip muted>{cursor.x}, {cursor.y}</HudChip>
            <HudChip muted>{drawing?.points?.length || 0} pts</HudChip>
          </>
        ) : (
          <HudChip muted>{players.length} players · {paths.length} paths</HudChip>
        )}
      </div>

      <div className="flex h-full items-center justify-center p-5 md:p-6">
        <div
          className="relative aspect-[5/3] w-full max-w-[1240px] overflow-hidden rounded-[28px] border shadow-2xl"
          style={{
            borderColor: FIELD_THEME.boardBorder,
            background: FIELD_THEME.board,
            boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_35%)]" />

          <svg
            ref={svgRef}
            viewBox={`0 0 ${F.width} ${F.height}`}
            className="relative z-[1] h-full w-full"
            style={{
              cursor:
                activeTool === 'add_player' || isDrawTool
                  ? 'crosshair'
                  : activeTool === 'pan'
                  ? 'grab'
                  : 'default',
            }}
            onClick={handleSVGClick}
            onDoubleClick={handleSVGDblClick}
            onMouseMove={handleSVGMouseMove}
          >
            <Markers />

            {/* Field base */}
            <rect width={F.width} height={F.height} fill={FIELD_THEME.turf} />

            {/* Alternating turf bands */}
            {yardLines.map((y, i) =>
              i % 2 === 0 ? (
                <rect
                  key={i}
                  x={0}
                  y={y}
                  width={F.width}
                  height={playableH / 11}
                  fill={FIELD_THEME.turfAlt}
                  opacity={0.55}
                />
              ) : null
            )}

            {/* End zones */}
            <rect x={0} y={0} width={F.width} height={F.endZoneH} fill={FIELD_THEME.endZone} />
            <rect x={0} y={F.height - F.endZoneH} width={F.width} height={F.endZoneH} fill={FIELD_THEME.endZone} />

            {/* Outer playable area */}
            <rect
              x={20}
              y={F.endZoneH}
              width={F.width - 40}
              height={playableH}
              fill="none"
              stroke={FIELD_THEME.lineStrong}
              strokeWidth={2}
              rx={3}
            />

            {/* Yard lines */}
            {yardLines.map((y, i) => (
              <line
                key={i}
                x1={20}
                y1={y}
                x2={F.width - 20}
                y2={y}
                stroke={i === 0 || i === 11 ? FIELD_THEME.lineStrong : FIELD_THEME.line}
                strokeWidth={i === 0 || i === 11 ? 2 : 1}
              />
            ))}

            {/* Hash marks */}
            {yardLines.slice(1, -1).map((y, i) => (
              <g key={i}>
                <line
                  x1={F.hashLeft - 8}
                  y1={y}
                  x2={F.hashLeft + 8}
                  y2={y}
                  stroke={FIELD_THEME.hash}
                  strokeWidth={2}
                />
                <line
                  x1={F.hashRight - 8}
                  y1={y}
                  x2={F.hashRight + 8}
                  y2={y}
                  stroke={FIELD_THEME.hash}
                  strokeWidth={2}
                />
              </g>
            ))}

            {/* Line of scrimmage */}
            <line
              x1={20}
              y1={F.losY}
              x2={F.width - 20}
              y2={F.losY}
              stroke={FIELD_THEME.los}
              strokeWidth={2}
              strokeDasharray="10 5"
            />
            <text
              x={28}
              y={F.losY - 6}
              fill={FIELD_THEME.los}
              fontSize={9}
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.12em"
            >
              LOS
            </text>

            {/* Committed paths */}
            {paths.map((path) => {
              const s = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
              const d = buildD(path.points, path.curve_type);
              if (!d) return null;

              const isSelPath = selectedPathId === path.path_id;

              return (
                <g
                  key={path.path_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPath?.(path.path_id);
                    onSelectPlayer?.(null);
                  }}
                >
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }} />
                  <path
                    d={d}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={isSelPath ? (path.stroke_width || 2.5) + 1.25 : (path.stroke_width || 2.5)}
                    strokeDasharray={s.dash || undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={`url(#arr-${path.path_type})`}
                    opacity={isSelPath ? 1 : 0.92}
                    filter={isSelPath ? 'drop-shadow(0 0 8px rgba(255,255,255,0.22))' : undefined}
                  />
                  {isSelPath && path.points?.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={4.5}
                      fill={s.stroke}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              );
            })}

            {/* Drawing in progress */}
            {drawing && drawing.points.length >= 1 && (
              <g>
                {drawing.points.length >= 2 && (
                  <path
                    d={buildD(drawing.points)}
                    fill="none"
                    stroke={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke}
                    strokeWidth={2.25}
                    strokeDasharray="6 4"
                    opacity={0.78}
                  />
                )}

                <line
                  x1={drawing.points[drawing.points.length - 1].x}
                  y1={drawing.points[drawing.points.length - 1].y}
                  x2={cursor.x}
                  y2={cursor.y}
                  stroke={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />

                {drawing.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill={(PATH_STYLES[drawing.type] || PATH_STYLES.pass_route).stroke}
                    opacity={0.88}
                  />
                ))}
              </g>
            )}

            {/* Annotations */}
            {annotations.map((ann) => {
              if (ann.ann_type === 'text_label' || ann.ann_type === 'coaching_note') {
                return (
                  <text
                    key={ann.ann_id}
                    x={ann.x}
                    y={ann.y}
                    fill={FIELD_THEME.text}
                    fontSize={12}
                    fontFamily="sans-serif"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {ann.text}
                  </text>
                );
              }

              if (ann.ann_type === 'zone_marker') {
                return (
                  <rect
                    key={ann.ann_id}
                    x={ann.x - 35}
                    y={ann.y - 25}
                    width={70}
                    height={50}
                    fill="rgba(52,211,153,0.08)"
                    stroke="rgba(52,211,153,0.45)"
                    strokeWidth={1}
                    strokeDasharray="5 3"
                    rx={4}
                  />
                );
              }

              return null;
            })}

            {/* Players */}
            {players.map((player) => {
              const isSel = selectedPlayerId === player.token_id;
              const isHov = hover === player.token_id;
              const fill = getPlayerFill(player);
              const isDef = player.team_side === 'defense';
              const shape = player.visual_style?.shape || (isDef ? 'square' : 'circle');
              const r = 14;

              return (
                <g
                  key={player.token_id}
                  transform={`translate(${player.x}, ${player.y})`}
                  style={{ cursor: player.locked ? 'not-allowed' : 'grab' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'select' || !activeTool || activeTool === '') {
                      onSelectPlayer?.(player.token_id);
                      onSelectPath?.(null);
                      if (!player.locked) setDragging(player.token_id);
                    }
                  }}
                  onMouseEnter={() => setHover(player.token_id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlayer?.(player.token_id);
                    onSelectPath?.(null);
                  }}
                >
                  {(isSel || isHov) && (
                    <circle
                      r={r + 7}
                      fill="none"
                      stroke={isSel ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.28)'}
                      strokeWidth={isSel ? 2 : 1}
                      strokeDasharray={isSel ? undefined : '3 2'}
                    />
                  )}

                  {shape === 'square' && (
                    <rect
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      rx={4}
                      fill={fill}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={1.5}
                    />
                  )}

                  {shape === 'triangle' && (
                    <polygon
                      points={`0,${-r} ${r},${r} ${-r},${r}`}
                      fill={fill}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={1.5}
                    />
                  )}

                  {shape !== 'square' && shape !== 'triangle' && (
                    <circle
                      r={r}
                      fill={fill}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={1.5}
                    />
                  )}

                  {player.locked && (
                    <circle
                      cx={r - 1}
                      cy={-r + 1}
                      r={5.5}
                      fill="rgba(15,23,42,0.92)"
                      stroke="rgba(255,255,255,0.28)"
                      strokeWidth={1}
                    />
                  )}

                  {player.locked && (
                    <text
                      x={r - 1}
                      y={-r + 1.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.85)"
                      fontSize={6.5}
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      L
                    </text>
                  )}

                  {!player.locked && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {player.display_label || player.position_code || '?'}
                    </text>
                  )}

                  {player.jersey_number && !player.locked && (
                    <text
                      y={r + 10}
                      textAnchor="middle"
                      fill={FIELD_THEME.textMuted}
                      fontSize={7}
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      #{player.jersey_number}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Ball */}
            <ellipse
              cx={F.width / 2}
              cy={F.losY}
              rx={11}
              ry={7}
              fill="#8b4513"
              stroke="#f5e6c8"
              strokeWidth={1.5}
              opacity={0.92}
            />
            <line
              x1={F.width / 2 - 8}
              y1={F.losY}
              x2={F.width / 2 + 8}
              y2={F.losY}
              stroke="#f5e6c8"
              strokeWidth={0.8}
              opacity={0.55}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}