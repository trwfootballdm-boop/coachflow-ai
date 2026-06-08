import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, Trash2, Lock, Unlock } from "lucide-react";

const POSITIONS = ['QB','RB','FB','WB','TB','HB','WR','TE','LT','LG','C','RG','RT',
  'DE','DT','NG','MLB','ILB','OLB','SS','FS','CB','K','P','LS','KR','PR'];

const ROLE_TYPES = ['ball_carrier','blocker','receiver','lineman','defender','kicker','returner','other'];
const STANCES = ['two_point','three_point','four_point','upright'];

const PRESET_COLORS = [
  '#3b82f6','#ef4444','#f59e0b','#10b981','#a78bfa',
  '#ec4899','#14b8a6','#f97316','#6366f1','#e5e7eb',
];

export default function PlayerInspector({ player, onChange, onDuplicate, onRemove }) {
  if (!player) return null;

  const update = (patch) => onChange({ ...player, ...patch });
  const updateStyle = (patch) => update({ visual_style: { ...player.visual_style, ...patch } });

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Player</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost"
            className="h-6 w-6 p-0 text-gray-500 hover:text-white hover:bg-gray-800"
            onClick={onDuplicate} title="Duplicate">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost"
            className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-gray-800"
            onClick={onRemove} title="Remove">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Position / Label / Number */}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-[10px] text-gray-500 mb-1 block">Position</Label>
          <Select value={player.position_code || ''} onValueChange={v => update({ position_code: v, display_label: v })}>
            <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200 max-h-48">
              {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Label</Label>
          <Input value={player.display_label || ''} onChange={e => update({ display_label: e.target.value })}
            className="h-7 text-xs bg-gray-800 border-gray-700 text-white placeholder-gray-600" placeholder="QB" />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">#</Label>
          <Input value={player.jersey_number || ''} onChange={e => update({ jersey_number: e.target.value })}
            className="h-7 text-xs bg-gray-800 border-gray-700 text-white placeholder-gray-600" placeholder="12" />
        </div>
      </div>

      {/* Side / Role */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Side</Label>
          <Select value={player.team_side || 'offense'} onValueChange={v => update({ team_side: v })}>
            <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
              <SelectItem value="offense">Offense</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
              <SelectItem value="special_teams">Special Teams</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Role</Label>
          <Select value={player.role_type || 'other'} onValueChange={v => update({ role_type: v })}>
            <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
              {ROLE_TYPES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stance */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Stance</Label>
        <div className="flex gap-1 flex-wrap">
          {STANCES.map(s => (
            <button key={s} onClick={() => update({ stance: s })}
              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition-all ${
                player.stance === s ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s.replace(/_/g, '-')}
            </button>
          ))}
        </div>
      </div>

      {/* Position on field */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">X</Label>
          <Input type="number" value={Math.round(player.x || 0)}
            onChange={e => update({ x: parseInt(e.target.value, 10) || 0 })}
            className="h-7 text-xs bg-gray-800 border-gray-700 text-white font-mono" />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Y</Label>
          <Input type="number" value={Math.round(player.y || 0)}
            onChange={e => update({ y: parseInt(e.target.value, 10) || 0 })}
            className="h-7 text-xs bg-gray-800 border-gray-700 text-white font-mono" />
        </div>
      </div>

      {/* Fill color */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Color</Label>
        <div className="flex gap-1 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => updateStyle({ fill: c })}
              className="h-6 w-6 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: player.visual_style?.fill === c ? 'white' : 'transparent',
              }} />
          ))}
        </div>
      </div>

      {/* Shape — circle (offense) vs square (defense) */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Shape</Label>
        <div className="flex gap-1">
          {['circle', 'square', 'triangle'].map(s => (
            <button key={s} onClick={() => updateStyle({ shape: s })}
              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition-all ${
                (player.visual_style?.shape || 'circle') === s
                  ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Lock */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
        <Label className="text-[10px] text-gray-500 flex items-center gap-1.5">
          {player.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          Lock Position
        </Label>
        <Switch checked={!!player.locked} onCheckedChange={v => update({ locked: v })} />
      </div>
    </div>
  );
}