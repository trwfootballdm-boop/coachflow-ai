import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, BookOpen, Shield, Zap, Download, Star, ChevronRight,
  Layers, Package, Filter, CheckCircle, X, Tag, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SIDE_COLORS = {
  offense: { bg: 'bg-emerald-900/30', border: 'border-emerald-700/40', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  defense: { bg: 'bg-blue-900/30',    border: 'border-blue-700/40',    text: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  special_teams: { bg: 'bg-amber-900/30', border: 'border-amber-700/40', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  all: { bg: 'bg-purple-900/30', border: 'border-purple-700/40', text: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
};

const DIFF_COLORS = {
  beginner: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  moderate: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  advanced: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const TYPE_LABELS = {
  play: 'Play', formation: 'Formation', motion_tag: 'Motion',
  concept_shell: 'Concept', defensive_call: 'Defense', special_teams: 'Spec. Teams', drill: 'Drill',
};

const SIDE_ICON = { offense: '⚔️', defense: '🛡️', special_teams: '⚡' };

const PACK_ICONS = {
  offense: '🏈', defense: '🛡️', special_teams: '⚡',
  formation: '📐', concept: '💡', situation: '📋',
};

// ─── Pack Card ─────────────────────────────────────────────────────────────────
function PackCard({ pack, isSelected, onClick, itemCount }) {
  const colors = SIDE_COLORS[pack.side_of_ball] || SIDE_COLORS.offense;
  return (
    <button onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-150",
        "bg-gray-900 hover:bg-gray-800",
        isSelected ? `${colors.border} ring-1 ring-inset ring-current` : 'border-gray-800',
        isSelected && colors.text
      )}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl leading-none">{PACK_ICONS[pack.pack_type] || '📦'}</div>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", colors.badge)}>
          {pack.side_of_ball}
        </span>
      </div>
      <div className="mt-2">
        <p className="font-display font-semibold text-sm text-white leading-snug">{pack.pack_name}</p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{pack.description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">{itemCount} items</span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition-colors", isSelected ? colors.text : 'text-gray-600')} />
      </div>
    </button>
  );
}

