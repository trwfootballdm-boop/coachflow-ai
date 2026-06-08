import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

const FIELD = {
  width: 800, height: 500,
  hashLeft: 280, hashRight: 520,
  endZoneDepth: 50,
  lineColor: 'rgba(255,255,255,0.22)',
  hashColor: 'rgba(255,255,255,0.32)',
  surfaceColor: '#1a5c2e',
  darkStripeColor: '#174f27',
};

const PATH_STYLES = {
  run_path:       { stroke: '#f59e0b', dashArray: '' },
  pass_route:     { stroke: '#60a5fa', dashArray: '' },
  blocking_track: { stroke: '#fb923c', dashArray: '6,3' },
  pull_path:      { stroke: '#fb923c', dashArray: '4,2' },
  motion_path:    { stroke: '#a78bfa', dashArray: '8,4' },
  blitz_path:     { stroke: '#f87171', dashArray: '' },
  pursuit_path:   { stroke: '#f87171', dashArray: '4,4' },
  zone_drop:      { stroke: '#34d399', dashArray: '12,4' },
  contain_path:   { stroke: '#f87171', dashArray: '6,2' },
  ball_path:      { stroke: '#fde68a', dashArray: '' },
  fake_path:      { stroke: '#c084fc', dashArray: '4,4' },
};

const ROLE_COLORS = {
  ball_carrier: '#fbbf24', blocker: '#fb923c', receiver: '#60a5fa',
  lineman: '#9ca3af', defender: '#f87171', kicker: '#a78bfa',
  returner: '#34d399', other: '#e5e7eb',
};

function evalPathAt(points, t) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  const totalSeg = points.length - 1;
  const segT = t * totalSeg;
  const seg = Math.floor(segT);
  const lt = segT - seg;
  const p1 = points[Math.min(seg, points.length - 1)];
  const p2 = points[Math.min(seg + 1, points.length - 1)];
  return { x: p1.x + (p2.x - p1.x) * lt, y: p1.y + (p2.y - p1.y) * lt };
}

function getPlayerFill(player) {
  if (player.visual_style?.fill) return player.visual_style.fill;
  return ROLE_COLORS[player.role_type] || (player.team_side === 'defense' ? '#ef4444' : '#3b82f6');
}

