import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

const FIELD_WIDTH = 720;
const FIELD_HEIGHT = 480;
const YARD_LINE_SPACING = FIELD_HEIGHT / 12;

const DEFAULT_OFFENSE = [
  { id: 'C', x: 360, y: 280, label: 'C', type: 'lineman' },
  { id: 'LG', x: 325, y: 280, label: 'LG', type: 'lineman' },
  { id: 'RG', x: 395, y: 280, label: 'RG', type: 'lineman' },
  { id: 'LT', x: 290, y: 280, label: 'LT', type: 'lineman' },
  { id: 'RT', x: 430, y: 280, label: 'RT', type: 'lineman' },
  { id: 'QB', x: 360, y: 320, label: 'QB', type: 'skill' },
  { id: 'RB', x: 360, y: 360, label: 'RB', type: 'skill' },
  { id: 'WR1', x: 140, y: 280, label: 'X', type: 'receiver' },
  { id: 'WR2', x: 580, y: 280, label: 'Z', type: 'receiver' },
  { id: 'WR3', x: 500, y: 280, label: 'H', type: 'receiver' },
  { id: 'TE', x: 465, y: 280, label: 'Y', type: 'receiver' },
];

export default function FootballField({ diagramData, onChange, side = 'offense' }) {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState(diagramData?.players || DEFAULT_OFFENSE);
  const [routes, setRoutes] = useState(diagramData?.routes || []);
  const [dragging, setDragging] = useState(null);
  const [drawingRoute, setDrawingRoute] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [tool, setTool] = useState('move'); // move, route, block

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    // Clear
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // Field background
    ctx.fillStyle = isDark ? '#1a2e1a' : '#2d5a27';
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // Yard lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const y = i * YARD_LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(FIELD_WIDTH - 40, y);
      ctx.stroke();
    }

    // Hash marks
    for (let i = 0; i <= 12; i++) {
      const y = i * YARD_LINE_SPACING;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      // Left hash
      ctx.beginPath();
      ctx.moveTo(270, y - 4);
      ctx.lineTo(270, y + 4);
      ctx.stroke();
      // Right hash
      ctx.beginPath();
      ctx.moveTo(450, y - 4);
      ctx.lineTo(450, y + 4);
      ctx.stroke();
    }

    // Sidelines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 0, FIELD_WIDTH - 70, FIELD_HEIGHT);

    // Line of scrimmage
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(35, 280);
    ctx.lineTo(FIELD_WIDTH - 35, 280);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw routes
    routes.forEach(route => {
      if (route.points.length < 2) return;
      ctx.strokeStyle = route.type === 'block' ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash(route.type === 'block' ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(route.points[0].x, route.points[0].y);
      route.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow at end
      if (route.points.length >= 2 && route.type !== 'block') {
        const last = route.points[route.points.length - 1];
        const prev = route.points[route.points.length - 2];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x - 10 * Math.cos(angle - 0.4), last.y - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(last.x - 10 * Math.cos(angle + 0.4), last.y - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw current route being drawn
    if (routePoints.length > 0) {
      ctx.strokeStyle = tool === 'block' ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash(tool === 'block' ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);
      routePoints.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw players
    players.forEach(player => {
      const r = player.type === 'lineman' ? 14 : 16;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(player.x + 1, player.y + 2, r, 0, Math.PI * 2);
      ctx.fill();

      // Player circle
      if (side === 'offense') {
        ctx.fillStyle = player.type === 'lineman' ? '#1e40af' : '#2563eb';
      } else {
        ctx.fillStyle = '#dc2626';
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.label, player.x, player.y);
    });
  }, [players, routes, routePoints, side, tool]);

  useEffect(() => { draw(); }, [draw]);

  // Observe dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [draw]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = FIELD_WIDTH / rect.width;
    const scaleY = FIELD_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findPlayer = (pos) => {
    return players.find(p => Math.hypot(p.x - pos.x, p.y - pos.y) < 20);
  };

  const handleMouseDown = (e) => {
    const pos = getCanvasPos(e);
    if (tool === 'move') {
      const player = findPlayer(pos);
      if (player) setDragging(player.id);
    } else if (tool === 'route' || tool === 'block') {
      const player = findPlayer(pos);
      if (player) {
        setDrawingRoute(player.id);
        setRoutePoints([{ x: player.x, y: player.y }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasPos(e);
    if (tool === 'move' && dragging) {
      setPlayers(prev => prev.map(p => p.id === dragging ? { ...p, x: pos.x, y: pos.y } : p));
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(null);
      emitChange();
    }
  };

  const handleClick = (e) => {
    if ((tool === 'route' || tool === 'block') && drawingRoute) {
      const pos = getCanvasPos(e);
      setRoutePoints(prev => [...prev, pos]);
    }
  };

  const handleDoubleClick = () => {
    if (drawingRoute && routePoints.length >= 2) {
      const newRoute = {
        playerId: drawingRoute,
        type: tool === 'block' ? 'block' : 'route',
        points: routePoints,
      };
      setRoutes(prev => [...prev, newRoute]);
      setDrawingRoute(null);
      setRoutePoints([]);
      emitChange([...routes, newRoute]);
    }
  };

  const emitChange = (newRoutes) => {
    if (onChange) {
      onChange({ players, routes: newRoutes || routes });
    }
  };

  const clearRoutes = () => {
    setRoutes([]);
    setRoutePoints([]);
    setDrawingRoute(null);
    if (onChange) onChange({ players, routes: [] });
  };

  const resetPositions = () => {
    setPlayers(DEFAULT_OFFENSE);
    setRoutes([]);
    setRoutePoints([]);
    if (onChange) onChange({ players: DEFAULT_OFFENSE, routes: [] });
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {['move', 'route', 'block'].map(t => (
          <button
            key={t}
            onClick={() => {
              setTool(t);
              setDrawingRoute(null);
              setRoutePoints([]);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
              tool === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t === 'move' ? '↕ Move' : t === 'route' ? '→ Route' : '⊞ Block'}
          </button>
        ))}
        <div className="h-5 w-px bg-border mx-1" />
        <button onClick={clearRoutes} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          Clear Routes
        </button>
        <button onClick={resetPositions} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-inner">
        <canvas
          ref={canvasRef}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
          className="w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        {tool === 'move' && 'Drag players to reposition them on the field.'}
        {tool === 'route' && 'Click a player to start, click to add waypoints, double-click to finish route.'}
        {tool === 'block' && 'Click a player to start, click to add blocking path, double-click to finish.'}
      </p>
    </div>
  );
}