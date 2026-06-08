import React from 'react';
import { cn } from "@/lib/utils";
import { LayoutGrid, ChevronRight, Users } from "lucide-react";

const QUICK_FORMATIONS = [
  { id: '11_personnel', name: '11 Personnel', label: '11', description: '1 RB, 1 TE, 3 WR' },
  { id: '10_personnel', name: '10 Personnel', label: '10', description: '1 RB, 0 TE, 4 WR' },
  { id: '12_personnel', name: '12 Personnel', label: '12', description: '1 RB, 2 TE, 2 WR' },
  { id: '21_personnel', name: '21 Personnel', label: '21', description: '2 RB, 1 TE, 2 WR' },
  { id: '22_personnel', name: '22 Personnel', label: '22', description: '2 RB, 2 TE, 1 WR' },
];

const COMMON_FORMATIONS = [
  { id: 'shotgun_trips', name: 'Shotgun Trips', icon: '🏈' },
  { id: 'shotgun_bunch', name: 'Shotgun Bunch', icon: '🏈' },
  { id: 'empty', name: 'Empty Set', icon: '🏈' },
  { id: 'i_formation', name: 'I-Formation', icon: '🏈' },
  { id: 'singleback', name: 'Singleback', icon: '🏈' },
  { id: 'pistol', name: 'Pistol', icon: '🏈' },
];

export default function FormationQuickPanel({ onLoadFormation }) {
  return (
    <div className="p-3 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Personnel Groups
          </h3>
        </div>
        
        <div className="grid grid-cols-1 gap-1.5">
          {QUICK_FORMATIONS.map((formation) => (
            <button
              key={formation.id}
              type="button"
              onClick={() => onLoadFormation?.(formation.id)}
              className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-2.5 py-2 text-left transition-all hover:border-accent/40 hover:bg-accent/5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {formation.label}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-foreground">
                    {formation.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {formation.description}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Common Formations
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          {COMMON_FORMATIONS.map((formation) => (
            <button
              key={formation.id}
              type="button"
              onClick={() => onLoadFormation?.(formation.id)}
              className="group flex flex-col items-center rounded-lg border border-border/60 bg-background/40 px-2 py-2 text-center transition-all hover:border-accent/40 hover:bg-accent/5"
            >
              <div className="text-lg mb-1">{formation.icon}</div>
              <div className="text-[10px] font-medium text-foreground">
                {formation.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}