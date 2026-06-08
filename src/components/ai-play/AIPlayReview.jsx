import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  RotateCcw, Trash2, Save, ExternalLink, CheckCircle,
  AlertCircle, ChevronDown, ChevronUp, Loader2, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Mini SVG diagram preview ─────────────────────────────────────────────────
function DiagramMiniPreview({ diagram }) {
  const W = 600, H = 340;
  const scaleX = v => (v / 900) * W;
  const scaleY = v => (v / 560) * H;
  const LOS_Y_SCALED = scaleY(290);

  const players = diagram?.players || [];
  const paths   = diagram?.paths   || [];

  const COLORS = {
    lineman: '#6b7280', ball_carrier: '#3b82f6', receiver: '#f59e0b',
    linebacker: '#ef4444', db: '#8b5cf6', kicker: '#10b981', other: '#9ca3af',
  };

  const pathColor = (type) => ({
    run: '#3b82f6', route: '#f59e0b', block: '#6b7280', pull: '#8b5cf6',
    motion: '#06b6d4', blitz: '#ef4444', contain: '#10b981',
    zone_drop: '#059669', ball: '#ffffff', fake: '#f97316',
  }[type] || '#6b7280');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%" height="100%"
      style={{ background: '#14532d', borderRadius: 8 }}
    >
      {/* Field stripes */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i}
          x={0} y={i * (H / 7)}
          width={W} height={H / 7}
          fill={i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent'}
        />
      ))}

      {/* LOS */}
      <line x1={0} y1={LOS_Y_SCALED} x2={W} y2={LOS_Y_SCALED}
        stroke="#fff" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4} />

      {/* Paths */}
      {paths.map((path, i) => {
        const pts = path.points || [];
        if (pts.length < 2) return null;
        const scaled = pts.map(p => `${scaleX(p.x)},${scaleY(p.y)}`);
        const d = `M ${scaled[0]} ` + scaled.slice(1).map(p => `L ${p}`).join(' ');
        const col = path.stroke_color || pathColor(path.path_type);
        return (
          <path key={i} d={d}
            fill="none"
            stroke={col}
            strokeWidth={path.stroke_width || 2}
            strokeDasharray={path.line_style === 'dashed' ? '5 3' : path.line_style === 'dotted' ? '2 3' : 'none'}
            opacity={0.85}
          />
        );
      })}

      {/* Players */}
      {players.map((p) => {
        const cx = scaleX(p.x), cy = scaleY(p.y);
        const col = COLORS[p.role_type] || '#6b7280';
        const isOff = p.team_side === 'offense';
        return (
          <g key={p.token_id}>
            {isOff
              ? <circle cx={cx} cy={cy} r={8} fill={col} opacity={0.9} />
              : <rect x={cx - 7} y={cy - 7} width={14} height={14} rx={2} fill={col} opacity={0.85} />
            }
            <text x={cx} y={cy + 3} textAnchor="middle"
              fontSize={6} fontWeight="bold" fill="#fff" fontFamily="monospace">
              {p.display_label?.slice(0, 2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Assumption pill ───────────────────────────────────────────────────────────
function AssumptionBadge({ text }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-amber-300/80">
      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}

// ── Main review component ─────────────────────────────────────────────────────
export default function AIPlayReview({ generated, isSaving, onSave, onRegenerate, onDiscard }) {
  const [edited, setEdited] = useState(() => JSON.parse(JSON.stringify(generated)));
  const [showAssignments, setShowAssignments] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

  const meta = edited?.play_meta || {};
  const assumptions = edited?.assumptions || [];
  const assignments = edited?.assignments || [];
  const tags = meta?.tags || [];

  const setMeta = (patch) => setEdited(e => ({ ...e, play_meta: { ...e.play_meta, ...patch } }));

  const sideColor = {
    offense: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    defense: 'bg-red-500/15 text-red-400 border-red-500/30',
    special_teams: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  }[meta.side] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              Draft Generated
            </span>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-bold border", sideColor)}>
            {meta.side === 'special_teams' ? 'SPECIAL TEAMS' : meta.side?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Diagram preview */}
        <div className="px-5 pt-4 pb-2">
          <div style={{ height: 200 }}>
            <DiagramMiniPreview diagram={edited?.diagram} />
          </div>
        </div>

        {/* Play name (editable) */}
        <div className="px-5 pt-3 pb-2">
          {editingName ? (
            <input
              ref={nameRef}
              value={meta.name}
              onChange={e => setMeta({ name: e.target.value, play_name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-white font-bold text-base focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 group"
            >
              <span className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {meta.name || 'Untitled Play'}
              </span>
              <Edit3 className="h-3.5 w-3.5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </button>
          )}
          <div className="flex items-center gap-2 mt-1">
            {meta.short_name && (
              <span className="text-[11px] text-gray-500 font-mono">{meta.short_name}</span>
            )}
            {meta.formation && (
              <span className="text-[11px] text-gray-500">· {meta.formation}</span>
            )}
            {meta.concept && (
              <span className="text-[11px] text-gray-500">· {meta.concept}</span>
            )}
          </div>
        </div>

        {/* Key info grid */}
        <div className="px-5 grid grid-cols-3 gap-2 pb-3">
          {[
            { label: 'Play Type', value: meta.play_type },
            { label: 'Family', value: meta.play_family },
            { label: 'Direction', value: meta.direction },
            { label: 'Personnel', value: meta.personnel },
            { label: 'Complexity', value: meta.risk_level },
            { label: 'Age Level', value: meta.age_level_difficulty },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="bg-gray-800/50 rounded-lg px-2.5 py-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-[12px] font-semibold text-gray-200 capitalize truncate mt-0.5">
                {String(item.value).replace(/_/g, ' ')}
              </p>
            </div>
          ))}
        </div>

        {/* Coaching points */}
        {meta.coaching_points && (
          <div className="px-5 pb-3">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-3.5 py-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Coaching Points</p>
              <p className="text-[12px] text-gray-300 leading-relaxed">{meta.coaching_points}</p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {edited?.diagram?.players?.length || 0} players
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {edited?.diagram?.paths?.length || 0} paths
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-500" />
              {assignments.length} assignments
            </span>
          </div>
        </div>

        {/* Assumptions */}
        {assumptions.length > 0 && (
          <div className="px-5 pb-3">
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-3.5 py-3 space-y-1.5">
              <p className="text-[10px] text-amber-500 uppercase tracking-wider font-bold mb-2">Assumptions Made</p>
              {assumptions.map((a, i) => <AssumptionBadge key={i} text={a} />)}
            </div>
          </div>
        )}

        {/* Assignments (collapsible) */}
        {assignments.length > 0 && (
          <div className="px-5 pb-3">
            <button
              onClick={() => setShowAssignments(v => !v)}
              className="w-full flex items-center justify-between py-2 text-[11px] font-bold text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span>Assignments ({assignments.length})</span>
              {showAssignments ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showAssignments && (
              <div className="space-y-1.5">
                {assignments.map((a, i) => (
                  <div key={i} className="bg-gray-800/40 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-gray-300 font-mono">{a.position_code}</span>
                      <span className="text-[10px] text-gray-600 capitalize">{a.assignment_type}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{a.assignment_text}</p>
                    {a.aiming_point && (
                      <p className="text-[10px] text-gray-600 mt-0.5">Aim: {a.aiming_point}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags (collapsible) */}
        {tags.length > 0 && (
          <div className="px-5 pb-4">
            <button
              onClick={() => setShowTags(v => !v)}
              className="w-full flex items-center justify-between py-2 text-[11px] font-bold text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span>Tags ({tags.length})</span>
              {showTags ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showTags && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-gray-800 space-y-2 shrink-0">
        {/* Primary CTA */}
        <Button
          className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 rounded-xl"
          disabled={isSaving}
          onClick={() => onSave(edited, 'designer')}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
          Open in Play Designer
        </Button>

        {/* Secondary row */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-8 text-[12px] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl gap-1.5"
            disabled={isSaving}
            onClick={() => onSave(edited, 'draft')}
          >
            <Save className="h-3 w-3" /> Save Draft
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-8 text-[12px] text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl gap-1.5"
            disabled={isSaving}
            onClick={onRegenerate}
          >
            <RotateCcw className="h-3 w-3" /> Regenerate
          </Button>
          <Button
            variant="ghost"
            className="h-8 w-8 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded-xl p-0"
            disabled={isSaving}
            onClick={onDiscard}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}