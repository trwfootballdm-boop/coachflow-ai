import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  MousePointer2, Route, Square, Zap, ArrowRight, Eraser,
  RotateCcw, Trash2, FlipHorizontal, Plus, Minus, Target
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 800;
const H = 520;
const LOS_Y = 300; // Line of scrimmage Y

const PATH_TYPES = [
  { id: 'route',    label: 'Route',    color: '#ef4444', dash: [],       arrow: true  },
  { id: 'block',    label: 'Block',    color: '#f59e0b', dash: [5,4],    arrow: false },
  { id: 'motion',   label: 'Motion',   color: '#8b5cf6', dash: [8,4],    arrow: true  },
  { id: 'blitz',    label: 'Blitz',    color: '#f97316', dash: [],       arrow: true  },
  { id: 'zone',     label: 'Zone',     color: '#22d3ee', dash: [6,6],    arrow: false },
  { id: 'pursuit',  label: 'Pursuit',  color: '#84cc16', dash: [],       arrow: true  },
  { id: 'ball',     label: 'Ball',     color: '#ffffff', dash: [3,3],    arrow: true  },
  { id: 'fake',     label: 'Fake',     color: '#ec4899', dash: [2,6],    arrow: true  },
];

const TOOLS = [
  { id: 'select',  label: 'Select',  icon: MousePointer2 },
  { id: 'route',   label: 'Route',   icon: Route },
  { id: 'block',   label: 'Block',   icon: Square },
  { id: 'motion',  label: 'Motion',  icon: ArrowRight },
  { id: 'blitz',   label: 'Blitz',   icon: Zap },
  { id: 'zone',    label: 'Zone',    icon: Target },
  { id: 'erase',   label: 'Erase',   icon: Eraser },
];

const DEFAULT_OFFENSE = [
  { id: 'C',   x: 400, y: LOS_Y, label: 'C',  type: 'lineman',  side: 'O' },
  { id: 'LG',  x: 360, y: LOS_Y, label: 'LG', type: 'lineman',  side: 'O' },
  { id: 'RG',  x: 440, y: LOS_Y, label: 'RG', type: 'lineman',  side: 'O' },
  { id: 'LT',  x: 320, y: LOS_Y, label: 'LT', type: 'lineman',  side: 'O' },
  { id: 'RT',  x: 480, y: LOS_Y, label: 'RT', type: 'lineman',  side: 'O' },
  { id: 'QB',  x: 400, y: LOS_Y + 40, label: 'QB', type: 'skill', side: 'O' },
  { id: 'RB',  x: 400, y: LOS_Y + 85, label: 'RB', type: 'skill', side: 'O' },
  { id: 'X',   x: 130, y: LOS_Y, label: 'X',  type: 'receiver', side: 'O' },
  { id: 'Z',   x: 640, y: LOS_Y, label: 'Z',  type: 'receiver', side: 'O' },
  { id: 'H',   x: 540, y: LOS_Y, label: 'H',  type: 'receiver', side: 'O' },
  { id: 'Y',   x: 520, y: LOS_Y, label: 'Y',  type: 'receiver', side: 'O' },
];

const PLAYER_COLORS = {
  offense: { lineman: '#1e3a8a', skill: '#1d4ed8', receiver: '#2563eb' },
  defense: { all: '#991b1b' },
};

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawArrow(ctx, from, to, color, size = 9) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - 0.42), to.y - size * Math.sin(angle - 0.42));
  ctx.lineTo(to.x - size * Math.cos(angle + 0.42), to.y - size * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
}

function drawPath(ctx, points, pathDef, isDark) {
  if (points.length < 2) return;
  ctx.strokeStyle = pathDef.color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(pathDef.dash);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Smooth curves using quadratic bezier for routes
  if (pathDef.id === 'route' && points.length >= 3) {
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  } else {
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  }

  ctx.stroke();
  ctx.setLineDash([]);

  if (pathDef.arrow && points.length >= 2) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    drawArrow(ctx, prev, last, pathDef.color);
  }
}

