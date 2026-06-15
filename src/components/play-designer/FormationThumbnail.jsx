import React from 'react';
import { FIELD_W, FIELD_H } from '@/lib/formationHelpers';

/**
 * FormationThumbnail
 * Renders a small SVG preview of a formation's player positions.
 * Designed for grid cards in the Formation Library.
 *
 * Props:
 *   players: Array<{ token_id, x, y, team_side, position_code, display_label }>
 *   width, height: overall svg size (defaults 240x160)
 *   showLOS: render line of scrimmage
 *   showLabels: render position codes inside dots (skipped on tiny sizes)
 *   className: pass-through wrapper class
 */
export default function FormationThumbnail({
  players = [],
  width = 240,
  height = 160,
  showLOS = true,
  showLabels = true,
  className = '',
}) {
  const scaleX = (x) => (x / FIELD_W) * width;
  const scaleY = (y) => (y / FIELD_H) * height;

  const off = players.filter((p) => (p.team_side || 'offense') === 'offense');
  const ol = off.filter((p) =>
    /OL|^C$|^LG$|^RG$|^LT$|^RT$|^G$|^T$/i.test(p.position_code || p.position || '')
  );
  const losY = ol.length
    ? ol.reduce((s, p) => s + p.y, 0) / ol.length
    : FIELD_H / 2;

  const dotR = Math.max(4, Math.min(8, width / 36));
  const fontSize = Math.max(6, dotR - 1);
  const showText = showLabels && dotR >= 6;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    >
      {/* Field background */}
      <rect width={width} height={height} fill="hsl(148 22% 13%)" rx={4} />

      {/* Hash marks */}
      <line
        x1={scaleX(FIELD_W * 0.3)} y1={0}
        x2={scaleX(FIELD_W * 0.3)} y2={height}
        stroke="hsl(148 12% 22%)" strokeWidth={0.5}
      />
      <line
        x1={scaleX(FIELD_W * 0.7)} y1={0}
        x2={scaleX(FIELD_W * 0.7)} y2={height}
        stroke="hsl(148 12% 22%)" strokeWidth={0.5}
      />

      {/* Line of scrimmage */}
      {showLOS && (
        <line
          x1={0} y1={scaleY(losY)}
          x2={width} y2={scaleY(losY)}
          stroke="hsl(42 48% 52% / 0.5)" strokeWidth={1} strokeDasharray="4 3"
        />
      )}

      {/* Players */}
      {players.map((p) => {
        const isOffense = (p.team_side || 'offense') === 'offense';
        const cx = scaleX(p.x);
        const cy = scaleY(p.y);
        const label = p.position_code || p.position || '';
        return (
          <g key={p.token_id || `${p.x}-${p.y}`}>
            <circle
              cx={cx} cy={cy} r={dotR}
              fill={isOffense ? 'hsl(148 36% 38%)' : 'hsl(0 58% 48%)'}
              stroke={isOffense ? 'hsl(148 36% 55%)' : 'hsl(0 58% 62%)'}
              strokeWidth={0.75}
            />
            {showText && label && (
              <text
                x={cx} y={cy + fontSize * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fill="white"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {label.slice(0, 2)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}