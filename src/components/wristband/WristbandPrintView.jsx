import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Printer, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const COLS_OPTIONS = [
  { value: '2', label: '2 cols', cols: 2 },
  { value: '3', label: '3 cols', cols: 3 },
  { value: '4', label: '4 cols', cols: 4 },
];

const COPIES_OPTIONS = ['1', '2', '3', '4', '5', '6'];

// Single wristband insert card
function WristbandInsert({ title, teamName, opponentName, sections, playMap, showCodes, showFullName, showRunPass, sideLabel, fontSize }) {
  const fontClass = fontSize === 'lg' ? 'text-[11px]' : fontSize === 'sm' ? 'text-[8px]' : 'text-[9px]';
  const headerFont = fontSize === 'lg' ? 'text-[10px]' : 'text-[8px]';

  return (
    <div
      className="bg-white border border-gray-400 rounded overflow-hidden"
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid', minHeight: '200px' }}
    >
      {/* Insert header */}
      <div className="bg-gray-900 text-white px-2 py-1 flex items-center justify-between">
        <div>
          <p className={cn("font-bold leading-tight", fontSize === 'lg' ? 'text-[11px]' : 'text-[9px]')}>{title}</p>
          {(teamName || opponentName) && (
            <p className={cn("text-gray-400 leading-none", headerFont)}>
              {teamName}{opponentName ? ` vs ${opponentName}` : ''}
            </p>
          )}
        </div>
        <span className={cn("text-gray-500 font-bold uppercase tracking-widest", headerFont)}>{sideLabel}</span>
      </div>

      {/* Sections */}
      <div className="p-1">
        {sections.map(section => {
          const plays = section.plays.filter(e => playMap[e.play_id]);
          if (plays.length === 0) return null;
          return (
            <div key={section.id} className="mb-1">
              {/* Section label */}
              <div className="bg-gray-100 px-1.5 py-0.5 border-b border-gray-200">
                <p className={cn("font-bold uppercase tracking-wider text-gray-700", headerFont)}>
                  {section.label}
                </p>
              </div>
              {/* Plays */}
              <div className="divide-y divide-gray-100">
                {plays.map(entry => {
                  const play = playMap[entry.play_id];
                  return (
                    <div key={entry.play_id} className="flex items-baseline gap-1.5 px-1.5 py-0.5">
                      {showCodes && entry.code && (
                        <span className={cn("font-mono font-black text-gray-900 shrink-0 tabular-nums", fontClass)}>
                          {entry.code}
                        </span>
                      )}
                      {showCodes && entry.code && <span className={cn("text-gray-300 shrink-0", fontClass)}>—</span>}
                      <span className={cn("font-semibold text-gray-900 truncate flex-1", fontClass)}>
                        {showFullName
                          ? (play.name || play.play_name || '—')
                          : (play.short_name || play.name || play.play_name || '—')}
                      </span>
                      {showRunPass && play.run_pass && (
                        <span className={cn("text-gray-400 shrink-0 font-medium", headerFont)}>
                          {play.run_pass === 'run' ? 'R' : play.run_pass === 'pass' ? 'P' : 'S'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WristbandPrintView({
  title, teamName, opponentName, sideOfBall, sections, playMap, onClose
}) {
  const [cols, setCols] = useState('3');
  const [copies, setCopies] = useState('1');
  const [showCodes, setShowCodes] = useState(true);
  const [showFullName, setShowFullName] = useState(false);
  const [showRunPass, setShowRunPass] = useState(true);
  const [showCutLines, setShowCutLines] = useState(true);
  const [fontSize, setFontSize] = useState('md'); // sm | md | lg

  const numCols = parseInt(cols, 10);
  const numCopies = parseInt(copies, 10);
  const sideLabel = sideOfBall === 'special_teams' ? 'ST' : sideOfBall?.toUpperCase().slice(0, 3) || 'OFF';

  const totalPlays = sections.reduce((acc, s) => acc + s.plays.length, 0);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Controls */}
      <div className="no-print bg-card border-b border-border px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-border shrink-0" />

        {/* Layout */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Columns</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            {COLS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setCols(opt.value)}
                className={cn("px-2 py-0.5 text-[11px] font-bold rounded transition-all",
                  cols === opt.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Copies */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Copies</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            {COPIES_OPTIONS.map(n => (
              <button key={n} onClick={() => setCopies(n)}
                className={cn("px-2 py-0.5 text-[11px] font-bold rounded transition-all",
                  copies === n ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}>
                ×{n}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Size</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            {[['sm', 'Small'], ['md', 'Med'], ['lg', 'Large']].map(([v, l]) => (
              <button key={v} onClick={() => setFontSize(v)}
                className={cn("px-2 py-0.5 text-[11px] font-bold rounded transition-all",
                  fontSize === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: 'codes', label: 'Codes', val: showCodes, set: setShowCodes },
            { id: 'fullname', label: 'Full Name', val: showFullName, set: setShowFullName },
            { id: 'runpass', label: 'R/P', val: showRunPass, set: setShowRunPass },
            { id: 'cutlines', label: 'Cut Lines', val: showCutLines, set: setShowCutLines },
          ].map(({ id, label, val, set }) => (
            <div key={id} className="flex items-center gap-1.5">
              <Switch id={id} checked={val} onCheckedChange={set} />
              <Label htmlFor={id} className="text-[11px] cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {totalPlays} plays · ×{numCopies} copies
          </span>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Print area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <div
            className={cn(
              "grid gap-3",
              numCols === 2 ? "grid-cols-2" : numCols === 4 ? "grid-cols-4" : "grid-cols-3"
            )}
          >
            {Array.from({ length: numCopies }).map((_, copyIdx) => (
              <WristbandInsert
                key={copyIdx}
                title={title}
                teamName={teamName}
                opponentName={opponentName}
                sections={sections}
                playMap={playMap}
                showCodes={showCodes}
                showFullName={showFullName}
                showRunPass={showRunPass}
                sideLabel={sideLabel}
                fontSize={fontSize}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}