function drawArrow(ctx, from, to, color, size = 8) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - 0.4), to.y - size * Math.sin(angle - 0.4));
  ctx.lineTo(to.x - size * Math.cos(angle + 0.4), to.y - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

export default function AnimatedFieldCanvas({
  diagram,
  animatedPlayers,
  activeEvents = [],
  currentMs = 0,
  timeline,
  isPlaying,
  showTrails = true,
  showGhost = false,
  animMode = 'coach',
  showStaticPaths = true,
}) {
  const canvasRef = useRef(null);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / FIELD.width;
    const scaleY = H / FIELD.height;

    const sx = (x) => x * scaleX;
    const sy = (y) => y * scaleY;

    ctx.clearRect(0, 0, W, H);

    // ── Field ──────────────────────────────────────────────────────────────
    ctx.fillStyle = FIELD.surfaceColor;
    ctx.fillRect(0, 0, W, H);

    const playableH = FIELD.height - FIELD.endZoneDepth * 2;
    const yardLineCount = 11;
    const yardLines = Array.from({ length: yardLineCount + 2 }, (_, i) =>
      FIELD.endZoneDepth + (i * playableH) / (yardLineCount + 1)
    );

    // Alternating stripes
    yardLines.forEach((y, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = FIELD.darkStripeColor;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(0, sy(y), W, sy(playableH / (yardLineCount + 1)));
        ctx.globalAlpha = 1;
      }
    });

    // End zones
    ctx.fillStyle = '#14532d';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, W, sy(FIELD.endZoneDepth));
    ctx.fillRect(0, sy(FIELD.height - FIELD.endZoneDepth), W, sy(FIELD.endZoneDepth));
    ctx.globalAlpha = 1;

    // Yard lines
    yardLines.forEach((y, i) => {
      ctx.strokeStyle = FIELD.lineColor;
      ctx.lineWidth = i === 0 || i === yardLines.length - 1 ? 2 * scaleY : scaleY;
      ctx.beginPath();
      ctx.moveTo(0, sy(y));
      ctx.lineTo(W, sy(y));
      ctx.stroke();
    });

    // Hash marks
    yardLines.slice(1, -1).forEach(y => {
      ctx.strokeStyle = FIELD.hashColor;
      ctx.lineWidth = 2 * scaleY;
      [FIELD.hashLeft, FIELD.hashRight].forEach(hx => {
        ctx.beginPath();
        ctx.moveTo(sx(hx - 8), sy(y));
        ctx.lineTo(sx(hx + 8), sy(y));
        ctx.stroke();
      });
    });

    // LOS
    ctx.strokeStyle = 'rgba(255,255,100,0.45)';
    ctx.lineWidth = 2 * scaleY;
    ctx.setLineDash([sx(8), sx(6)]);
    ctx.beginPath();
    ctx.moveTo(0, sy(FIELD.height / 2));
    ctx.lineTo(W, sy(FIELD.height / 2));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,100,0.45)';
    ctx.font = `bold ${10 * scaleY}px monospace`;
    ctx.fillText('LOS', sx(8), sy(FIELD.height / 2 - 5));

    if (!diagram) return;

    const paths = diagram.paths || [];
    const players = diagram.players || [];
    const events = timeline?.events || [];

    // ── Static path fades (dim during animation, full when static) ─────────
    if (showStaticPaths) {
      const opacity = isPlaying ? 0.2 : 0.75;
      paths.forEach(path => {
        const pts = path.points;
        if (!pts || pts.length < 2) return;
        const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;

        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 2 * scaleY;
        ctx.globalAlpha = opacity;
        if (style.dashArray) {
          const parts = style.dashArray.split(',').map(n => parseFloat(n) * scaleX);
          ctx.setLineDash(parts);
        }
        ctx.beginPath();
        ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
        for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        if (!isPlaying) {
          const last = pts[pts.length - 1];
          const prev = pts[pts.length - 2];
          drawArrow(ctx,
            { x: sx(prev.x), y: sy(prev.y) },
            { x: sx(last.x), y: sy(last.y) },
            style.stroke
          );
        }
      });
    }

    // ── Animated path progress ────────────────────────────────────────────
    if (isPlaying || currentMs > 0) {
      paths.forEach(path => {
        const event = events.find(e => e.path_id === path.path_id && e.end_ms !== undefined);
        if (!event) return;
        const { time_ms: start, end_ms: end } = event;
        if (currentMs < start) return;

        const pts = path.points;
        if (!pts || pts.length < 2) return;
        const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
        const t = Math.min(1, (currentMs - start) / (end - start));

        // Draw progress portion
        const numPts = pts.length;
        const totalSeg = numPts - 1;
        const progressSeg = t * totalSeg;
        const fullSegs = Math.floor(progressSeg);
        const localT = progressSeg - fullSegs;

        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 2.5 * scaleY;
        ctx.globalAlpha = 0.92;
        if (style.dashArray) {
          const parts = style.dashArray.split(',').map(n => parseFloat(n) * scaleX);
          ctx.setLineDash(parts);
        }
        ctx.beginPath();
        ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
        for (let i = 1; i <= fullSegs && i < numPts; i++) {
          ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
        }
        if (fullSegs < totalSeg) {
          const p1 = pts[fullSegs];
          const p2 = pts[fullSegs + 1];
          ctx.lineTo(sx(p1.x + (p2.x - p1.x) * localT), sy(p1.y + (p2.y - p1.y) * localT));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Arrowhead at current progress end
        if (t >= 0.95 && pts.length >= 2) {
          const last = pts[pts.length - 1];
          const prev = pts[pts.length - 2];
          drawArrow(ctx,
            { x: sx(prev.x), y: sy(prev.y) },
            { x: sx(last.x), y: sy(last.y) },
            style.stroke
          );
        }

        // Trail glow at active tip
        if (showTrails && t < 1) {
          const tip = evalPathAt(pts, t);
          if (tip) {
            ctx.beginPath();
            const grad = ctx.createRadialGradient(sx(tip.x), sy(tip.y), 0, sx(tip.x), sy(tip.y), sx(10));
            grad.addColorStop(0, style.stroke + 'cc');
            grad.addColorStop(1, style.stroke + '00');
            ctx.fillStyle = grad;
            ctx.arc(sx(tip.x), sy(tip.y), sx(10), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }

    // ── Ghost end positions ───────────────────────────────────────────────
    if (showGhost) {
      players.forEach(player => {
        const playerPaths = paths.filter(p => p.token_id === player.token_id);
        playerPaths.forEach(path => {
          const pts = path.points;
          if (!pts || pts.length === 0) return;
          const endPt = pts[pts.length - 1];
          const fill = getPlayerFill(player);
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = fill;
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sx(endPt.x), sy(endPt.y), sx(11), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      });
    }

    // ── Player tokens ─────────────────────────────────────────────────────
    const displayPlayers = animatedPlayers || players;
    displayPlayers.forEach(player => {
      const px = sx(player.x);
      const py = sy(player.y);
      const r = sx(12);
      const fill = getPlayerFill(player);
      const isDefense = player.team_side === 'defense';
      const isActive = activeEvents.some(e => e.token_id === player.token_id);

      // Glow for active player
      if (isActive && isPlaying) {
        ctx.beginPath();
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 2);
        glow.addColorStop(0, fill + '55');
        glow.addColorStop(1, fill + '00');
        ctx.fillStyle = glow;
        ctx.arc(px, py, r * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(px + 1, py + 2, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = fill;
      ctx.strokeStyle = isActive && isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = isActive && isPlaying ? 2 : 1;
      ctx.beginPath();
      if (isDefense) {
        ctx.roundRect(px - r, py - r, r * 2, r * 2, r * 0.25);
      } else {
        ctx.arc(px, py, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      // Label
      const labelSize = Math.round(9 * scaleY);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, labelSize)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = animMode === 'player' && player.jersey_number
        ? `#${player.jersey_number}`
        : (player.display_label || player.position_code || '?');
      ctx.fillText(label.slice(0, 3), px, py);
    });

    // ── Ball ──────────────────────────────────────────────────────────────
    // Animate ball along ball_path if present
    const ballPath = paths.find(p => p.path_type === 'ball_path');
    let ballX = FIELD.width / 2;
    let ballY = FIELD.height / 2;

    if (ballPath && ballPath.points?.length > 0 && currentMs > 0) {
      const event = events.find(e => e.path_id === ballPath.path_id && e.end_ms !== undefined);
      if (event && currentMs >= event.time_ms) {
        const t = Math.min(1, (currentMs - event.time_ms) / (event.end_ms - event.time_ms));
        const pos = evalPathAt(ballPath.points, t);
        if (pos) { ballX = pos.x; ballY = pos.y; }
      }
    }

    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5 * scaleY;
    ctx.beginPath();
    ctx.ellipse(sx(ballX), sy(ballY), sx(9), sy(5.5), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ── Event marker flash ────────────────────────────────────────────────
    // Flash a snap marker at snap time
    const snapEvent = events.find(e => e.event_type === 'snap');
    if (snapEvent && Math.abs(currentMs - snapEvent.time_ms) < 120) {
      ctx.fillStyle = 'rgba(255,255,100,0.08)';
      ctx.fillRect(0, 0, W, H);
    }

  }, [diagram, animatedPlayers, activeEvents, currentMs, timeline, isPlaying, showTrails, showGhost, animMode, showStaticPaths]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ display: 'block' }}
    />
  );
}