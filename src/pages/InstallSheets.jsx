import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Download, Plus, CheckCircle2,
  Star, ChevronRight, Package, Layers, Loader2,
  Grid3x3, X, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SEED_PACKS, SEED_ITEMS, SEED_BUNDLES } from '@/lib/librarySeeds';

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ level }) {
  const styles = {
    beginner:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    intermediate: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    advanced:     'bg-red-500/15 text-red-500',
  };
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", styles[level] || styles.beginner)}>
      {level}
    </span>
  );
}

// ─── Side badge ───────────────────────────────────────────────────────────────
function SideBadge({ side }) {
  const styles = {
    offense:       'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    defense:       'bg-red-500/15 text-red-500',
    special_teams: 'bg-amber-500/15 text-amber-600',
  };
  const labels = { offense: 'OFF', defense: 'DEF', special_teams: 'ST' };
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", styles[side] || '')}>
      {labels[side] || side}
    </span>
  );
}

// ─── Library item card ────────────────────────────────────────────────────────
function LibraryItemCard({ item, imported, onImport, onPreview, selected }) {
  return (
    <div
      onClick={() => onPreview(item)}
      className={cn(
        "group relative bg-card border rounded-xl p-3.5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all",
        selected ? "border-primary/60 bg-primary/5 shadow-sm" : "border-border"
      )}
    >
      {item.starter_recommended && (
        <div className="absolute top-2.5 right-2.5">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
        </div>
      )}

      {/* Type icon */}
      <div className="flex items-center gap-2 mb-2">
        <SideBadge side={item.side_of_ball} />
        <DifficultyBadge level={item.difficulty_level} />
        {item.run_pass && item.run_pass !== 'n/a' && (
          <span className="text-[9px] text-muted-foreground font-medium uppercase">{item.run_pass}</span>
        )}
      </div>

      <h4 className="font-display font-semibold text-sm leading-tight mb-0.5">{item.item_name}</h4>
      {item.formation_name && (
        <p className="text-[10px] text-muted-foreground mb-1">{item.formation_name}</p>
      )}
      {item.short_description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.short_description}</p>
      )}

      {/* Situation tags */}
      {item.situation_tags?.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.situation_tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[8px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-medium uppercase">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Import action */}
      <div className="mt-3 flex items-center gap-2">
        {imported ? (
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold">Imported</span>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1 rounded-lg"
            onClick={e => { e.stopPropagation(); onImport(item); }}
          >
            <Plus className="h-3 w-3" /> Import
          </Button>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {item.concept_family || item.item_type?.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

// ─── Pack card ────────────────────────────────────────────────────────────────
function PackCard({ pack, items, onImportPack, importedIds, onClick, selected }) {
  const packItems = items.filter(i => i.system_family === pack.system_family && i.side_of_ball === pack.side_of_ball);
  const importedCount = packItems.filter(i => importedIds.has(i.item_name)).length;
  const allImported = packItems.length > 0 && importedCount === packItems.length;

  return (
    <div
      onClick={() => onClick(pack)}
      className={cn(
        "group bg-card border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all",
        selected ? "border-primary/60 bg-primary/5 shadow-sm" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SideBadge side={pack.side_of_ball} />
          {pack.age_level !== 'all' && (
            <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase">
              {pack.age_level?.replace('_', ' ')}
            </span>
          )}
        </div>
        {allImported && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
      </div>

      <h3 className="font-display font-bold text-sm mb-1">{pack.pack_name}</h3>
      {pack.system_family && (
        <p className="text-[10px] text-primary/70 font-semibold mb-1">{pack.system_family}</p>
      )}
      <p className="text-xs text-muted-foreground line-clamp-2">{pack.description}</p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-muted-foreground">{packItems.length} plays · {importedCount} imported</span>
        {!allImported && packItems.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1 rounded-lg"
            onClick={e => { e.stopPropagation(); onImportPack(pack); }}
          >
            <Package className="h-3 w-3" /> Import Pack
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────
function PreviewPanel({ item, imported, onImport, onClose }) {
  if (!item) return null;
  return (
    <div className="bg-card border-l border-border flex flex-col overflow-hidden w-72 xl:w-80 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-display font-bold text-sm">Preview</h3>
        <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <SideBadge side={item.side_of_ball} />
            <DifficultyBadge level={item.difficulty_level} />
            {item.starter_recommended && (
              <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                <Star className="h-2.5 w-2.5 fill-amber-400" /> Starter Pick
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-base">{item.item_name}</h2>
          {item.formation_name && <p className="text-xs text-muted-foreground">{item.formation_name}</p>}
          {item.concept_family && <p className="text-xs text-primary/70 font-semibold">{item.concept_family}</p>}
        </div>

        {/* Diagram placeholder */}
        <div className="bg-emerald-900/30 border border-emerald-700/20 rounded-xl aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 rounded-lg bg-emerald-800/40 flex items-center justify-center mx-auto mb-2">
              <Grid3x3 className="h-4 w-4 text-emerald-500/60" />
            </div>
            <p className="text-[10px] text-emerald-600/60">Diagram preview</p>
          </div>
        </div>

        {/* Description */}
        {item.short_description && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{item.short_description}</p>
          </div>
        )}

        {/* Coaching points */}
        {item.coaching_points && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Coaching Points</p>
            <p className="text-xs text-foreground leading-relaxed">{item.coaching_points}</p>
          </div>
        )}

        {/* Tags */}
        {item.situation_tags?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Situations</p>
            <div className="flex gap-1 flex-wrap">
              {item.situation_tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[9px]">{tag.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* What will be imported */}
        <div className="bg-secondary/40 rounded-xl p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">What gets imported</p>
          <ul className="space-y-1">
            {[
              item.item_type !== 'formation_template' && '✓ Play record added to your library',
              item.coaching_points && '✓ Coaching points included',
              item.situation_tags?.length > 0 && '✓ Situation tags applied',
              '✓ Fully editable — never modifies the master library',
            ].filter(Boolean).map((line, i) => (
              <li key={i} className="text-[10px] text-muted-foreground">{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Import actions */}
      <div className="p-4 border-t border-border shrink-0 space-y-2">
        {imported ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600">Already imported to your library</span>
          </div>
        ) : (
          <>
            <Button className="w-full gap-2 rounded-xl" onClick={() => onImport(item)}>
              <Plus className="h-4 w-4" /> Import to Team Library
            </Button>
            {item.formation_data && (
              <Button variant="outline" className="w-full gap-2 rounded-xl text-xs">
                <Layers className="h-3.5 w-3.5" /> Import Formation Only
              </Button>
            )}
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

  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView] = useState('packs'); // packs | browse | bundles
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);

  // Track imported items per team
  const { data: importMaps = [], refetch: refetchImports } = useQuery({
    queryKey: ['importMaps', activeTeamId],
    queryFn: () => base44.entities.LibraryImportMap.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ['plays', activeTeamId],
    queryFn: () => base44.entities.Play.filter({ team_id: activeTeamId }, 'name'),
    enabled: !!activeTeamId,
  });

  const importedItemNames = useMemo(() => {
    return new Set(importMaps.map(m => m.notes).filter(Boolean));
  }, [importMaps]);

  const importedPlayNames = useMemo(() => {
    return new Set(teamPlays.map(p => p.name));
  }, [teamPlays]);

  const isImported = (item) =>
    importedItemNames.has(item.item_name) || importedPlayNames.has(item.play_data?.name);

  // ── Import single item ────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: async (item) => {
      const importPromises = [];

      // Create play if play_data exists
      if (item.play_data && activeTeamId) {
        const playData = {
          ...item.play_data,
          team_id: activeTeamId,
          play_name: item.play_data.name,
          coaching_points: item.coaching_points || item.play_data.coaching_points || '',
          is_active: true,
        };
        const play = await base44.entities.Play.create(playData);
        importPromises.push(play);

        // Record the import
        await base44.entities.LibraryImportMap.create({
          team_id: activeTeamId,
          import_type: 'single_play',
          imported_play_id: play.id,
          notes: item.item_name,
        });
      }

      return importPromises;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plays', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['importMaps', activeTeamId] });
      toast.success(`"${selectedItem?.item_name || 'Item'}" imported to your library`);
    },
    onError: () => toast.error('Import failed. Please try again.'),
  });

  // ── Import full pack ──────────────────────────────────────────────────────
  const importPackMutation = useMutation({
    mutationFn: async (pack) => {
      const packItems = SEED_ITEMS.filter(i =>
        i.system_family === pack.system_family && i.side_of_ball === pack.side_of_ball && i.play_data
      );
      for (const item of packItems) {
        if (isImported(item)) continue;
        const play = await base44.entities.Play.create({
          ...item.play_data, team_id: activeTeamId,
          play_name: item.play_data.name,
          coaching_points: item.coaching_points || '',
          is_active: true,
        });
        await base44.entities.LibraryImportMap.create({
          team_id: activeTeamId, import_type: 'full_pack',
          imported_play_id: play.id, notes: item.item_name,
          source_pack_id: pack.pack_name,
        });
      }
    },
    onSuccess: (_, pack) => {
      queryClient.invalidateQueries({ queryKey: ['plays', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['importMaps', activeTeamId] });
      toast.success(`"${pack.pack_name}" pack imported`);
    },
  });

  // ── Filters ───────────────────────────────────────────────────────────────
  const allSystems = useMemo(() => {
    return [...new Set(SEED_ITEMS.map(i => i.system_family).filter(Boolean))].sort();
  }, []);

  const filteredItems = useMemo(() => {
    return SEED_ITEMS.filter(item => {
      if (sideFilter !== 'all' && item.side_of_ball !== sideFilter) return false;
      if (systemFilter && item.system_family !== systemFilter) return false;
      if (diffFilter && item.difficulty_level !== diffFilter) return false;
      if (typeFilter && item.item_type !== typeFilter) return false;
      if (!search) return true;
      return [item.item_name, item.formation_name, item.concept_family, item.short_description, item.system_family]
        .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    });
  }, [sideFilter, systemFilter, diffFilter, typeFilter, search]);

  const packFilteredItems = selectedPack
    ? SEED_ITEMS.filter(i => i.system_family === selectedPack.system_family && i.side_of_ball === selectedPack.side_of_ball)
    : filteredItems;

  const filteredPacks = useMemo(() => {
    return SEED_PACKS.filter(p => {
      if (sideFilter !== 'all' && p.side_of_ball !== sideFilter) return false;
      if (!search) return true;
      return [p.pack_name, p.system_family, p.description].join(' ').toLowerCase().includes(search.toLowerCase());
    });
  }, [sideFilter, search]);

  const filteredBundles = useMemo(() => {
    return SEED_BUNDLES.filter(b => {
      if (sideFilter !== 'all' && b.side_of_ball !== sideFilter && b.side_of_ball !== 'all') return false;
      return true;
    });
  }, [sideFilter]);

  const importedCount = SEED_ITEMS.filter(i => isImported(i)).length;

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left nav panel ── */}
      <div className="w-60 xl:w-64 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <h1 className="font-display font-bold text-sm">Play Library</h1>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {SEED_ITEMS.length} items · {importedCount} imported
          </p>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library…"
              className="pl-7 h-7 text-xs bg-secondary/50 border-0" />
          </div>
        </div>

        {/* Side filter */}
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
            {[['all','All'],['offense','OFF'],['defense','DEF'],['special_teams','ST']].map(([val, label]) => (
              <button key={val} onClick={() => { setSideFilter(val); setSelectedPack(null); }}
                className={cn("flex-1 text-[10px] font-bold py-1 rounded-md transition-all",
                  sideFilter === val ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2">
          {[
            { id: 'packs', icon: Package, label: 'Browse Packs' },
            { id: 'browse', icon: Grid3x3, label: 'All Plays' },
            { id: 'bundles', icon: Layers, label: 'Situation Bundles' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setView(id); setSelectedPack(null); setSelectedItem(null); }}
              className={cn("w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all",
                view === id ? "text-foreground bg-secondary/50" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30")}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}

          {/* System filter chips */}
          <div className="px-4 mt-3 mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">System</p>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => setSystemFilter('')}
                className={cn("text-left text-[11px] px-2 py-1 rounded transition-all",
                  !systemFilter ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground")}>
                All Systems
              </button>
              {allSystems.map(sys => (
                <button key={sys} onClick={() => setSystemFilter(sys === systemFilter ? '' : sys)}
                  className={cn("text-left text-[11px] px-2 py-1 rounded transition-all",
                    systemFilter === sys ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground")}>
                  {sys}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center gap-3 flex-wrap">
          {selectedPack ? (
            <>
              <button onClick={() => { setSelectedPack(null); setView('packs'); }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Packs</span>
              </button>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <h2 className="font-display font-bold text-sm">{selectedPack.pack_name}</h2>
              <Badge variant="secondary" className="text-[10px]">{selectedPack.system_family}</Badge>
            </>
          ) : (
            <h2 className="font-display font-bold text-sm">
              {view === 'packs' ? 'Starter Packs' : view === 'bundles' ? 'Situation Bundles' : 'All Plays'}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {view === 'packs' ? `${filteredPacks.length} packs` :
                 view === 'bundles' ? `${filteredBundles.length} bundles` :
                 `${filteredItems.length} plays`}
              </span>
            </h2>
          )}

          {view === 'browse' && (
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              {/* Difficulty filter */}
              <div className="flex bg-secondary rounded-lg p-0.5">
                {[['', 'All'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate']].map(([val, label]) => (
                  <button key={val} onClick={() => setDiffFilter(val)}
                    className={cn("px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                      diffFilter === val ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Starter filter */}
              <Button variant={typeFilter === 'play' ? 'default' : 'outline'} size="sm"
                className="h-7 text-[10px] gap-1" onClick={() => setTypeFilter(v => v === 'play' ? '' : 'play')}>
                <Star className="h-3 w-3" /> Plays Only
              </Button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Packs view */}
          {view === 'packs' && !selectedPack && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPacks.map((pack, i) => (
                <PackCard
                  key={i}
                  pack={pack}
                  items={SEED_ITEMS}
                  importedIds={importedItemNames}
                  onImportPack={(p) => importPackMutation.mutate(p)}
                  onClick={setSelectedPack}
                  selected={selectedPack?.pack_name === pack.pack_name}
                />
              ))}
            </div>
          )}

          {/* Pack drill-down */}
          {selectedPack && (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">{selectedPack.description}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <SideBadge side={selectedPack.side_of_ball} />
                  <span className="text-[10px] text-muted-foreground">{selectedPack.age_level?.replace('_', ' ')} level</span>
                  <Button size="sm" className="ml-auto gap-1.5 h-7 text-xs"
                    onClick={() => importPackMutation.mutate(selectedPack)}
                    disabled={importPackMutation.isPending}>
                    {importPackMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                    Import Entire Pack
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {packFilteredItems.map((item, i) => (
                  <LibraryItemCard key={i} item={item}
                    imported={isImported(item)}
                    onImport={(it) => { setSelectedItem(it); importMutation.mutate(it); }}
                    onPreview={setSelectedItem}
                    selected={selectedItem?.item_name === item.item_name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Browse all */}
          {view === 'browse' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item, i) => (
                <LibraryItemCard key={i} item={item}
                  imported={isImported(item)}
                  onImport={(it) => importMutation.mutate(it)}
                  onPreview={setSelectedItem}
                  selected={selectedItem?.item_name === item.item_name}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-3 py-16 text-center">
                  <p className="text-muted-foreground text-sm">No items match your filters.</p>
                </div>
              )}
            </div>
          )}

          {/* Bundles view */}
          {view === 'bundles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBundles.map((bundle, i) => {
                const bundleItems = SEED_ITEMS.filter(item =>
                  bundle.situation_key && item.situation_tags?.includes(bundle.situation_key.replace('def_', '').replace('st_', ''))
                  || item.situation_tags?.some(t => bundle.bundle_name.toLowerCase().includes(t.replace(/_/g, ' ')))
                ).slice(0, 6);
                return (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <SideBadge side={bundle.side_of_ball} />
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                        {bundle.bundle_type}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-sm mb-1">{bundle.bundle_name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{bundle.description}</p>
                    {bundleItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {bundleItems.map(item => (
                          <span key={item.item_name} className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                            {item.item_name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5"
                      onClick={() => {
                        bundleItems.forEach(item => {
                          if (!isImported(item) && item.play_data) importMutation.mutate(item);
                        });
                      }}
                      disabled={importMutation.isPending}>
                      <Download className="h-3 w-3" /> Import Bundle
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Preview panel ── */}
      {selectedItem && (
        <PreviewPanel
          item={selectedItem}
          imported={isImported(selectedItem)}
          onImport={(item) => importMutation.mutate(item)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}