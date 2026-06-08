import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Tag, Clipboard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const PATH_COLORS = {
  run_path: '#f59e0b', pass_route: '#60a5fa', blocking_track: '#fb923c',
  pull_path: '#fb923c', motion_path: '#a78bfa', blitz_path: '#f87171',
  pursuit_path: '#f87171', zone_drop: '#34d399', contain_path: '#f87171',
  ball_path: '#fde68a', fake_path: '#c084fc',
};

function FullDiagramPreview({ diagramData }) {
  if (!diagramData?.players?.length) return (
    <div className="flex items-center justify-center h-48 bg-[#1a5c2e] rounded-xl text-white/30 text-xs">
      No diagram data
    </div>
  );

  const { players = [], paths = [], annotations = [] } = diagramData;
  const W = 400, H = 200;
  const scaleX = x => (x / 800) * W;
  const scaleY = y => (y / 500) * H;

  const playableH = H - 20;

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        {/* Field */}
        {[0, 1, 2, 3].map(i => (
          <rect key={i} x={0} y={i * 50} width={W} height={50} fill={i % 2 === 0 ? '#1a5c2e' : '#174f27'} />
        ))}
        {/* End zones */}
        <rect x={0} y={0} width={W} height={20} fill="#14532d" opacity={0.8} />
        <rect x={0} y={H - 20} width={W} height={20} fill="#14532d" opacity={0.8} />
        {/* LOS */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,100,0.4)" strokeWidth={1} strokeDasharray="6,3" />
        <text x={6} y={H / 2 - 3} fill="rgba(255,255,100,0.5)" fontSize={6} fontFamily="monospace">LOS</text>

        {/* Paths */}
        {paths.map((path, i) => {
          const color = PATH_COLORS[path.path_type] || '#fff';
          const pts = path.points || [];
          if (pts.length < 2) return null;
          const d = path.curve_type === 'curved' && pts.length >= 3
            ? (() => {
              let s = `M ${scaleX(pts[0].x)} ${scaleY(pts[0].y)}`;
              for (let j = 1; j < pts.length - 1; j++) {
                const cp = pts[j], end = pts[j + 1] || pts[j];
                s += ` Q ${scaleX(cp.x)} ${scaleY(cp.y)} ${scaleX(end.x)} ${scaleY(end.y)}`;
              }
              return s;
            })()
            : pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
          const style = { strokeDasharray: ['blitz_path','pursuit_path','zone_drop','contain_path','fake_path'].includes(path.path_type) ? '5,3' : undefined };
          return (
            <path key={i} d={d} fill="none" stroke={color}
              strokeWidth={path.path_type === 'ball_path' ? 2 : 1.5}
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={style.strokeDasharray}
              opacity={0.9} />
          );
        })}

        {/* Players */}
        {players.map((p, i) => {
          const x = scaleX(p.x), y = scaleY(p.y);
          const isD = p.team_side === 'defense';
          const fill = isD ? '#ef4444' : p.role_type === 'ball_carrier' ? '#fbbf24' :
            p.role_type === 'receiver' ? '#60a5fa' : p.role_type === 'kicker' ? '#a78bfa' : '#3b82f6';
          return (
            <g key={i}>
              {isD
                ? <rect x={x - 6} y={y - 6} width={12} height={12} rx={1.5} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                : <circle cx={x} cy={y} r={6} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
              }
              <text x={x} y={y + 0.8} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={4.5} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                {(p.display_label || '').slice(0, 2)}
              </text>
            </g>
          );
        })}

        {/* Annotations */}
        {annotations.map((ann, i) => (
          ann.ann_type === 'text_label' ? (
            <text key={i} x={scaleX(ann.x)} y={scaleY(ann.y)}
              fill="rgba(255,255,255,0.75)" fontSize={5.5} fontFamily="monospace">
              {ann.text}
            </text>
          ) : null
        ))}

        {/* Ball */}
        <ellipse cx={W / 2} cy={H / 2} rx={5} ry={3} fill="#b45309" stroke="#fef3c7" strokeWidth={0.8} opacity={0.85} />
      </svg>
    </div>
  );
}

export default function LibraryItemPreview({ item, onClose, onImport }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="font-display font-bold text-sm">Preview</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-lg">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name & meta */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-display font-bold text-base leading-tight">{item.item_name}</h2>
            {item.starter_recommended && (
              <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded shrink-0">⭐ STARTER</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.difficulty_level && (
              <Badge className={cn("text-[10px] border capitalize", DIFFICULTY_COLORS[item.difficulty_level])}>
                {item.difficulty_level}
              </Badge>
            )}
            {item.run_pass && item.run_pass !== 'n_a' && item.run_pass !== 'formation' && (
              <Badge variant="outline" className="text-[10px] capitalize">{item.run_pass}</Badge>
            )}
            {item.formation_name && (
              <Badge variant="outline" className="text-[10px]">{item.formation_name}</Badge>
            )}
            {item.personnel && (
              <Badge variant="outline" className="text-[10px]">{item.personnel}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{item.short_description}</p>
        </div>

        {/* Diagram */}
        <FullDiagramPreview diagramData={item.diagram_data} />

        {/* Coaching points */}
        {item.coaching_points && (
          <div className="border border-border rounded-xl p-3 bg-secondary/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clipboard className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold">Coaching Points</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.coaching_points}</p>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['System', item.system_family?.replace(/_/g, '-')],
            ['Concept', item.concept_family?.replace(/_/g, ' ')],
            ['Age Level', item.age_level],
            ['Direction', item.direction],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="border border-border rounded-lg p-2 bg-card">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
              <p className="font-semibold capitalize mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground">
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0">
        <Button onClick={onImport} className="w-full gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Import into My Playbook
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Creates an editable copy in your team workspace.
        </p>
      </div>
    </div>
  );
}