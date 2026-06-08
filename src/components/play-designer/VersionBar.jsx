import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Check, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIATION_TYPES = [
  { value: 'base',               label: 'Base' },
  { value: 'mirror',             label: 'Mirror' },
  { value: 'red_zone',           label: 'Red Zone' },
  { value: 'goal_line',          label: 'Goal Line' },
  { value: 'install',            label: 'Install' },
  { value: 'opponent_specific',  label: 'Opponent' },
  { value: 'youth_simplified',   label: 'Youth' },
  { value: 'scout_safe',         label: 'Scout Safe' },
  { value: 'custom',             label: 'Custom' },
];

const VARIATION_COLORS = {
  base:              'bg-primary/20 text-primary border-primary/30',
  mirror:            'bg-violet-500/20 text-violet-400 border-violet-500/30',
  red_zone:          'bg-red-500/20 text-red-400 border-red-500/30',
  goal_line:         'bg-orange-500/20 text-orange-400 border-orange-500/30',
  install:           'bg-blue-500/20 text-blue-400 border-blue-500/30',
  opponent_specific: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  youth_simplified:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  scout_safe:        'bg-teal-500/20 text-teal-400 border-teal-500/30',
  custom:            'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function VersionBar({ versions, activeVersionId, onSelectVersion, onCreateVersion, onCloneVersion }) {
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('base');

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    onCreateVersion({ version_label: newLabel.trim(), variation_type: newType });
    setNewLabel('');
    setNewType('base');
    setShowNew(false);
  };

  return (
    <div className="h-9 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-1.5 overflow-x-auto shrink-0">
      <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold shrink-0 mr-1">Versions</span>

      {versions.map((v, i) => {
        const isActive = v.id === activeVersionId || (!activeVersionId && i === 0);
        const color = VARIATION_COLORS[v.variation_type] || VARIATION_COLORS.base;
        return (
          <button
            key={v.id || i}
            onClick={() => onSelectVersion(v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all shrink-0 whitespace-nowrap",
              isActive ? color : "bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300"
            )}
          >
            {v.is_active && <Check className="h-2.5 w-2.5 shrink-0" />}
            {v.version_label || `v${v.version_number || i + 1}`}
            {v.variation_type && v.variation_type !== 'base' && (
              <span className="text-[8px] opacity-70">{v.variation_type.replace('_', ' ')}</span>
            )}
          </button>
        );
      })}

      {showNew ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            autoFocus
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }}
            placeholder="Version label…"
            className="h-6 text-[11px] w-32 bg-gray-800 border-gray-600 text-white px-2"
          />
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="h-6 text-[10px] w-28 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleCreate} className="h-6 text-[10px] px-2">Create</Button>
          <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-gray-300 text-[10px]">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-all shrink-0"
        >
          <Plus className="h-3 w-3" /> New Version
        </button>
      )}
    </div>
  );
}