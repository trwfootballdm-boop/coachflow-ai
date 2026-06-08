import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Filter, Download, Check, ChevronRight,
  Loader2, Package, Layers, Tag, Star, X, Eye, ArrowRight,
  LayoutGrid, List, Shield, Zap, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Side tabs ────────────────────────────────────────────────────────────────
const SIDES = [
  { value: 'all',           label: 'All Content', icon: LayoutGrid },
  { value: 'offense',       label: 'Offense',     icon: Zap },
  { value: 'defense',       label: 'Defense',     icon: Shield },
  { value: 'special_teams', label: 'Spec Teams',  icon: Users },
];

const ITEM_TYPE_LABELS = {
  play:           'Play',
  formation:      'Formation',
  motion_tag:     'Motion',
  concept_shell:  'Concept',
  defensive_call: 'Def Call',
  special_teams:  'ST Item',
  drill:          'Drill',
};

const DIFFICULTY_COLORS = {
  beginner: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  moderate: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  advanced: 'text-red-600 bg-red-500/10 border-red-500/20',
};

// ─── Pack card ────────────────────────────────────────────────────────────────
function PackCard({ pack, selected, onClick }) {
  const borderColor = {
    offense: 'border-blue-500/30 hover:border-blue-500/60',
    defense: 'border-red-500/30 hover:border-red-500/60',
    special_teams: 'border-emerald-500/30 hover:border-emerald-500/60',
  }[pack.side_of_ball] || 'border-border hover:border-primary/40';

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col p-4 rounded-xl border-2 bg-card text-left transition-all hover:shadow-sm w-full",
        borderColor,
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-2xl">{pack.icon_emoji || '📦'}</span>
        <Badge variant="secondary" className="text-[9px] capitalize shrink-0">
          {pack.side_of_ball?.replace('_', ' ')}
        </Badge>
      </div>
      <h3 className="font-display font-bold text-sm leading-snug mb-1">{pack.pack_name}</h3>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
        {pack.description}
      </p>
      <div className="flex items-center gap-2 mt-auto">
        <span className="text-[10px] text-muted-foreground">{pack.item_count || '?'} items</span>
        <span className="text-[10px] text-primary font-semibold ml-auto flex items-center gap-1">
          Browse <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

// ─── Bundle chip ──────────────────────────────────────────────────────────────
function BundleChip({ bundle, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}>
      <span>{bundle.icon_emoji}</span>
      {bundle.bundle_name}
    </button>
  );
}

