import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Trash2, Copy, ChevronDown, ChevronRight, BookOpen, Users, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_TYPES = ['ball_carrier', 'blocker', 'receiver', 'lineman', 'defender', 'kicker', 'returner', 'other'];
const PATH_TYPES = [
  'run_path', 'pass_route', 'blocking_track', 'pull_path', 'motion_path',
  'blitz_path', 'pursuit_path', 'zone_drop', 'contain_path', 'ball_path', 'fake_path'
];
const CURVE_TYPES = ['straight', 'curved', 'arc'];
const ARROWHEADS = ['none', 'open', 'filled', 'double', 'flat'];

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-200 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">{label}</label>
      {children}
    </div>
  );
}

// ─── Player inspector ─────────────────────────────────────────────────────────
function PlayerInspector({ player, onUpdate, onDelete, onDuplicate }) {
  const [vals, setVals] = useState(player);
  useEffect(() => setVals(player), [player]);

  const set = (key, val) => {
    const updated = { ...vals, [key]: val };
    setVals(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-0">
      <Section title="Identity">
        <Field label="Position">
          <Input value={vals.position_code || ''} onChange={e => set('position_code', e.target.value.toUpperCase())}
            className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <Field label="Display Label">
          <Input value={vals.display_label || ''} onChange={e => set('display_label', e.target.value)}
            className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Jersey #">
            <Input value={vals.jersey_number || ''} onChange={e => set('jersey_number', e.target.value)}
              className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
          </Field>
          <Field label="Role">
            <Select value={vals.role_type || 'other'} onValueChange={v => set('role_type', v)}>
              <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Position" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X"><Input value={Math.round(vals.x || 0)} onChange={e => set('x', Number(e.target.value))} className="h-7 text-xs bg-gray-800 border-gray-600 text-white" /></Field>
          <Field label="Y"><Input value={Math.round(vals.y || 0)} onChange={e => set('y', Number(e.target.value))} className="h-7 text-xs bg-gray-800 border-gray-600 text-white" /></Field>
        </div>
        <Field label="Alignment">
          <Input value={vals.alignment || ''} onChange={e => set('alignment', e.target.value)}
            placeholder="e.g. 3-tech, wide, tight" className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <Field label="Team Side">
          <div className="flex gap-1">
            {['offense', 'defense', 'special_teams'].map(s => (
              <button key={s} onClick={() => set('team_side', s)}
                className={cn("flex-1 text-[10px] py-1 rounded font-bold transition-all",
                  vals.team_side === s ? "bg-primary text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}>
                {s === 'special_teams' ? 'ST' : s.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Assignment" defaultOpen={false}>
        <Field label="Assignment Text">
          <Textarea value={vals.assignment_text || ''} onChange={e => set('assignment_text', e.target.value)}
            placeholder="Block the MIKE, release flat…" className="text-xs bg-gray-800 border-gray-600 text-white min-h-[60px] resize-none" />
        </Field>
        <Field label="Aiming Point">
          <Input value={vals.aiming_point || ''} onChange={e => set('aiming_point', e.target.value)}
            placeholder="Outside hip of guard" className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <Field label="Read Key">
          <Input value={vals.read_key || ''} onChange={e => set('read_key', e.target.value)}
            placeholder="Watch MIKE linebacker…" className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-gray-400">Motion Flag</Label>
          <Switch checked={!!vals.motion_flag} onCheckedChange={v => set('motion_flag', v)} />
        </div>
      </Section>

      {/* Actions */}
      <div className="px-3 py-2 flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700" onClick={onDuplicate}>
          <Copy className="h-3 w-3" /> Dup
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-red-800 text-red-400 bg-gray-800 hover:bg-red-900/30" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Path inspector ───────────────────────────────────────────────────────────
function PathInspector({ path, onUpdate, onDelete }) {
  const [vals, setVals] = useState(path);
  useEffect(() => setVals(path), [path]);
  const set = (key, val) => { const u = { ...vals, [key]: val }; setVals(u); onUpdate(u); };

  return (
    <div>
      <Section title="Path Type">
        <Field label="Type">
          <Select value={vals.path_type} onValueChange={v => set('path_type', v)}>
            <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PATH_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Curve">
          <div className="flex gap-1">
            {CURVE_TYPES.map(c => (
              <button key={c} onClick={() => set('curve_type', c)}
                className={cn("flex-1 text-[10px] py-1 rounded font-bold transition-all capitalize",
                  vals.curve_type === c ? "bg-primary text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Arrowhead">
          <Select value={vals.arrowhead || 'open'} onValueChange={v => set('arrowhead', v)}>
            <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARROWHEADS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Stroke Width">
          <Input type="number" min={1} max={6} value={vals.stroke_width || 2} onChange={e => set('stroke_width', Number(e.target.value))}
            className="h-7 text-xs bg-gray-800 border-gray-600 text-white" />
        </Field>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-gray-400">Visible</Label>
          <Switch checked={vals.visible !== false} onCheckedChange={v => set('visible', v)} />
        </div>
      </Section>
      <div className="px-3 py-2">
        <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1 border-red-800 text-red-400 bg-gray-800 hover:bg-red-900/30" onClick={onDelete}>
          <Trash2 className="h-3 w-3" /> Delete Path
        </Button>
      </div>
    </div>
  );
}

// ─── No selection ─────────────────────────────────────────────────────────────
function EmptyInspector({ playData, onUpdatePlay }) {
  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] text-gray-500 italic">Select a player or path to inspect</p>
      <div className="h-px bg-gray-700" />
      <Section title="Play Info">
        <Field label="Coaching Points">
          <Textarea value={playData?.coaching_points || ''}
            onChange={e => onUpdatePlay({ coaching_points: e.target.value })}
            placeholder="Key teaching points…"
            className="text-xs bg-gray-800 border-gray-600 text-white min-h-[80px] resize-none" />
        </Field>
        <Field label="Notes">
          <Textarea value={playData?.notes || ''}
            onChange={e => onUpdatePlay({ notes: e.target.value })}
            placeholder="General notes…"
            className="text-xs bg-gray-800 border-gray-600 text-white min-h-[60px] resize-none" />
        </Field>
      </Section>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PropertiesPanel({ selectedObject, selectedType, players, paths, playData, onUpdatePlayer, onDeletePlayer, onDuplicatePlayer, onUpdatePath, onDeletePath, onUpdatePlay }) {
  if (selectedType === 'player') {
    const player = players.find(p => p.token_id === selectedObject);
    if (!player) return <EmptyInspector playData={playData} onUpdatePlay={onUpdatePlay} />;
    return (
      <PlayerInspector
        key={player.token_id}
        player={player}
        onUpdate={onUpdatePlayer}
        onDelete={() => onDeletePlayer(player.token_id)}
        onDuplicate={() => onDuplicatePlayer(player.token_id)}
      />
    );
  }
  if (selectedType === 'path') {
    const path = paths.find(p => p.path_id === selectedObject);
    if (!path) return <EmptyInspector playData={playData} onUpdatePlay={onUpdatePlay} />;
    return (
      <PathInspector
        key={path.path_id}
        path={path}
        onUpdate={onUpdatePath}
        onDelete={() => onDeletePath(path.path_id)}
      />
    );
  }
  return <EmptyInspector playData={playData} onUpdatePlay={onUpdatePlay} />;
}