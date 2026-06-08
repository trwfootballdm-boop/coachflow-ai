import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { getAnimatedState, getPathDrawProgress } from './AnimationEngine';

const FIELD = {
  width: 800,
  height: 500,
  endZoneDepth: 50,
  surfaceColor: '#1a5c2e',
  darkStripeColor: '#174f27',
  yardLineCount: 11,
  hashLeft: 280,
  hashRight: 520,
};

const PATH_STYLES = {
  run_path: { stroke: '#f59e0b' },
  pass_route: { stroke: '#60a5fa' },
  blocking_track: { stroke: '#fb923c', dash: [6, 3] },
  pull_path: { stroke: '#fb923c', dash: [4, 2] },
  motion_path: { stroke: '#a78bfa', dash: [8, 4] },
  blitz_path: { stroke: '#f87171' },
  pursuit_path: { stroke: '#f87171', dash: [4, 4] },
  zone_drop: { stroke: '#34d399', dash: [12, 4] },
  contain_path: { stroke: '#f87171', dash: [6, 2] },
  ball_path: { stroke: '#fde68a' },
  fake_path: { stroke: '#c084fc', dash: [4, 4] },
};

const ROLE_COLORS = {
  ball_carrier: '#fbbf24',
  blocker: '#fb923c',
  receiver: '#60a5fa',
  lineman: '#9ca3af',
  defender: '#f87171',
  kicker: '#a78bfa',
  returner: '#34d399',
  other: '#e5e7eb',
};

function getPlayerFill(player) {
  if (player.visual_style?.fill) return player.visual_style.fill;
  return ROLE_COLORS[player.role_type] || (player.team_side === 'defense' ? '#ef4444' : '#3b82f6');
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function setupHiDPICanvas(canvas, cssWidth, cssHeight, maxPixelRatio = 2) {
  const dpr = clamp(window.devicePixelRatio || 1, 1, maxPixelRatio);
  const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;

  return { ctx, dpr, cssWidth, cssHeight };
}

function createFieldCache(width, height) {
  const offscreen =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });

  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  const scaleX = width / FIELD.width;
  const scaleY = height / FIELD.height;
  const sx = (x) => x * scaleX;
  const sy = (y) => y * scaleY;

  ctx.fillStyle = FIELD.surfaceColor;
  ctx.fillRect(0, 0, width, height);

  const playableH = FIELD.height - FIELD.endZoneDepth * 2;
  const yardCount = FIELD.yardLineCount + 2;

  for (let i = 0; i < yardCount; i += 2) {
    const y = FIELD.endZoneDepth + (i * playableH) / (yardCount - 1);
    const h = playableH / (yardCount - 1);
    ctx.fillStyle = FIELD.darkStripeColor;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, sy(y), width, sy(h));
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#14532d';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0, 0, width, sy(FIELD.endZoneDepth));
  ctx.fillRect(0, sy(FIELD.height - FIELD.endZoneDepth), width, sy(FIELD.endZoneDepth));
  ctx.globalAlpha = 1;

  for (let i = 0; i < yardCount; i++) {
    const y = FIELD.endZoneDepth + (i * playableH) / (yardCount - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = i === 0 || i === yardCount - 1 ? Math.max(1, 2 * scaleY) : Math.max(1, scaleY);
    ctx.beginPath();
    ctx.moveTo(0, sy(y));
    ctx.lineTo(width, sy(y));
    ctx.stroke();

    if (i > 0 && i < yardCount - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = Math.max(1, 2 * scaleY);
      [FIELD.hashLeft, FIELD.hashRight].forEach((hx) => {
        ctx.beginPath();
        ctx.moveTo(sx(hx - 8), sy(y));
        ctx.lineTo(sx(hx + 8), sy(y));
        ctx.stroke();
      });
    }
  }

  const losY = FIELD.height / 2;
  ctx.strokeStyle = 'rgba(255,255,100,0.45)';
  ctx.lineWidth = Math.max(1, 2 * scaleY);
  ctx.setLineDash([sx(8), sx(5)]);
  ctx.beginPath();
  ctx.moveTo(0, sy(losY));
  ctx.lineTo(width, sy(losY));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,255,100,0.5)';
  ctx.font = `${Math.max(8, 10 * scaleY)}px monospace`;
  ctx.fillText('LOS', sx(8), sy(losY - 4));

  return offscreen;
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

