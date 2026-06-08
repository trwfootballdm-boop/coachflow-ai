import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  run_path:       { stroke: '#f59e0b' },
  pass_route:     { stroke: '#60a5fa' },
  blocking_track: { stroke: '#fb923c', dash: [6, 3] },
  pull_path:      { stroke: '#fb923c', dash: [4, 2] },
  motion_path:    { stroke: '#a78bfa', dash: [8, 4] },
  blitz_path:     { stroke: '#f87171' },
  pursuit_path:   { stroke: '#f87171', dash: [4, 4] },
  zone_drop:      { stroke: '#34d399', dash: [12, 4] },
  contain_path:   { stroke: '#f87171', dash: [6, 2] },
  ball_path:      { stroke: '#fde68a' },
  fake_path:      { stroke: '#c084fc', dash: [4, 4] },
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

function buildPartialPath(points, progress) {
  if (!points || points.length < 2) return null;
  const segments = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    segments.push({ len: Math.sqrt(dx * dx + dy * dy), p0: points[i - 1], p1: points[i] });
    total += segments[segments.length - 1].len;
  }
  const target = progress * total;
  let partial = [];
  let covered = 0;
  for (const seg of segments) {
    if (covered >= target) break;
    const remaining = target - covered;
    if (remaining >= seg.len) {
      partial.push(seg.p1);
      covered += seg.len;
    } else {
      const t = remaining / seg.len;
      partial.push({
        x: seg.p0.x + (seg.p1.x - seg.p0.x) * t,
        y: seg.p0.y + (seg.p1.y - seg.p0.y) * t,
      });
      covered = target;
    }
  }
  return [points[0], ...partial];
}

function drawArrow(ctx, from, to, color) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - 0.4), to.y - size * Math.sin(angle - 0.4));
  ctx.lineTo(to.x - size * Math.cos(angle + 0.4), to.y - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

function drawField(ctx) {
  const playableH = FIELD.height - FIELD.endZoneDepth * 2;
  const yardCount = FIELD.yardLineCount + 2;

  ctx.fillStyle = FIELD.surfaceColor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Alternating stripes
  for (let i = 0; i < yardCount; i += 2) {
    const y = FIELD.endZoneDepth + (i * playableH) / (yardCount - 1);
    const h = playableH / (yardCount - 1);
    ctx.fillStyle = FIELD.darkStripeColor;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, y, FIELD.width, h);
    ctx.globalAlpha = 1;
  }

  // End zones
  ctx.fillStyle = '#14532d';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0, 0, FIELD.width, FIELD.endZoneDepth);
  ctx.fillRect(0, FIELD.height - FIELD.endZoneDepth, FIELD.width, FIELD.endZoneDepth);
  ctx.globalAlpha = 1;

  // Yard lines
  for (let i = 0; i < yardCount; i++) {
    const y = FIELD.endZoneDepth + (i * playableH) / (yardCount - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = i === 0 || i === yardCount - 1 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();

    // Hash marks
    if (i > 0 && i < yardCount - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      [[FIELD.hashLeft], [FIELD.hashRight]].forEach(([hx]) => {
        ctx.beginPath();
        ctx.moveTo(hx - 8, y);
        ctx.lineTo(hx + 8, y);
        ctx.stroke();
      });
    }
  }

  // LOS
  const losY = FIELD.height / 2;
  ctx.strokeStyle = 'rgba(255,255,100,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(0, losY);
  ctx.lineTo(FIELD.width, losY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,100,0.5)';
  ctx.font = '10px monospace';
  ctx.fillText('LOS', 8, losY - 4);
}

export default function AnimationCanvas({ players, paths, timeline, currentMs, mode = 'coach' }) {
  const canvasRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);

    drawField(ctx);

    const { positions, activePaths } = getAnimatedState(currentMs, players, paths, timeline);

    // Draw paths (progressively revealed)
    paths.forEach(path => {
      const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
      const progress = getPathDrawProgress(path.path_id, currentMs, timeline);
      if (progress <= 0) return;

      const partialPoints = buildPartialPath(path.points || [], progress);
      if (!partialPoints || partialPoints.length < 2) return;

      const isActive = activePaths.has(path.path_id || path.token_id);
      ctx.globalAlpha = mode === 'player' ? (path.path_type === 'pass_route' || path.path_type === 'run_path' || path.path_type === 'motion_path' ? 0.9 : 0.3) : 0.85;
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = path.stroke_width || 2.5;
      ctx.setLineDash(style.dash || []);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(partialPoints[0].x, partialPoints[0].y);
      partialPoints.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Arrow at end of revealed portion
      if (progress >= 0.95 && partialPoints.length >= 2) {
        const last = partialPoints[partialPoints.length - 1];
        const prev = partialPoints[partialPoints.length - 2];
        drawArrow(ctx, prev, last, style.stroke);
      }
    });

    // Draw ball (football ellipse at LOS center or along ball_path)
    const ballPath = paths.find(p => p.path_type === 'ball_path');
    const ballPos = ballPath && positions[ballPath.token_id]
      ? positions[ballPath.token_id]
      : { x: FIELD.width / 2, y: FIELD.height / 2 };

    ctx.save();
    ctx.translate(ballPos.x, ballPos.y);
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;

    // Draw players at animated positions
    players.forEach(player => {
      const pos = positions[player.token_id] || { x: player.x, y: player.y };
      const fill = getPlayerFill(player);
      const isDefense = player.team_side === 'defense';
      const r = 12;

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Trail dot
      if (activePaths.has(player.token_id) && mode === 'coach') {
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      if (isDefense) {
        ctx.rect(-r + 1, -r + 2, r * 2, r * 2);
      } else {
        ctx.arc(1, 2, r, 0, Math.PI * 2);
      }
      ctx.fill();

      // Player body
      ctx.fillStyle = fill;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      if (isDefense) {
        ctx.beginPath();
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // In player mode, show jersey number prominently
      const label = mode === 'player' && player.jersey_number
        ? `#${player.jersey_number}`
        : (player.display_label || player.position_code || '?');
      ctx.fillText(label, 0, 0);

      ctx.restore();
    });

  }, [players, paths, timeline, currentMs, mode]);

  useEffect(() => { render(); }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD.width}
      height={FIELD.height}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}