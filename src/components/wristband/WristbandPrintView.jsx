import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Printer, X, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_SIZES = [
  { value: 'xs',  label: 'XS — Youth/Mini', base: 7 },
  { value: 'sm',  label: 'Small — Standard', base: 9 },
  { value: 'md',  label: 'Medium — Clear',   base: 11 },
  { value: 'lg',  label: 'Large — Bold',     base: 13 },
];

export default function WristbandPrintView({ title, sections, sectionPlays, playMap, template, repeats, onClose }) {
  const [copies, setCopies] = useState(repeats || 2);
  const [fontSz, setFontSz] = useState('sm');
  const [showCutLines, setShowCutLines] = useState(true);
  const [showCodes, setShowCodes] = useState(true);
  const [showFormation, setShowFormation] = useState(false);
  const [boldNames, setBoldNames] = useState(true);
  const [layout, setLayout] = useState(template?.value || 'standard');

  const fontSize = FONT_SIZES.find(f => f.value === fontSz)?.base || 9;

  // Build one insert
  const renderInsert = (insertKey) => (
    <div
      key={insertKey}
      className="bg-white text-black overflow-hidden"
      style={{
        border: showCutLines ? '1px dashed #999' : '1px solid #ccc',
        borderRadius: '4px',
        width: layout === 'wide' ? '3.5in' : layout === 'mini' ? '2.5in' : '3in',
        minHeight: '4in',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        display: 'inline-block',
        margin: '4px',
        verticalAlign: 'top',
      }}
    >
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '3px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: fontSize + 1, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title}
        </span>
        {showCutLines && <Scissors style={{ width: 8, height: 8, opacity: 0.4 }} />}
      </div>

      {/* Sections */}
      <div style={{ padding: '3px 4px' }}>
        {sections.map(sec => {
          const entries = sectionPlays[sec.id] || [];
          if (!entries.length) return null;
          return (
            <div key={sec.id} style={{ marginBottom: 3 }}>
              {/* Section header */}
              <div style={{
                fontSize: fontSize - 1,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: sec.color,
                borderBottom: `1px solid ${sec.color}30`,
                paddingBottom: 1,
                marginBottom: 1,
              }}>
                {sec.label}
              </div>
              {/* Play entries */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: layout === 'wide' || layout === 'mini' ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: '0 6px',
              }}>
                {entries.map((entry, i) => {
                  const play = playMap[entry.play_id];
                  const name = play?.short_name || play?.name || play?.play_name || '—';
                  const formation = play?.formation;
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 2,
                      paddingTop: 1,
                      paddingBottom: 1,
                      borderBottom: '1px solid #f0f0f0',
                    }}>
                      {showCodes && (
                        <span style={{
                          fontSize: fontSize - 1,
                          fontWeight: 900,
                          color: '#555',
                          minWidth: 14,
                          textAlign: 'right',
                          flexShrink: 0,
                          fontFamily: 'monospace',
                        }}>
                          {entry.code ?? i + 1}
                        </span>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{
                          fontSize,
                          fontWeight: boldNames ? 700 : 400,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: layout === 'mini' ? 60 : layout === 'wide' ? 80 : 100,
                        }}>
                          {name}
                        </span>
                        {showFormation && formation && (
                          <span style={{ fontSize: fontSize - 2, color: '#888', display: 'block', lineHeight: 1 }}>
                            {formation}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #eee', padding: '2px 5px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: fontSize - 2, color: '#aaa' }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span style={{ fontSize: fontSize - 2, color: '#aaa' }}>
          {Object.values(sectionPlays).flat().length} plays
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Controls */}
      <div className="no-print bg-card border-b border-border px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-border shrink-0" />

        {/* Layout */}
        <Select value={layout} onValueChange={setLayout}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: 'standard', label: 'Standard 2-col' },
              { value: 'condensed', label: 'Condensed 2-col' },
              { value: 'wide', label: 'Wide 3-col' },
              { value: 'mini', label: 'Mini 3-col' },
            ].map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Font size */}
        <Select value={fontSz} onValueChange={setFontSz}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Copies */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Copies</span>
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            {[1,2,3,4,6,8].map(n => (
              <button key={n} onClick={() => setCopies(n)}
                className={cn("h-6 w-6 text-[10px] font-bold rounded transition-all",
                  copies === n ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: 'codes',     label: 'Codes',     val: showCodes,     set: setShowCodes },
            { id: 'formation', label: 'Formation',  val: showFormation,  set: setShowFormation },
            { id: 'bold',      label: 'Bold',       val: boldNames,      set: setBoldNames },
            { id: 'cutlines',  label: 'Cut Lines',  val: showCutLines,   set: setShowCutLines },
          ].map(({ id, label, val, set }) => (
            <div key={id} className="flex items-center gap-1.5">
              <Switch id={id} checked={val} onCheckedChange={set} />
              <Label htmlFor={id} className="text-[11px] cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{copies} inserts</span>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Print area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
          {Array.from({ length: copies }).map((_, i) => renderInsert(i))}
        </div>
        {copies === 0 && (
          <p className="text-center text-gray-400 mt-20">Set copies to 1 or more</p>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-gray-100 { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}