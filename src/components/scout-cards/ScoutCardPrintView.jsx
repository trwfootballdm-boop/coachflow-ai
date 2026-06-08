import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Printer, X, PenTool, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScoutCardPrintView({ cards, playMap, practicedMap, template, title, onClose }) {
  const [cardsPerPage, setCardsPerPage] = useState('4');
  const [showNotes, setShowNotes] = useState(true);
  const [showPracticed, setShowPracticed] = useState(true);
  const [coachVersion, setCoachVersion] = useState(true);

  const printCards = cards.filter(c => c.include_in_print !== false);
  const cols = { '2': 2, '4': 2, '6': 3, '9': 3 }[cardsPerPage] || 2;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Print controls - hidden when printing */}
      <div className="no-print bg-card border-b border-border px-6 py-3 flex items-center gap-4 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onClose}>
          <X className="h-4 w-4" /> Close
        </Button>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Cards/page</span>
          <Select value={cardsPerPage} onValueChange={setCardsPerPage}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['2', '4', '6', '9'].map(v => <SelectItem key={v} value={v}>{v}-up</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="notes" checked={showNotes} onCheckedChange={setShowNotes} />
          <Label htmlFor="notes" className="text-xs">Notes</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="practiced" checked={showPracticed} onCheckedChange={setShowPracticed} />
          <Label htmlFor="practiced" className="text-xs">Practiced</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="version" checked={coachVersion} onCheckedChange={setCoachVersion} />
          <Label htmlFor="version" className="text-xs">Coach Version</Label>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{printCards.length} cards</span>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Print area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title for print */}
          <div className="text-center mb-6 print-only hidden">
            <h1 className="text-lg font-bold">{title}</h1>
          </div>

          <div className={cn("grid gap-4", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {printCards.map((card, i) => {
              const play = playMap[card.play_id];
              if (!play) return null;
              const practiced = practicedMap[card.play_id];
              return (
                <div key={card.play_id} className="bg-white border border-gray-300 rounded overflow-hidden"
                  style={{ pageBreakInside: 'avoid' }}>
                  {/* Card header */}
                  <div className="bg-gray-800 text-white px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{play.play_name}</p>
                      {play.short_name && <code className="text-[10px] text-gray-300 font-mono">{play.short_name}</code>}
                    </div>
                    <span className="text-[10px] text-gray-400">#{i + 1}</span>
                  </div>

                  {/* Diagram */}
                  <div className="h-28 bg-green-50 flex items-center justify-center border-b border-gray-200">
                    <PenTool className="h-8 w-8 text-green-800/20" />
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {play.concept && (
                        <span className="text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{play.concept}</span>
                      )}
                      {play.play_family && (
                        <span className="text-[10px] text-gray-500">{play.play_family}</span>
                      )}
                      {showPracticed && (
                        practiced && practiced.length > 0 ? (
                          <span className="text-[9px] font-bold text-emerald-700 ml-auto">
                            ✓ {practiced.map(d => d.slice(0, 3).toUpperCase()).join('/')}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-red-600 ml-auto">! Not Repped</span>
                        )
                      )}
                    </div>
                    {card.scout_look_label && (
                      <p className="text-[10px] font-semibold text-gray-600">Look: {card.scout_look_label}</p>
                    )}
                    {showNotes && coachVersion && play.coaching_points && (
                      <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">{play.coaching_points}</p>
                    )}
                    {showNotes && !coachVersion && play.player_friendly_text && (
                      <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">{play.player_friendly_text}</p>
                    )}
                    {showNotes && card.card_note && (
                      <p className="text-[10px] text-gray-500 italic">"{card.card_note}"</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}