// ─── Bundle Card ───────────────────────────────────────────────────────────────
function BundleCard({ bundle, onImport, importing }) {
  const colors = SIDE_COLORS[bundle.side_of_ball] || SIDE_COLORS.all;
  return (
    <div className={cn("p-4 rounded-2xl border bg-gray-900", colors.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{bundle.icon_emoji || '📋'}</span>
            <p className="font-display font-semibold text-sm text-white">{bundle.bundle_name}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{bundle.description}</p>
        </div>
        <Button size="sm" onClick={onImport} disabled={importing}
          className="shrink-0 text-xs h-7 rounded-xl gap-1.5 bg-gray-700 hover:bg-gray-600 text-white">
          <Download className="h-3 w-3" />
          Import
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", colors.badge)}>
          {bundle.side_of_ball}
        </span>
        <span className="text-[10px] text-gray-500">{bundle.item_ids?.length || 0} items</span>
      </div>
    </div>
  );
}

// ─── Library Item Row ──────────────────────────────────────────────────────────
function LibraryItemRow({ item, isSelected, onSelect, onImport, importing }) {
  const colors = SIDE_COLORS[item.side_of_ball] || SIDE_COLORS.offense;
  return (
    <div onClick={() => onSelect(item)}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
        "hover:bg-gray-800",
        isSelected ? `bg-gray-800 ${colors.border}` : 'bg-gray-900 border-gray-800'
      )}>
      <div className={cn("mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0", colors.bg)}>
        {SIDE_ICON[item.side_of_ball] || '📋'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white leading-tight">{item.item_name}</p>
          {item.starter_recommended && <Star className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" />}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{item.short_description}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border", colors.badge)}>
            {TYPE_LABELS[item.item_type] || item.item_type}
          </span>
          {item.difficulty_level && (
            <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border", DIFF_COLORS[item.difficulty_level])}>
              {item.difficulty_level}
            </span>
          )}
          {item.formation_name && (
            <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800">
              {item.formation_name}
            </span>
          )}
          {item.run_pass && item.run_pass !== 'formation' && item.run_pass !== 'n_a' && (
            <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 uppercase">
              {item.run_pass}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Item Detail Panel ─────────────────────────────────────────────────────────
function ItemDetailPanel({ item, onImport, importing, onClose }) {
  if (!item) return null;
  const colors = SIDE_COLORS[item.side_of_ball] || SIDE_COLORS.offense;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{SIDE_ICON[item.side_of_ball]}</span>
            <h3 className="font-display font-bold text-white">{item.item_name}</h3>
            {item.starter_recommended && <Star className="h-4 w-4 text-amber-400" fill="currentColor" />}
          </div>
          <p className="text-xs text-gray-400 mt-1">{item.pack_name}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border", colors.badge)}>
            {item.side_of_ball}
          </span>
          <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full border", DIFF_COLORS[item.difficulty_level])}>
            {item.difficulty_level}
          </span>
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-gray-700 text-gray-400 bg-gray-800">
            {TYPE_LABELS[item.item_type]}
          </span>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-300 leading-relaxed">{item.short_description}</p>
        </div>

        {/* Coaching Points */}
        {item.coaching_points && (
          <div className={cn("p-3 rounded-xl border", colors.bg, colors.border)}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'inherit' }}>
              🎯 Coaching Points
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">{item.coaching_points}</p>
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          {item.formation_name && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Formation</p>
              <p className="text-xs font-semibold text-gray-300">{item.formation_name}</p>
            </div>
          )}
          {item.concept_family && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Concept</p>
              <p className="text-xs font-semibold text-gray-300 capitalize">{item.concept_family.replace(/_/g, ' ')}</p>
            </div>
          )}
          {item.run_pass && item.run_pass !== 'n_a' && item.run_pass !== 'formation' && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Type</p>
              <p className="text-xs font-semibold text-gray-300 uppercase">{item.run_pass}</p>
            </div>
          )}
          {item.direction && item.direction !== 'both' && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Direction</p>
              <p className="text-xs font-semibold text-gray-300 capitalize">{item.direction}</p>
            </div>
          )}
          {item.age_level && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Age Level</p>
              <p className="text-xs font-semibold text-gray-300 capitalize">{item.age_level.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Action */}
      <div className="p-4 border-t border-gray-800">
        <Button onClick={onImport} disabled={importing} className="w-full gap-2 rounded-xl">
          <Download className="h-4 w-4" />
          {importing ? 'Importing…' : 'Import to My Playbook'}
        </Button>
        <p className="text-[10px] text-gray-600 text-center mt-2">
          Creates an editable copy in your team's playbook
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PlaybookLibrary() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [view, setView] = useState('packs'); // 'packs' | 'bundles'
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [importingId, setImportingId] = useState(null);

  const { data: packs = [] } = useQuery({
    queryKey: ['library-packs'],
    queryFn: () => base44.entities.LibraryPack.list('sort_order', 20),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['library-items'],
    queryFn: () => base44.entities.LibraryItem.list('sort_order', 200),
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['library-bundles'],
    queryFn: () => base44.entities.LibraryBundle.list('sort_order', 20),
  });

  const importMutation = useMutation({
    mutationFn: async (item) => {
      if (!activeTeamId) throw new Error('No team selected');
      const newPlay = await base44.entities.Play.create({
        team_id: activeTeamId,
        name: item.item_name,
        play_name: item.item_name,
        side: item.side_of_ball,
        formation: item.formation_name || '',
        play_family: item.concept_family || '',
        run_pass: ['run', 'pass', 'rpo', 'special_teams'].includes(item.run_pass) ? item.run_pass : undefined,
        coaching_points: item.coaching_points || '',
        tags: item.tags || [],
        is_active: true,
        diagram_data: item.diagram_data || null,
      });
      await base44.entities.LibraryImportMap.create({
        team_id: activeTeamId,
        library_item_id: item.id,
        import_type: 'single_item',
        imported_play_id: newPlay.id,
      });
      return newPlay;
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ['plays'] });
      toast.success(`"${item.item_name}" imported to your playbook`);
      setImportingId(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Import failed');
      setImportingId(null);
    },
  });

  const handleImport = (item) => {
    if (!activeTeamId) { toast.error('Select a team first'); return; }
    setImportingId(item.id);
    importMutation.mutate(item);
  };

  const handleImportBundle = async (bundle) => {
    if (!activeTeamId) { toast.error('Select a team first'); return; }
    const bundleItems = allItems.filter(i => bundle.item_ids?.includes(i.id));
    if (!bundleItems.length) { toast.error('No items found in this bundle'); return; }
    setImportingId(bundle.id);
    try {
      await Promise.all(bundleItems.map(item => importMutation.mutateAsync(item)));
      await base44.entities.LibraryImportMap.create({
        team_id: activeTeamId,
        library_bundle_id: bundle.id,
        import_type: 'bundle',
      });
      toast.success(`Bundle "${bundle.bundle_name}" imported — ${bundleItems.length} items added`);
    } catch (e) {
      toast.error('Bundle import failed');
    }
    setImportingId(null);
  };

  // Filtered items for selected pack
  const packItems = useMemo(() => {
    let items = selectedPack
      ? allItems.filter(i => i.pack_id === selectedPack.id)
      : allItems;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.item_name?.toLowerCase().includes(q) ||
        i.short_description?.toLowerCase().includes(q) ||
        i.concept_family?.toLowerCase().includes(q) ||
        i.formation_name?.toLowerCase().includes(q) ||
        i.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterSide !== 'all') items = items.filter(i => i.side_of_ball === filterSide);
    if (filterDiff !== 'all') items = items.filter(i => i.difficulty_level === filterDiff);
    if (filterType !== 'all') items = items.filter(i => i.item_type === filterType);
    return items;
  }, [allItems, selectedPack, search, filterSide, filterDiff, filterType]);

  const packItemCounts = useMemo(() => {
    const counts = {};
    allItems.forEach(i => { counts[i.pack_id] = (counts[i.pack_id] || 0) + 1; });
    return counts;
  }, [allItems]);

  const hasFilters = search || filterSide !== 'all' || filterDiff !== 'all' || filterType !== 'all';

  return (
    <div className="-m-6 flex h-[calc(100vh-0px)] overflow-hidden bg-gray-950 text-white font-body">
      {/* ── Left: Packs / Bundles sidebar ── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-800 bg-gray-950">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-lg">Play Library</h1>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Browse curated starter content. Import what fits your team.
          </p>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-800 overflow-hidden mt-3">
            {[['packs', <Package className="h-3.5 w-3.5" />, 'Packs'], ['bundles', <Layers className="h-3.5 w-3.5" />, 'Bundles']].map(([v, icon, label]) => (
              <button key={v} onClick={() => { setView(v); setSelectedPack(null); }}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold transition-colors",
                  view === v ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300')}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Pack / Bundle list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {view === 'packs' && (
            <>
              <button onClick={() => setSelectedPack(null)}
                className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                  !selectedPack ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900')}>
                All Content ({allItems.length})
              </button>
              {packs.map(pack => (
                <PackCard key={pack.id} pack={pack}
                  isSelected={selectedPack?.id === pack.id}
                  onClick={() => { setSelectedPack(pack); setSelectedItem(null); }}
                  itemCount={packItemCounts[pack.id] || 0} />
              ))}
            </>
          )}
          {view === 'bundles' && bundles.map(bundle => (
            <BundleCard key={bundle.id} bundle={bundle}
              onImport={() => handleImportBundle(bundle)}
              importing={importingId === bundle.id} />
          ))}
        </div>
      </div>

      {/* ── Center: Items list ── */}
      <div className={cn("flex flex-col border-r border-gray-800", selectedItem ? 'w-80 shrink-0' : 'flex-1')}>
        {/* Search + filters */}
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search plays, formations, concepts…"
              className="pl-8 h-8 text-xs bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 rounded-xl" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[['all','All'], ['offense','Off'], ['defense','Def'], ['special_teams','ST']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterSide(v)}
                className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-colors",
                  filterSide === v ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-800 text-gray-500 hover:text-gray-300')}>
                {l}
              </button>
            ))}
            <div className="w-px bg-gray-800 mx-0.5" />
            {[['all','All'], ['beginner','Beg'], ['moderate','Mod'], ['advanced','Adv']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterDiff(v)}
                className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-colors",
                  filterDiff === v ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-800 text-gray-500 hover:text-gray-300')}>
                {l}
              </button>
            ))}
            {hasFilters && (
              <button onClick={() => { setSearch(''); setFilterSide('all'); setFilterDiff('all'); setFilterType('all'); }}
                className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-1 flex items-center gap-0.5">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Header for active pack */}
        {selectedPack && (
          <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{selectedPack.pack_name}</p>
              <p className="text-[10px] text-gray-500">{packItems.length} items</p>
            </div>
            <button onClick={() => setSelectedPack(null)} className="text-gray-600 hover:text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Starred items section (when no pack selected and no search) */}
        {!selectedPack && !hasFilters && (
          <div className="px-3 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1 mb-2">
              <Star className="h-3 w-3" fill="currentColor" /> Starter Recommended
            </p>
            <div className="space-y-1.5 mb-3">
              {packItems.filter(i => i.starter_recommended).slice(0, 4).map(item => (
                <LibraryItemRow key={item.id} item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={setSelectedItem}
                  onImport={() => handleImport(item)}
                  importing={importingId === item.id} />
              ))}
            </div>
            <div className="border-t border-gray-800 pt-3 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">All Content</p>
            </div>
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {packItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-8 w-8 text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No items match your filters</p>
              <button onClick={() => { setSearch(''); setFilterSide('all'); setFilterDiff('all'); }}
                className="text-xs text-primary mt-2 hover:underline">Clear filters</button>
            </div>
          ) : (
            (selectedPack || hasFilters ? packItems : packItems.filter(i => !i.starter_recommended)).map(item => (
              <LibraryItemRow key={item.id} item={item}
                isSelected={selectedItem?.id === item.id}
                onSelect={setSelectedItem}
                onImport={() => handleImport(item)}
                importing={importingId === item.id} />
            ))
          )}
        </div>

        {/* Footer count */}
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">{packItems.length} items</span>
          <span className="text-[10px] text-gray-600">{allItems.filter(i => i.starter_recommended).length} ⭐ recommended</span>
        </div>
      </div>

      {/* ── Right: Detail panel ── */}
      {selectedItem && (
        <div className="w-80 shrink-0">
          <ItemDetailPanel
            item={selectedItem}
            onImport={() => handleImport(selectedItem)}
            importing={importingId === selectedItem.id}
            onClose={() => setSelectedItem(null)}
          />
        </div>
      )}
    </div>
  );
}