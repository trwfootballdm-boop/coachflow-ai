import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Filter, Download, CheckCircle2,
  Loader2, ChevronRight, Package, Layers, Tag,
  ShieldHalf, Zap, Star, Plus, X, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Difficulty badge ─────────────────────────────────────────────────────────
const DIFF_COLORS = {
  beginner:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  intermediate: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  advanced:     'bg-red-500/15 text-red-600 dark:text-red-400',
};

// ─── Side icon ───────────────────────────────────────────────────────────────
const SIDE_ICON = { offense: '⚡', defense: '🛡', special_teams: '🏈' };

// ─── Item card ────────────────────────────────────────────────────────────────
function LibraryItemCard({ item, imported, onPreview, onImport, importing }) {
  const typeColors = {
    play:          'bg-primary/10 text-primary',
    formation:     'bg-violet-500/10 text-violet-500',
    concept_shell: 'bg-sky-500/10 text-sky-500',
    defensive_look:'bg-red-500/10 text-red-500',
    special_teams: 'bg-amber-500/10 text-amber-600',
    motion_tag:    'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className={cn(
      "group bg-card border rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer",
      imported ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
    )}
      onClick={() => onPreview(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold truncate">{item.item_name}</span>
            {item.starter_recommended && <Star className="h-3 w-3 text-accent shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", typeColors[item.item_type] || 'bg-secondary text-muted-foreground')}>
              {item.item_type?.replace(/_/g, ' ')}
            </span>
            {item.difficulty_level && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", DIFF_COLORS[item.difficulty_level])}>
                {item.difficulty_level}
              </span>
            )}
            {item.formation_name && (
              <span className="text-[10px] text-muted-foreground">{item.formation_name}</span>
            )}
          </div>
          {item.short_description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.short_description}</p>
          )}
          {item.situation_tags?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {item.situation_tags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {imported ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" /> Imported
            </span>
          ) : (
            <Button size="sm" className="h-7 text-[10px] gap-1 rounded-lg px-2"
              onClick={e => { e.stopPropagation(); onImport(item); }}
              disabled={importing}>
              {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Import
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pack card ────────────────────────────────────────────────────────────────
function PackCard({ pack, importCount, totalCount, onImportPack, importing, onSelect, isActive }) {
  const sideColors = {
    offense:       'from-emerald-600/20 to-emerald-900/10 border-emerald-700/30',
    defense:       'from-red-600/20 to-red-900/10 border-red-700/30',
    special_teams: 'from-amber-600/20 to-amber-900/10 border-amber-700/30',
    all:           'from-gray-600/20 to-gray-900/10 border-gray-700/30',
  };

  return (
    <div
      onClick={() => onSelect(pack)}
      className={cn(
        "group border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-sm",
        "bg-gradient-to-br",
        sideColors[pack.side_of_ball] || sideColors.all,
        isActive ? "ring-2 ring-primary" : ""
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{SIDE_ICON[pack.side_of_ball] || '📋'}</span>
              <h3 className="font-display font-bold text-sm">{pack.pack_name}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {pack.age_level && (
                <Badge variant="secondary" className="text-[9px]">{pack.age_level.replace('_', ' ')}</Badge>
              )}
              {pack.system_family && (
                <span className="text-[10px] text-muted-foreground">{pack.system_family}</span>
              )}
            </div>
          </div>
          {totalCount > 0 && (
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-muted-foreground">{importCount}/{totalCount}</div>
              <div className="text-[9px] text-muted-foreground">imported</div>
              {/* Progress bar */}
              <div className="mt-1 w-12 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${totalCount ? (importCount / totalCount) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
        {pack.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{pack.description}</p>
        )}
      </div>
      <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{totalCount || 0} items</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2"
          onClick={e => { e.stopPropagation(); onImportPack(pack); }}
          disabled={importing || importCount === totalCount}>
          {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          {importCount === totalCount && totalCount > 0 ? 'All Imported' : 'Import Pack'}
        </Button>
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────
function PreviewPanel({ item, imported, onImport, importing, onClose }) {
  if (!item) return null;
  return (
    <div className="w-80 xl:w-96 shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Preview</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-secondary transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-lg">{item.item_name}</h2>
            {item.starter_recommended && (
              <Badge className="text-[9px] bg-accent/15 text-accent border-accent/30 gap-1">
                <Star className="h-2.5 w-2.5" /> Starter Pick
              </Badge>
            )}
          </div>
          {item.short_name && (
            <code className="text-xs text-primary/80 font-mono mt-0.5 block">{item.short_name}</code>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Type', item.item_type?.replace(/_/g, ' ')],
            ['Side', item.side_of_ball?.replace('_', ' ')],
            ['Formation', item.formation_name],
            ['Concept', item.concept_family],
            ['Run/Pass', item.run_pass],
            ['Difficulty', item.difficulty_level],
            ['Age Level', item.age_level],
            ['Play Family', item.play_family],
          ].filter(([, v]) => !!v).map(([label, val]) => (
            <div key={label} className="bg-secondary/50 rounded-lg p-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="font-semibold capitalize mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {item.short_description && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground">{item.short_description}</p>
          </div>
        )}

        {item.coaching_points && (
          <div className="bg-secondary/30 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Coaching Points</p>
            <p className="text-sm">{item.coaching_points}</p>
          </div>
        )}

        {item.situation_tags?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Situations</p>
            <div className="flex flex-wrap gap-1.5">
              {item.situation_tags.map(t => (
                <span key={t} className="text-[10px] bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What gets imported */}
        <div className="bg-secondary/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">What's Imported</p>
          <div className="space-y-1">
            {item.item_type === 'play' && (
              <>
                <p className="text-xs flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Editable play record in your library</p>
                {item.coaching_points && <p className="text-xs flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Coaching points & notes</p>}
                {item.situation_tags?.length > 0 && <p className="text-xs flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Situation tags</p>}
              </>
            )}
            {item.item_type === 'formation' && (
              <p className="text-xs flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Editable Formation record</p>
            )}
            <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Info className="h-3 w-3" /> Master library item is not modified</p>
          </div>
        </div>

        <Button
          className="w-full gap-2 rounded-xl"
          onClick={() => onImport(item)}
          disabled={imported || importing}
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> :
           imported ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {imported ? 'Already Imported' : 'Import to My Library'}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StarterLibrary() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [side, setSide] = useState('offense');
  const [search, setSearch] = useState('');
  const [activePackId, setActivePackId] = useState(null);
  const [view, setView] = useState('packs'); // 'packs' | 'bundles' | 'browse'
  const [filters, setFilters] = useState({ difficulty: 'all', type: 'all', starter: false });
  const [previewItem, setPreviewItem] = useState(null);
  const [importingId, setImportingId] = useState(null);

  // Data
  const { data: packs = [], isLoading: packsLoading } = useQuery({
    queryKey: ['libraryPacks'],
    queryFn: () => base44.entities.LibraryPack.list('sort_order'),
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['libraryItems'],
    queryFn: () => base44.entities.LibraryItem.list('sort_order'),
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['libraryBundles'],
    queryFn: () => base44.entities.LibraryBundle.list('sort_order'),
  });

  const { data: importMaps = [] } = useQuery({
    queryKey: ['libraryImports', activeTeamId],
    queryFn: () => base44.entities.LibraryImportMap.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  // Build set of already-imported item IDs
  const importedIds = useMemo(() => new Set(importMaps.map(m => m.source_item_id)), [importMaps]);

  // Import a single play item
  const importMutation = useMutation({
    mutationFn: async (item) => {
      const payload = item.import_payload || {};
      // Create Play
      const playData = {
        team_id: activeTeamId,
        name: item.item_name,
        play_name: item.item_name,
        short_name: item.short_name || '',
        side: item.side_of_ball,
        formation: item.formation_name || '',
        concept: item.concept_family || '',
        play_family: item.play_family || '',
        run_pass: item.run_pass || '',
        coaching_points: item.coaching_points || '',
        down_distance_tags: item.down_distance_tags || [],
        field_zone_tags: item.field_zone_tags || [],
        tags: item.situation_tags || [],
        is_active: true,
        is_favorite: false,
        ...payload,
      };
      let createdPlay = null;
      if (item.item_type === 'play' || item.item_type === 'concept_shell' || item.item_type === 'defensive_look' || item.item_type === 'special_teams') {
        createdPlay = await base44.entities.Play.create(playData);
      }
      let createdFormation = null;
      if (item.item_type === 'formation' || item.formation_name) {
        createdFormation = await base44.entities.Formation.create({
          team_id: activeTeamId,
          side_of_ball: item.side_of_ball,
          formation_name: item.formation_name || item.item_name,
          formation_family: item.play_family || 'base',
          notes: item.short_description || '',
        }).catch(() => null); // Formation import is best-effort
      }
      // Track import
      await base44.entities.LibraryImportMap.create({
        team_id: activeTeamId,
        source_item_id: item.id,
        imported_play_id: createdPlay?.id || null,
        imported_formation_id: createdFormation?.id || null,
        import_type: item.item_type === 'formation' ? 'formation' : 'single_play',
        terminology_translated: false,
      });
      return { play: createdPlay, formation: createdFormation };
    },
    onSuccess: (result, item) => {
      queryClient.invalidateQueries({ queryKey: ['libraryImports', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['plays', activeTeamId] });
      toast.success(`"${item.item_name}" imported to your library`);
      setImportingId(null);
    },
    onError: (err, item) => {
      toast.error(`Import failed: ${err.message}`);
      setImportingId(null);
    },
  });

  const handleImport = (item) => {
    if (importedIds.has(item.id)) { toast.info('Already imported'); return; }
    setImportingId(item.id);
    importMutation.mutate(item);
  };

  // Import a full pack
  const handleImportPack = async (pack) => {
    const packItems = items.filter(i => i.pack_id === pack.id && !importedIds.has(i.id));
    if (!packItems.length) { toast.info('All items in this pack are already imported'); return; }
    toast.info(`Importing ${packItems.length} items from "${pack.pack_name}"…`);
    for (const item of packItems) {
      await importMutation.mutateAsync(item).catch(() => {});
    }
    toast.success(`Pack "${pack.pack_name}" imported`);
  };

  // Import a bundle
  const handleImportBundle = async (bundle) => {
    const bundleItems = items.filter(i => bundle.item_ids?.includes(i.id) && !importedIds.has(i.id));
    if (!bundleItems.length) { toast.info('All bundle items already imported'); return; }
    toast.info(`Importing ${bundleItems.length} items from "${bundle.bundle_name}"…`);
    for (const item of bundleItems) {
      await importMutation.mutateAsync(item).catch(() => {});
    }
    toast.success(`Bundle "${bundle.bundle_name}" imported`);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (item.side_of_ball !== side) return false;
      if (activePackId && item.pack_id !== activePackId) return false;
      if (filters.difficulty !== 'all' && item.difficulty_level !== filters.difficulty) return false;
      if (filters.type !== 'all' && item.item_type !== filters.type) return false;
      if (filters.starter && !item.starter_recommended) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![item.item_name, item.formation_name, item.concept_family, item.play_family, item.short_description]
          .filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, side, activePackId, filters, search]);

  const sidePacks = packs.filter(p => p.side_of_ball === side || p.side_of_ball === 'all');

  const isLoading = packsLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state — library not seeded
  if (!isLoading && packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-5 rounded-2xl bg-secondary">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold">Starter Library Not Seeded</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          The master library needs to be seeded with starter content. Contact your admin or use the seed data tool to initialize the library.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-[calc(100vh-64px)] -m-6 overflow-hidden", previewItem && "")}>
      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold">Starter Library</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} plays & templates · {importedIds.size} imported to your team
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-secondary rounded-lg p-0.5">
                {['packs', 'bundles', 'browse'].map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                      view === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side tabs */}
          <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl w-fit">
            {[
              { value: 'offense', label: 'Offense' },
              { value: 'defense', label: 'Defense' },
              { value: 'special_teams', label: 'Special Teams' },
            ].map(tab => (
              <button key={tab.value} onClick={() => { setSide(tab.value); setActivePackId(null); }}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  side === tab.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {tab.label}
                <span className={cn("ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  side === tab.value ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                  {items.filter(i => i.side_of_ball === tab.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search plays, formations, concepts…"
                className="pl-9 h-9 bg-secondary/50 border-0 rounded-xl" />
            </div>
            <Select value={filters.difficulty} onValueChange={v => setFilters(f => ({ ...f, difficulty: v }))}>
              <SelectTrigger className="h-9 w-36 text-xs bg-secondary/50 border-0 rounded-xl">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={v => setFilters(f => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9 w-36 text-xs bg-secondary/50 border-0 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="play">Plays</SelectItem>
                <SelectItem value="formation">Formations</SelectItem>
                <SelectItem value="concept_shell">Concept Shells</SelectItem>
                <SelectItem value="defensive_look">Defensive</SelectItem>
                <SelectItem value="special_teams">Special Teams</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setFilters(f => ({ ...f, starter: !f.starter }))}
              className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all border",
                filters.starter ? "bg-accent/10 text-accent border-accent/30" : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground"
              )}>
              <Star className="h-3.5 w-3.5" /> Starter Picks
            </button>
            {activePackId && (
              <button onClick={() => setActivePackId(null)}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <X className="h-3 w-3" /> Clear pack filter
              </button>
            )}
          </div>

          {/* ── Packs view ── */}
          {view === 'packs' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sidePacks.map(pack => {
                  const packItems = items.filter(i => i.pack_id === pack.id);
                  const importedCount = packItems.filter(i => importedIds.has(i.id)).length;
                  return (
                    <PackCard
                      key={pack.id}
                      pack={pack}
                      importCount={importedCount}
                      totalCount={packItems.length}
                      onImportPack={handleImportPack}
                      importing={importMutation.isPending}
                      onSelect={(p) => { setActivePackId(p.id); setView('browse'); }}
                      isActive={activePackId === pack.id}
                    />
                  );
                })}
              </div>

              {/* Starter picks */}
              <div>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent" /> Starter Picks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.filter(i => i.side_of_ball === side && i.starter_recommended).map(item => (
                    <LibraryItemCard
                      key={item.id}
                      item={item}
                      imported={importedIds.has(item.id)}
                      onPreview={setPreviewItem}
                      onImport={handleImport}
                      importing={importingId === item.id && importMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Bundles view ── */}
          {view === 'bundles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bundles.filter(b => b.side_of_ball === side || b.side_of_ball === 'all').map(bundle => {
                const bundleItems = items.filter(i => bundle.item_ids?.includes(i.id));
                const importedCount = bundleItems.filter(i => importedIds.has(i.id)).length;
                return (
                  <div key={bundle.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-sm">{bundle.bundle_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[9px]">{bundle.bundle_type?.replace('_', ' ')}</Badge>
                          <span className="text-[10px] text-muted-foreground">{bundleItems.length} plays</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-muted-foreground">{importedCount}/{bundleItems.length}</div>
                        <div className="mt-1 w-10 h-1 bg-secondary rounded-full overflow-hidden ml-auto">
                          <div className="h-full bg-primary" style={{ width: `${bundleItems.length ? (importedCount / bundleItems.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                    {bundle.description && <p className="text-xs text-muted-foreground">{bundle.description}</p>}
                    <div className="flex flex-wrap gap-1">
                      {bundleItems.slice(0, 4).map(i => (
                        <span key={i.id} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground truncate max-w-[100px]">
                          {i.item_name}
                        </span>
                      ))}
                      {bundleItems.length > 4 && <span className="text-[10px] text-muted-foreground">+{bundleItems.length - 4} more</span>}
                    </div>
                    <Button size="sm" className="w-full gap-2 rounded-xl h-8 text-xs"
                      onClick={() => handleImportBundle(bundle)}
                      disabled={importMutation.isPending || importedCount === bundleItems.length}>
                      <Download className="h-3.5 w-3.5" />
                      {importedCount === bundleItems.length ? 'All Imported' : `Import Bundle (${bundleItems.length - importedCount} new)`}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Browse view ── */}
          {view === 'browse' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {filteredItems.length} items{activePackId ? ` in selected pack` : ''}
                </p>
              </div>
              {filteredItems.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No items match your filters</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredItems.map(item => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    imported={importedIds.has(item.id)}
                    onPreview={setPreviewItem}
                    onImport={handleImport}
                    importing={importingId === item.id && importMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right preview panel ── */}
      {previewItem && (
        <PreviewPanel
          item={previewItem}
          imported={importedIds.has(previewItem.id)}
          onImport={handleImport}
          importing={importingId === previewItem.id && importMutation.isPending}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}