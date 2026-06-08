import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const PATH_TYPES = [
  { value: 'pass_route',     label: 'Pass Route',      color: '#60a5fa' },
  { value: 'run_path',       label: 'Run Path',        color: '#f59e0b' },
  { value: 'blocking_track', label: 'Block Path',      color: '#fb923c' },
  { value: 'pull_path',      label: 'Pull Path',       color: '#fb923c' },
  { value: 'motion_path',    label: 'Motion',          color: '#a78bfa' },
  { value: 'blitz_path',     label: 'Blitz',           color: '#f87171' },
  { value: 'zone_drop',      label: 'Zone Drop',       color: '#34d399' },
  { value: 'contain_path',   label: 'Contain',         color: '#fb7185' },
  { value: 'ball_path',      label: 'Ball Path',       color: '#fde68a' },
  { value: 'fake_path',      label: 'Fake',            color: '#c084fc' },
];

const ARROW_TYPES = ['none', 'open', 'filled', 'double', 'flat'];
const CURVE_TYPES  = ['straight', 'curved', 'arc'];
const LINE_STYLES  = ['solid', 'dashed', 'dotted'];

export default function PathInspector({ path, onChange, onRemove }) {
  if (!path) return null;

  const update = (patch) => onChange({ ...path, ...patch });
  const colorEntry = PATH_TYPES.find(p => p.value === path.path_type);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Path</p>
        <Button size="sm" variant="ghost"
          className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-gray-800"
          onClick={onRemove} title="Delete Path">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Color preview */}
      {colorEntry && (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorEntry.color }} />
          <span className="text-[10px] text-gray-400">{colorEntry.label}</span>
        </div>
      )}

      {/* Path type */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Type</Label>
        <Select value={path.path_type} onValueChange={v => update({ path_type: v })}>
          <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
            {PATH_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Curve type */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Curve</Label>
        <div className="flex gap-1">
          {CURVE_TYPES.map(c => (
            <button key={c} onClick={() => update({ curve_type: c })}
              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition-all flex-1 ${
                (path.curve_type || 'straight') === c
                  ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Line style */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Line Style</Label>
        <div className="flex gap-1">
          {LINE_STYLES.map(s => (
            <button key={s} onClick={() => update({ line_style: s })}
              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition-all flex-1 ${
                (path.line_style || 'solid') === s
                  ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Arrowhead</Label>
        <div className="flex gap-1 flex-wrap">
          {ARROW_TYPES.map(a => (
            <button key={a} onClick={() => update({ arrowhead: a })}
              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition-all ${
                (path.arrowhead || 'open') === a
                  ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">
          Width — {path.stroke_width || 2.5}px
        </Label>
        <input type="range" min="1" max="6" step="0.5"
          value={path.stroke_width || 2.5}
          onChange={e => update({ stroke_width: parseFloat(e.target.value) })}
          className="w-full accent-primary" />
      </div>

      {/* Points count */}
      <div className="pt-1 border-t border-gray-800">
        <p className="text-[9px] text-gray-600">
          {path.points?.length || 0} control point{(path.points?.length || 0) !== 1 ? 's' : ''} · {path.path_type}
        </p>
      </div>
    </div>
  );
}