// ─── Library item row ─────────────────────────────────────────────────────────
function LibraryItemRow({ item, imported, onPreview, onImport, isImporting }) {
  const typeColor = {
    play: 'text-blue-500',
    formation: 'text-violet-500',
    defensive_call: 'text-red-500',
    special_teams: 'text-emerald-500',
    concept_shell: 'text-amber-500',
    motion_tag: 'text-purple-500',
  }[item.item_type] || 'text-muted-foreground';

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors rounded-xl group",
      imported && "opacity-60"
    )}>
      {/* Type icon */}
      <div className={cn("mt-0.5 shrink-0 text-sm font-black w-6 text-center", typeColor)}>
        {item.item_type === 'play' ? '▶' :
         item.item_type === 'formation' ? '⊞' :
         item.item_type === 'defensive_call' ? '🛡' :
         item.item_type === 'special_teams' ? '⚡' : '◆'}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{item.item_name}</span>
          {item.starter_recommended && (
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
          )}
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
            DIFFICULTY_COLORS[item.difficulty_level]
          )}>
            {item.difficulty_level}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.short_description}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn("text-[10px] font-semibold", typeColor)}>
            {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
          </span>
          {item.formation_name && (
            <span className="text-[10px] text-muted-foreground/70">{item.formation_name}</span>
          )}
          {item.concept_family && (
            <span className="text-[10px] text-muted-foreground/50 capitalize">
              {item.concept_family.replace(/_/g, ' ')}
            </span>
          )}
          {(item.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground/70">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onPreview(item)}>
          <Eye className="h-3 w-3" /> Preview
        </Button>
        {imported ? (
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2">
            <Check className="h-3 w-3" /> Imported
          </div>
        ) : (
          <Button size="sm" className="h-7 text-xs gap-1" disabled={isImporting} onClick={() => onImport(item)}>
            {isImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Import
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────
function PreviewPanel({ item, imported, onImport, isImporting, onClose }) {
  if (!item) return null;

  const sideColor = {
    offense: 'text-blue-600',
    defense: 'text-red-600',
    special_teams: 'text-emerald-600',
  }[item.side_of_ball] || 'text-muted-foreground';

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-base leading-snug">{item.item_name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn("text-[10px] font-bold uppercase", sideColor)}>
              {item.side_of_ball?.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{ITEM_TYPE_LABELS[item.item_type]}</span>
            {item.starter_recommended && (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" /> Starter Pick
                </span>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Diagram placeholder */}
        <div className="aspect-[16/7] rounded-xl bg-emerald-900/20 dark:bg-emerald-950/40 border border-emerald-900/10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl mb-1">🏈</p>
            <p className="text-[11px] text-muted-foreground/50">Diagram coming soon</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
          <p className="text-sm leading-relaxed">{item.short_description}</p>
        </div>

        {/* Coaching points */}
        {item.coaching_points && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Coaching Points</p>
            <p className="text-sm leading-relaxed bg-secondary/50 rounded-lg p-3">{item.coaching_points}</p>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Formation', value: item.formation_name },
            { label: 'Concept', value: item.concept_family?.replace(/_/g, ' ') },
            { label: 'System', value: item.system_family?.replace(/_/g, ' ') },
            { label: 'Difficulty', value: item.difficulty_level },
            { label: 'Personnel', value: item.personnel },
            { label: 'Direction', value: item.direction },
          ].filter(m => m.value).map(m => (
            <div key={m.label}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</p>
              <p className="text-sm capitalize mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] capitalize">
                  {tag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">
        {imported ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 font-semibold">
            <Check className="h-4 w-4" /> Already in your library
          </div>
        ) : (
          <>
            <Button className="w-full gap-2 rounded-xl" onClick={() => onImport(item)} disabled={isImporting}>
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import to My Library
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Creates an editable copy in your team's play library
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstallSheets() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [side, setSide] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [importingIds, setImportingIds] = useState(new Set());

  // ── Data ──
  const { data: packs = [], isLoading: packsLoading } = useQuery({
    queryKey: ['libraryPacks'],
    queryFn: () => base44.entities.LibraryPack.filter({ active: true }, 'sort_order'),
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['libraryItems'],
    queryFn: () => base44.entities.LibraryItem.filter({ active: true }, 'sort_order'),
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['libraryBundles'],
    queryFn: () => base44.entities.LibraryBundle.filter({ active: true }, 'sort_order'),
  });

  const { data: importMaps = [] } = useQuery({
    queryKey: ['importMaps', activeTeamId],
    queryFn: () => base44.entities.LibraryImportMap.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const importedItemIds = useMemo(() => new Set(importMaps.map(m => m.library_item_id)), [importMaps]);

  // ── Import mutation ──
  const importMutation = useMutation({
    mutationFn: async (item) => {
      // Create a Play or Formation record in the team's own library
      let createdId = null;
      if (item.item_type === 'formation') {
        const created = await base44.entities.Formation.create({
          team_id: activeTeamId,
          side_of_ball: item.side_of_ball,
          formation_name: item.item_name,
          formation_family: item.concept_family || 'base',
          notes: item.short_description,
          active: true,
        });
        createdId = created.id;
        // Track import
        await base44.entities.LibraryImportMap.create({
          team_id: activeTeamId,
          library_item_id: item.id,
          library_pack_id: item.pack_id,
          import_type: 'single_item',
          imported_formation_id: createdId,
          terminology_translated: false,
          notes: `Imported from: ${item.pack_name}`,
        });
      } else {
        // Create a Play record
        const created = await base44.entities.Play.create({
          team_id: activeTeamId,
          name: item.item_name,
          play_name: item.item_name,
          short_name: item.item_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4),
          side: item.side_of_ball,
          play_family: item.concept_family,
          concept: item.concept_family,
          formation: item.formation_name,
          personnel: item.personnel,
          direction: item.direction !== 'both' ? item.direction : 'any',
          run_pass: item.run_pass !== 'n_a' && item.run_pass !== 'formation' ? item.run_pass : null,
          age_level_difficulty: item.age_level === 'youth' ? 'youth' : 'middle_school',
          risk_level: item.difficulty_level === 'beginner' ? 'low' : item.difficulty_level === 'moderate' ? 'medium' : 'high',
          coaching_points: item.coaching_points || item.short_description,
          notes: `Imported from: ${item.pack_name}`,
          tags: item.tags || [],
          is_active: true,
          is_favorite: false,
        });
        createdId = created.id;
        // Track import
        await base44.entities.LibraryImportMap.create({
          team_id: activeTeamId,
          library_item_id: item.id,
          library_pack_id: item.pack_id,
          import_type: 'single_item',
          imported_play_id: createdId,
          terminology_translated: false,
          notes: `Imported from: ${item.pack_name}`,
        });
      }
      return createdId;
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ['importMaps', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['plays', activeTeamId] });
      setImportingIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
      toast.success(`"${item.item_name}" imported to your library`);
    },
    onError: (_, item) => {
      setImportingIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
      toast.error('Import failed — please try again');
    },
  });

  const handleImport = (item) => {
    if (!activeTeamId) { toast.error('Select a team first'); return; }
    if (importedItemIds.has(item.id)) { toast.info('Already in your library'); return; }
    setImportingIds(prev => new Set(prev).add(item.id));
    importMutation.mutate(item);
  };

  // Pack import
  const handleImportPack = async (pack) => {
    if (!activeTeamId) { toast.error('Select a team first'); return; }
    const packItems = items.filter(i => i.pack_id === pack.id && !importedItemIds.has(i.id));
    if (!packItems.length) { toast.info('All items in this pack are already imported'); return; }
    const ids = new Set(packItems.map(i => i.id));
    setImportingIds(prev => new Set([...prev, ...ids]));
    let count = 0;
    for (const item of packItems) {
      await importMutation.mutateAsync(item).catch(() => {});
      count++;
    }
    toast.success(`${count} item${count !== 1 ? 's' : ''} from "${pack.pack_name}" imported`);
  };

  // ── Filtering ──
  const filteredItems = useMemo(() => {
    let result = items;
    if (side !== 'all') result = result.filter(i => i.side_of_ball === side);
    if (selectedPack) result = result.filter(i => i.pack_id === selectedPack.id);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        [i.item_name, i.short_description, i.concept_family, i.formation_name, ...(i.tags || [])]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, side, selectedPack, search]);

  const filteredPacks = useMemo(() => {
    if (side === 'all') return packs;
    return packs.filter(p => p.side_of_ball === side);
  }, [packs, side]);

  const isLoading = packsLoading || itemsLoading;

  return (
    <div className={cn("flex gap-0 h-[calc(100vh-64px)] -m-6 overflow-hidden", previewItem && "")}>
      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-border bg-card/60 shrink-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Starter Library
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {items.length} curated items across {packs.length} packs · Import to your team library
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTeamId && (
                <Badge variant="secondary" className="text-xs">
                  {importedItemIds.size} imported
                </Badge>
              )}
            </div>
          </div>

          {/* Side tabs */}
          <div className="flex items-center gap-1 mt-3 bg-secondary/60 p-1 rounded-xl w-fit">
            {SIDES.map(tab => (
              <button key={tab.value} onClick={() => { setSide(tab.value); setSelectedPack(null); setSelectedBundle(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  side === tab.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bundles strip ── */}
        {bundles.length > 0 && (
          <div className="px-6 py-2.5 border-b border-border bg-secondary/20 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Bundles</span>
              {(side === 'all' ? bundles : bundles.filter(b => b.side_of_ball === side || b.side_of_ball === 'all')).map(b => (
                <BundleChip key={b.id} bundle={b} selected={selectedBundle?.id === b.id}
                  onClick={() => { setSelectedBundle(b.id === selectedBundle?.id ? null : b); setSelectedPack(null); }} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: packs ── */}
          <div className="w-64 xl:w-72 shrink-0 border-r border-border bg-card/30 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Starter Packs</p>
              {selectedPack && (
                <button onClick={() => setSelectedPack(null)}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredPacks.map(pack => (
              <PackCard key={pack.id} pack={pack}
                selected={selectedPack?.id === pack.id}
                onClick={() => { setSelectedPack(s => s?.id === pack.id ? null : pack); setSelectedBundle(null); }} />
            ))}
          </div>

          {/* ── Center: items list ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search + selected context */}
            <div className="px-4 py-2.5 border-b border-border shrink-0 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search plays, formations, concepts…"
                  className="pl-9 h-8 text-sm bg-secondary/50 border-0" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{filteredItems.length} items</span>
            </div>

            {/* Context header */}
            {(selectedPack || selectedBundle) && (
              <div className="px-4 py-2.5 border-b border-border bg-primary/5 shrink-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {selectedPack ? selectedPack.pack_name : selectedBundle.bundle_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedPack ? selectedPack.description : selectedBundle.description}
                  </p>
                </div>
                {selectedPack && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 shrink-0"
                    onClick={() => handleImportPack(selectedPack)}
                    disabled={importMutation.isPending}>
                    <Download className="h-3.5 w-3.5" /> Import Pack
                  </Button>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <h3 className="font-semibold">No items match</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search ? 'Try a different search term' : 'Select a pack or clear your filters'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 py-1">
                  {filteredItems.map(item => (
                    <LibraryItemRow
                      key={item.id}
                      item={item}
                      imported={importedItemIds.has(item.id)}
                      onPreview={setPreviewItem}
                      onImport={handleImport}
                      isImporting={importingIds.has(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: preview panel ── */}
      {previewItem && (
        <div className="w-80 xl:w-96 shrink-0 overflow-hidden">
          <PreviewPanel
            item={previewItem}
            imported={importedItemIds.has(previewItem.id)}
            onImport={handleImport}
            isImporting={importingIds.has(previewItem.id)}
            onClose={() => setPreviewItem(null)}
          />
        </div>
      )}
    </div>
  );
}