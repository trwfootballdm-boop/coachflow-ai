import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Printer, X, PenTool, CheckCircle2, AlertTriangle, BookOpen, Users, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCE_LABELS = {
  practice_script: 'Practice Script',
  game_plan:       'Game Plan',
  play_library:    'Play Library',
  manual:          'Manual',
};

const LAYOUT_OPTIONS = [
  { value: '2', label: '2-up',  cols: 2, rows: 1 },
  { value: '4', label: '4-up',  cols: 2, rows: 2 },
  { value: '6', label: '6-up',  cols: 3, rows: 2 },
  { value: '9', label: '9-up',  cols: 3, rows: 3 },
];

export default function ScoutCardPrintView({ cards, playMap, practicedMap, template, title, sourceType, onClose }) {
  const [layout, setLayout] = useState('4');
  const [showNotes, setShowNotes] = useState(true);
  const [showPracticed, setShowPracticed] = useState(true);
  const [showCutLines, setShowCutLines] = useState(true);
  const [outputMode, setOutputMode] = useState('coach'); // 'coach' | 'player'
  const [showCardNumbers, setShowCardNumbers] = useState(true);
  const [showFormation, setShowFormation] = useState(true);

  const printCards = cards.filter(c => c.include_in_print !== false);
  const layoutOpt = LAYOUT_OPTIONS.find(o => o.value === layout) || LAYOUT_OPTIONS[1];
  const cols = layoutOpt.cols;
  const isCompact = cols === 3 || template === 'compact_grid';

  // Split into pages
  const perPage = parseInt(layout, 10);
  const pages = [];
  for (let i = 0; i < printCards.length; i += perPage) {
    pages.push(printCards.slice(i, i + perPage));
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* ── Controls bar (hidden when printing) ── */}
      <div className="no-print bg-card border-b border-border px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" /> Back
        </Button>

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Layout */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Layout</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            {LAYOUT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setLayout(opt.value)}
                className={cn("px-2 py-0.5 text-[11px] font-bold rounded transition-all",
                  layout === opt.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Output mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Mode</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            <button onClick={() => setOutputMode('coach')}
              className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                outputMode === 'coach' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              <BookOpen className="h-3 w-3" /> Coach
            </button>
            <button onClick={() => setOutputMode('player')}
              className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                outputMode === 'player' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              <Users className="h-3 w-3" /> Player
            </button>
          </div>
        </div>

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: 'notes',     label: 'Notes',      val: showNotes,       set: setShowNotes },
            { id: 'practiced', label: 'Practiced',   val: showPracticed,   set: setShowPracticed },
            { id: 'numbers',   label: 'Card #',      val: showCardNumbers, set: setShowCardNumbers },
            { id: 'formation', label: 'Formation',   val: showFormation,   set: setShowFormation },
            { id: 'cutlines',  label: 'Cut Lines',   val: showCutLines,    set: setShowCutLines },
          ].map(({ id, label, val, set }) => (
            <div key={id} className="flex items-center gap-1.5">
              <Switch id={id} checked={val} onCheckedChange={set} />
              <Label htmlFor={id} className="text-[11px] cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {printCards.length} cards · {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* ── Print area ── */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-100">
        <div className="max-w-5xl mx-auto space-y-8">
          {pages.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className="bg-white shadow-sm"
              style={{
                pageBreakAfter: 'always',
                border: showCutLines ? '1px dashed #ccc' : '1px solid #e5e7eb',
                padding: '12px',
                position: 'relative',
              }}
            >
              {/* Page header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sourceType && (
                      <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                        {SOURCE_LABELS[sourceType] || sourceType}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-400">
                      Page {pageIndex + 1} of {pages.length}
                    </span>
                    <span className="text-[9px] text-gray-400 capitalize">
                      · {outputMode === 'coach' ? '👨‍💼 Coach' : '🏈 Player'} Mode
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-gray-400">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Card grid */}
              <div
                className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-2")}
              >
                {pageCards.map((card, i) => {
                  const play = playMap[card.play_id];
                  if (!play) return null;
                  const practiced = practicedMap[card.play_id];
                  const globalIndex = pageIndex * perPage + i;
                  const playName = play.name || play.play_name;

                  // Which notes to show
                  const coachText = play.coaching_points || '';
                  const playerText = play.notes || play.player_friendly_text || '';
                  const notesText = outputMode === 'coach' ? coachText : playerText;

                  return (
                    <div
                      key={card.play_id}
                      className="bg-white overflow-hidden"
                      style={{
                        border: showCutLines ? '1px dashed #d1d5db' : '1px solid #e5e7eb',
                        borderRadius: '4px',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                      }}
                    >
                      {/* Card header */}
                      <div className="bg-gray-900 text-white px-2.5 py-1.5 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn("font-bold leading-tight text-white", isCompact ? "text-[11px]" : "text-sm")}>
                            {playName}
                          </p>
                          {play.short_name && (
                            <code className="text-[9px] text-gray-300 font-mono">{play.short_name}</code>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {showPracticed && (
                            practiced && practiced.length > 0 ? (
                              <span className="text-[9px] font-bold text-emerald-400">
                                ✓{practiced.map(d => d.slice(0, 3).toUpperCase()).join('/')}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-400">NR</span>
                            )
                          )}
                          {showCardNumbers && (
                            <span className="text-[9px] text-gray-500 font-mono">#{globalIndex + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Diagram placeholder with field lines */}
                      <div
                        className="relative flex items-center justify-center bg-green-50"
                        style={{ height: isCompact ? 56 : 80 }}
                      >
                        {/* Field yard lines */}
                        {[20, 40, 60, 80].map(pct => (
                          <div key={pct} className="absolute top-0 bottom-0 border-l border-green-200/70" style={{ left: `${pct}%` }} />
                        ))}
                        <div className="absolute left-0 right-0 border-t border-green-200/70" style={{ top: '50%' }} />
                        <PenTool className={cn("text-green-800/15 relative z-10", isCompact ? "h-5 w-5" : "h-7 w-7")} />

                        {/* Formation label */}
                        {showFormation && play.formation && (
                          <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
                            <span className="text-[8px] text-green-800/50 font-medium">{play.formation}</span>
                            {play.personnel && (
                              <span className="text-[8px] text-green-800/50 font-mono">{play.personnel}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info block */}
                      <div className="px-2 py-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {play.concept && (
                            <span className="text-[9px] font-semibold bg-gray-100 px-1 py-0.5 rounded">{play.concept}</span>
                          )}
                          {play.play_family && (
                            <span className="text-[9px] text-gray-500">{play.play_family}</span>
                          )}
                          {play.run_pass && (
                            <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded ml-auto",
                              play.run_pass === 'run' ? "bg-emerald-50 text-emerald-700" :
                              play.run_pass === 'pass' ? "bg-sky-50 text-sky-700" :
                              "bg-gray-50 text-gray-600"
                            )}>
                              {play.run_pass?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {card.scout_look_label && (
                          <p className="text-[9px] font-semibold text-gray-600">
                            Look: {card.scout_look_label}
                          </p>
                        )}

                        {showNotes && notesText && (
                          <p className={cn(
                            "text-gray-600 leading-relaxed border-t border-gray-100 pt-1",
                            isCompact ? "text-[8px] line-clamp-2" : "text-[10px] line-clamp-3"
                          )}>
                            {notesText}
                          </p>
                        )}

                        {showNotes && card.card_note && (
                          <p className="text-[9px] text-gray-500 italic border-t border-gray-100 pt-1">
                            "{card.card_note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {printCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No cards are marked for printing.</p>
              <p className="text-gray-400 text-xs mt-1">Enable cards in the card editor using the "Include in print set" toggle.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-gray-100 { background: white !important; }
        }
      `}</style>
    </div>
  );
}