function drawPlayer(ctx, player, selected, isDark) {
  const r = player.type === 'lineman' ? 13 : 15;
  const isDefense = player.side === 'D';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(player.x + 1, player.y + 2, r, 0, Math.PI * 2);
  ctx.fill();

  // Body
  if (isDefense) {
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#fca5a5';
  } else {
    const colors = PLAYER_COLORS.offense;
    ctx.fillStyle = colors[player.type] || colors.skill;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  }

  ctx.lineWidth = selected ? 3 : 2;
  if (selected) ctx.strokeStyle = '#fbbf24';

  ctx.beginPath();
  if (isDefense) {
    // Defense: X shape or triangle
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  } else {
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Defense X marker
  if (isDefense) {
    ctx.strokeStyle = 'rgba(255,150,150,0.8)';
    ctx.lineWidth = 1.5;
    const s = 5;
    ctx.beginPath();
    ctx.moveTo(player.x - s, player.y - s); ctx.lineTo(player.x + s, player.y + s);
    ctx.moveTo(player.x + s, player.y - s); ctx.lineTo(player.x - s, player.y + s);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${player.type === 'lineman' ? 9 : 10}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.label, player.x, player.y + 0.5);
}

function drawField(ctx, isDark) {
  // Background
  ctx.fillStyle = isDark ? '#0f2010' : '#1a4d1a';
  ctx.fillRect(0, 0, W, H);

  // Field turf bands (alternating)
  const bandH = 40;
  for (let i = 0; i < H / bandH; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, i * bandH, W, bandH);
    }
  }

  // Yard lines
  const yardSpacing = H / 10;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = i * yardSpacing;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(W - 50, y);
    ctx.stroke();
  }

  // Hash marks
  const leftHash = W * 0.36;
  const rightHash = W * 0.64;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const y = i * yardSpacing;
    [[leftHash - 5, leftHash + 5], [rightHash - 5, rightHash + 5]].forEach(([x1, x2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y - 4);
      ctx.lineTo(x2, y - 4);
      ctx.stroke();
    });
  }

  // Sidelines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(48, 2, W - 96, H - 4);

  // Line of scrimmage
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(48, LOS_Y);
  ctx.lineTo(W - 48, LOS_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // LOS label
  ctx.fillStyle = 'rgba(59,130,246,0.7)';
  ctx.font = 'bold 8px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('LOS', 52, LOS_Y - 2);

  // Neutral zone
  ctx.fillStyle = isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.06)';
  ctx.fillRect(48, LOS_Y - 8, W - 96, 16);

  // Left/right hash labels
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)';
  ctx.font = '7px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('L', leftHash, H - 6);
  ctx.fillText('R', rightHash, H - 6);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FootballField({ diagramData, onChange, side = 'offense', readOnly = false }) {
  const canvasRef = useRef(null);

  const [players, setPlayers] = useState(() => diagramData?.players || DEFAULT_OFFENSE);
  const [paths, setPaths] = useState(() => diagramData?.paths || diagramData?.routes?.map(r => ({
    ...r, pathType: r.type === 'block' ? 'block' : 'route'
  })) || []);
  const [tool, setTool] = useState('select');
  const [pathType, setPathType] = useState('route');
  const [selected, setSelected] = useState(null); // player id
  const [dragging, setDragging] = useState(null);
  const [drawing, setDrawing] = useState(null); // player id we're drawing from
  const [currentPoints, setCurrentPoints] = useState([]);
  const [zoom, setZoom] = useState(1);

  const isDark = () => document.documentElement.classList.contains('dark');

  const activePath = PATH_TYPES.find(p => p.id === (tool !== 'select' && tool !== 'erase' ? tool : pathType)) || PATH_TYPES[0];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dark = isDark();

    ctx.clearRect(0, 0, W, H);
    drawField(ctx, dark);

    // Draw saved paths
    paths.forEach(path => {
      const def = PATH_TYPES.find(p => p.id === (path.pathType || path.type)) || PATH_TYPES[0];
      drawPath(ctx, path.points, def, dark);
    });

    // Draw current in-progress path
    if (currentPoints.length > 0 && drawing) {
      drawPath(ctx, currentPoints, activePath, dark);
    }

    // Draw players
    players.forEach(p => drawPlayer(ctx, p, p.id === selected, dark));
  }, [players, paths, currentPoints, selected, drawing, activePath]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [draw]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const findPlayer = (pos) => players.find(p => Math.hypot(p.x - pos.x, p.y - pos.y) < 18);
  const findPath = (pos) => {
    return paths.findIndex(path => {
      return path.points.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < 14);
    });
  };

  const emitChange = (newPlayers, newPaths) => {
    if (onChange) onChange({ players: newPlayers, paths: newPaths });
  };

  const handleMouseDown = (e) => {
    if (readOnly) return;
    const pos = getPos(e);

    if (tool === 'select') {
      const player = findPlayer(pos);
      if (player) {
        setSelected(player.id);
        setDragging(player.id);
      } else {
        setSelected(null);
      }
    } else if (tool === 'erase') {
      const idx = findPath(pos);
      if (idx >= 0) {
        const newPaths = paths.filter((_, i) => i !== idx);
        setPaths(newPaths);
        emitChange(players, newPaths);
      }
    } else {
      // Drawing a path — must start from a player
      const player = findPlayer(pos);
      if (player) {
        setDrawing(player.id);
        setCurrentPoints([{ x: player.x, y: player.y }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (readOnly) return;
    const pos = getPos(e);
    if (tool === 'select' && dragging) {
      setPlayers(prev => prev.map(p => p.id === dragging ? { ...p, x: pos.x, y: pos.y } : p));
    } else if (drawing && currentPoints.length > 0) {
      // Live preview: replace last preview point
      setCurrentPoints(prev => {
        const pts = prev.slice(0, -1);
        return [...pts, pos];
      });
    }
  };

  const handleMouseUp = (e) => {
    if (readOnly) return;
    if (dragging) {
      setDragging(null);
      emitChange(players, paths);
    }
  };

  const handleClick = (e) => {
    if (readOnly || !drawing) return;
    const pos = getPos(e);
    setCurrentPoints(prev => {
      if (prev.length === 0) return [pos];
      return [...prev, pos];
    });
  };

  const handleDblClick = (e) => {
    if (readOnly || !drawing || currentPoints.length < 2) return;
    const newPath = { playerId: drawing, pathType: tool, points: currentPoints };
    const newPaths = [...paths, newPath];
    setPaths(newPaths);
    setDrawing(null);
    setCurrentPoints([]);
    emitChange(players, newPaths);
  };

  const clearPaths = () => {
    setPaths([]);
    setCurrentPoints([]);
    setDrawing(null);
    emitChange(players, []);
  };

  const resetLayout = () => {
    setPlayers(DEFAULT_OFFENSE);
    setPaths([]);
    setCurrentPoints([]);
    setDrawing(null);
    setSelected(null);
    emitChange(DEFAULT_OFFENSE, []);
  };

  const flipHorizontal = () => {
    const newPlayers = players.map(p => ({ ...p, x: W - p.x }));
    const newPaths = paths.map(path => ({
      ...path,
      points: path.points.map(pt => ({ ...pt, x: W - pt.x })),
    }));
    setPlayers(newPlayers);
    setPaths(newPaths);
    emitChange(newPlayers, newPaths);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const newPlayers = players.filter(p => p.id !== selected);
    const newPaths = paths.filter(p => p.playerId !== selected);
    setPlayers(newPlayers);
    setPaths(newPaths);
    setSelected(null);
    emitChange(newPlayers, newPaths);
  };

  if (readOnly) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border shadow-inner">
        <canvas ref={canvasRef} width={W} height={H} className="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 flex-wrap bg-secondary/40 rounded-xl p-1.5">
        {/* Tool selector */}
        {TOOLS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTool(t.id); setDrawing(null); setCurrentPoints([]); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                tool === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )} title={t.label}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{t.label}</span>
            </button>
          );
        })}

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Path type selector (only when drawing) */}
        {['route','block','motion','blitz','zone'].map(pt => {
          const def = PATH_TYPES.find(p => p.id === pt);
          return (
            <button key={pt} onClick={() => { setPathType(pt); setTool(pt); setDrawing(null); setCurrentPoints([]); }}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold transition-all border",
                tool === pt ? "shadow-sm" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
              style={tool === pt ? { borderColor: def.color, color: def.color, background: def.color + '18' } : {}}
              title={def.label}>
              {def.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1">
          <button onClick={flipHorizontal} title="Flip horizontal"
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <FlipHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={clearPaths} title="Clear all paths"
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Eraser className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {selected && (
            <button onClick={deleteSelected} title="Delete selected"
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={resetLayout} title="Reset layout"
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-inner select-none">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={cn("w-full", tool === 'select' ? "cursor-default" : "cursor-crosshair")}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDblClick}
        />
        {/* Active tool indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 rounded-lg px-2 py-1">
          <div className="h-2 w-2 rounded-full" style={{ background: activePath.color }} />
          <span className="text-[10px] font-bold text-white capitalize">{tool}</span>
          {drawing && <span className="text-[9px] text-white/60">· dbl-click to finish</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        {PATH_TYPES.map(def => (
          <div key={def.id} className="flex items-center gap-1">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4"
                stroke={def.color} strokeWidth="2"
                strokeDasharray={def.dash.join(',')}/>
              {def.arrow && <polygon points="20,4 14,1 14,7" fill={def.color}/>}
            </svg>
            <span className="text-[9px] text-muted-foreground capitalize">{def.label}</span>
          </div>
        ))}
        <span className="text-[9px] text-muted-foreground ml-auto">
          {players.length} players · {paths.length} paths
        </span>
      </div>

      {/* Instructions */}
      <p className="text-[10px] text-muted-foreground px-1">
        {tool === 'select' && 'Click to select · drag to move players · delete key removes selected'}
        {tool === 'erase' && 'Click near a path to erase it'}
        {!['select','erase'].includes(tool) && 'Click a player to start · click waypoints · double-click to finish path'}
      </p>
    </div>
  );
}