function buildPartialPath(points, progress) {
  if (!points || points.length < 2) return null;

  const segments = [];
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ len, p0: points[i - 1], p1: points[i] });
    total += len;
  }

  const target = progress * total;
  const partial = [points[0]];
  let covered = 0;

  for (const seg of segments) {
    if (covered >= target) break;
    const remaining = target - covered;

    if (remaining >= seg.len) {
      partial.push(seg.p1);
      covered += seg.len;
    } else {
      const t = seg.len === 0 ? 0 : remaining / seg.len;
      partial.push({
        x: seg.p0.x + (seg.p1.x - seg.p0.x) * t,
        y: seg.p0.y + (seg.p1.y - seg.p0.y) * t,
      });
      covered = target;
    }
  }

  return partial;
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

export default function AnimationCanvas({
  players,
  paths,
  timeline,
  currentMs,
  mode = 'coach',
  selectedTokenId = null,
  selectedPathId = null,
  onSelectToken,
  onSelectPath,
  className,
}) {
  const canvasRef = useRef(null);
  const fieldCacheRef = useRef(null);
  const sizeRef = useRef({ width: FIELD.width, height: FIELD.height });

  const compiledPaths = useMemo(() => {
    return (paths || []).map((path) => ({
      ...path,
      _style: PATH_STYLES[path.path_type] || PATH_STYLES.pass_route,
    }));
  }, [paths]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const setup = setupHiDPICanvas(canvas, rect.width || FIELD.width, rect.height || FIELD.height);
    if (!setup) return;

    const { ctx, cssWidth, cssHeight } = setup;
    sizeRef.current = { width: cssWidth, height: cssHeight };

    const scaleX = cssWidth / FIELD.width;
    const scaleY = cssHeight / FIELD.height;
    const sx = (x) => x * scaleX;
    const sy = (y) => y * scaleY;

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const cached = fieldCacheRef.current;
    if (cached) {
      ctx.drawImage(cached, 0, 0, cssWidth, cssHeight);
    }

    const { positions, activePaths } = getAnimatedState(currentMs, players, compiledPaths, timeline);

    compiledPaths.forEach((path) => {
      const progress = getPathDrawProgress(path.path_id, currentMs, timeline);
      if (progress <= 0) return;

      const partialPoints = buildPartialPath(path.points || [], progress);
      if (!partialPoints || partialPoints.length < 2) return;

      const style = path._style;
      const selected = selectedPathId && path.path_id === selectedPathId;
      const primaryPath =
        path.path_type === 'pass_route' || path.path_type === 'run_path' || path.path_type === 'motion_path';

      ctx.globalAlpha = mode === 'player' ? (primaryPath ? 0.92 : 0.28) : 0.88;
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = selected ? Math.max(3, 3.5 * scaleY) : Math.max(2, (path.stroke_width || 2.5) * scaleY * 0.8);
      ctx.setLineDash((style.dash || []).map((n) => n * scaleX));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(sx(partialPoints[0].x), sy(partialPoints[0].y));
      partialPoints.slice(1).forEach((p) => ctx.lineTo(sx(p.x), sy(p.y)));
      ctx.stroke();

      if (selected) {
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(5, 6 * scaleY);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (progress >= 0.95 && partialPoints.length >= 2) {
        const last = partialPoints[partialPoints.length - 1];
        const prev = partialPoints[partialPoints.length - 2];
        drawArrow(
          ctx,
          { x: sx(prev.x), y: sy(prev.y) },
          { x: sx(last.x), y: sy(last.y) },
          style.stroke,
          Math.max(6, 8 * scaleX)
        );
      }
    });

    const ballPath = compiledPaths.find((p) => p.path_type === 'ball_path');
    const ballPos =
      ballPath && ballPath.token_id && positions[ballPath.token_id]
        ? positions[ballPath.token_id]
        : { x: FIELD.width / 2, y: FIELD.height / 2 };

    ctx.save();
    ctx.translate(sx(ballPos.x), sy(ballPos.y));
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = Math.max(1, 1.5 * scaleY);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.ellipse(0, 0, sx(10), sy(6), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;

    players.forEach((player) => {
      const pos = positions[player.token_id] || { x: player.x, y: player.y };
      const fill = getPlayerFill(player);
      const isDefense = player.team_side === 'defense';
      const selected = selectedTokenId && player.token_id === selectedTokenId;
      const active = activePaths.has(player.token_id);
      const r = sx(12);

      ctx.save();
      ctx.translate(sx(pos.x), sy(pos.y));

      if (active && mode === 'coach') {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
        glow.addColorStop(0, `${fill}55`);
        glow.addColorStop(1, `${fill}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      if (isDefense) {
        ctx.roundRect(-r + 1, -r + 2, r * 2, r * 2, r * 0.24);
      } else {
        ctx.ellipse(1, 2, r, r * 0.7, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.fillStyle = fill;
      ctx.strokeStyle = selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = selected ? Math.max(2, 2.5 * scaleY) : Math.max(1, 1.5 * scaleY);

      ctx.beginPath();
      if (isDefense) {
        ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.24);
      } else {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      if (selected) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = Math.max(4, 5 * scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, r + sx(4), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, 9 * scaleY)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label =
        mode === 'player' && player.jersey_number
          ? `#${player.jersey_number}`
          : player.display_label || player.position_code || '?';
      ctx.fillText(String(label).slice(0, 3), 0, 0);

      ctx.restore();
    });
  }, [players, compiledPaths, timeline, currentMs, mode, selectedTokenId, selectedPathId]);

  const handlePointerDown = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / FIELD.width;
      const scaleY = rect.height / FIELD.height;

      const x = (event.clientX - rect.left) / scaleX;
      const y = (event.clientY - rect.top) / scaleY;

      for (let i = players.length - 1; i >= 0; i--) {
        const p = players[i];
        const dx = x - p.x;
        const dy = y - p.y;
        if (Math.hypot(dx, dy) <= 16) {
          onSelectToken?.(p.token_id);
          onSelectPath?.(null);
          return;
        }
      }

      let bestPathId = null;
      let bestDistance = Infinity;

      for (const path of compiledPaths) {
        const pts = path.points || [];
        for (let i = 1; i < pts.length; i++) {
          const d = pointToSegmentDistance(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
          if (d < bestDistance) {
            bestDistance = d;
            bestPathId = path.path_id;
          }
        }
      }

      if (bestDistance <= 10) {
        onSelectPath?.(bestPathId);
        onSelectToken?.(null);
        return;
      }

      onSelectToken?.(null);
      onSelectPath?.(null);
    },
    [players, compiledPaths, onSelectToken, onSelectPath]
  );

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId = 0;
    let resizeQueued = false;

    const rebuildCache = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      fieldCacheRef.current = createFieldCache(width, height);
      render();
    };

    const ro = new ResizeObserver(() => {
      if (resizeQueued) return;
      resizeQueued = true;
      rafId = window.requestAnimationFrame(() => {
        resizeQueued = false;
        rebuildCache();
      });
    });

    ro.observe(canvas);

    rebuildCache();

    return () => {
      ro.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className || 'w-full h-full block touch-none'}
      onPointerDown={handlePointerDown}
      style={{ display: 'block' }}
    />
  );
}