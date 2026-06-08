import React, { useState } from 'react';
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAnimationEngine } from './useAnimationEngine';

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

function buildPathD(points, curveType = 'straight') {
  if (!points || points.length < 2) return '';
  if (curveType === 'curved' && points.length >= 3) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      d += ` Q ${points[i].x} ${points[i].y} ${(points[i + 1] || points[i]).x} ${(points[i + 1] || points[i]).y}`;
    }
    return d;
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// Static / animated diagram preview — used in PlayDetailPanel and DiagramTab
export default function DiagramPreview({ diagramJson, animationJson, interactive = false, showControls = true, compact = false }) {
  const players = diagramJson?.players || [];
  const paths = diagramJson?.paths || [];
  const annotations = diagramJson?.annotations || [];

  const [animFrame, setAnimFrame] = useState({ playerPositions: {}, activePaths: new Set() });
  const hasAnimation = !!animationJson?.events?.length;

  const { isPlaying, currentTime, totalDuration, play, pause, restart } = useAnimationEngine({
    players, paths, timeline: animationJson,
    onFrame: setAnimFrame,
  });

  const pct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getLOS = () => 290; // default LOS y

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a5c2e] rounded-xl flex flex-col">
      {/* SVG field */}
      <svg
        viewBox="0 0 800 520"
        className="w-full flex-1"
        style={{ display: 'block' }}
      >
        <defs>
          {Object.entries(PATH_STYLES).map(([type, s]) => (
            <marker key={type} id={`prv-arr-${type}`} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={s.stroke} />
            </marker>
          ))}
        </defs>

        {/* Field background */}
        <rect width={800} height={520} fill="#1a5c2e" />
        {/* Alternating stripes */}
        {Array.from({ length: 12 }, (_, i) => i % 2 === 0 && (
          <rect key={i} x={0} y={44 + i * 38.5} width={800} height={38.5} fill="#174f27" opacity={0.5} />
        ))}
        {/* End zones */}
        <rect x={0} y={0} width={800} height={44} fill="#14532d" opacity={0.85} />
        <rect x={0} y={476} width={800} height={44} fill="#14532d" opacity={0.85} />
        {/* Yard lines */}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={30} y1={44 + i * 38.5} x2={770} y2={44 + i * 38.5}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        ))}
        {/* Hashes */}
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i}>
            <line x1={282} y1={82 + i * 38.5} x2={298} y2={82 + i * 38.5} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
            <line x1={502} y1={82 + i * 38.5} x2={518} y2={82 + i * 38.5} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
          </g>
        ))}
        {/* Sidelines */}
        <rect x={30} y={0} width={740} height={520} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        {/* LOS */}
        <line x1={30} y1={getLOS()} x2={770} y2={getLOS()}
          stroke="rgba(255,220,50,0.5)" strokeWidth={2} strokeDasharray="8,5" />

        {/* Paths */}
        {paths.map(path => {
          const style = PATH_STYLES[path.path_type] || PATH_STYLES.pass_route;
          const d = buildPathD(path.points, path.curve_type);
          if (!d) return null;
          const isActive = animFrame.activePaths.has(path.path_id);
          const opacity = isPlaying ? (isActive ? 1 : 0.2) : 0.9;
          return (
            <path key={path.path_id} d={d} fill="none"
              stroke={style.stroke}
              strokeWidth={path.stroke_width || 2.5}
              strokeDasharray={path.line_style === 'dashed' ? '8,4' : style.dash || undefined}
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={`url(#prv-arr-${path.path_type})`}
              opacity={opacity}
            />
          );
        })}

        {/* Annotations */}
        {annotations.map(ann => ann.ann_type === 'text_label' ? (
          <text key={ann.ann_id} x={ann.x} y={ann.y}
            fill="rgba(255,255,255,0.8)" fontSize={compact ? 9 : 11} fontFamily="sans-serif">
            {ann.text}
          </text>
        ) : null)}

        {/* Players */}
        {players.map(player => {
          const animPos = animFrame.playerPositions[player.token_id];
          const px = animPos?.x ?? player.x;
          const py = animPos?.y ?? player.y;
          const fill = player.visual_style?.fill || ROLE_COLORS[player.role_type]
            || (player.team_side === 'defense' ? '#ef4444' : '#3b82f6');
          const isDefense = player.team_side === 'defense';
          const r = compact ? 11 : 13;
          return (
            <g key={player.token_id} transform={`translate(${px}, ${py})`}>
              {isDefense ? (
                <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={2}
                  fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
              ) : (
                <circle r={r} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
              )}
              <text textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={compact ? 7 : 8} fontWeight="bold" fontFamily="monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {player.display_label || player.position_code || '?'}
              </text>
            </g>
          );
        })}

        {/* Ball */}
        <ellipse cx={400} cy={getLOS()} rx={8} ry={5}
          fill="#b45309" stroke="#fef3c7" strokeWidth={1.5} opacity={0.9} />
      </svg>

      {/* Animation controls overlay */}
      {showControls && hasAnimation && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-black/60 rounded-lg px-2 py-1.5 backdrop-blur-sm">
          <button
            onClick={isPlaying ? pause : play}
            className="h-6 w-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          >
            {isPlaying ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white translate-x-px" />}
          </button>
          <button onClick={restart} className="h-6 w-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors shrink-0">
            <RotateCcw className="h-3 w-3 text-white/70" />
          </button>
          {/* Scrub bar */}
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative">
            <div className="h-full bg-white/70 rounded-full transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[9px] text-white/60 font-mono shrink-0">
            {(currentTime / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      {/* No diagram state */}
      {!players.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-emerald-800/50 text-xs font-mono">No diagram</p>
        </div>
      )}
    </div>
  );
}