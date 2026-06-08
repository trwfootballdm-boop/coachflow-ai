import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Download, Eye, ChevronRight, Star, Zap,
  Shield, Users, BookOpen, Package, Layers, X, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LibraryItemPreview from '@/components/library/LibraryItemPreview';
import LibraryImportDialog from '@/components/library/LibraryImportDialog';

const SIDE_TABS = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'offense', label: 'Offense', icon: Zap },
  { key: 'defense', label: 'Defense', icon: Shield },
  { key: 'special_teams', label: 'Special Teams', icon: Star },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'play', label: 'Plays' },
  { key: 'formation', label: 'Formations' },
  { key: 'defensive_call', label: 'Defensive Calls' },
  { key: 'special_teams', label: 'Special Teams' },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const SIDE_COLORS = {
  offense: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  defense: 'bg-red-500/10 text-red-700 dark:text-red-400',
  special_teams: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
};

const PACK_ICONS = {
  offense: '⚡',
  defense: '🛡️',
  special_teams: '⭐',
  formation: '📐',
  concept: '🧠',
  situation: '🎯',
};

export default function PlayLibraryBrowser() {
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [importItem, setImportItem] = useState(null);
  const [view, setView] = useState('packs'); // 'packs' | 'pack_detail' | 'bundles'

  const { data: packs = [] } = useQuery({
    queryKey: ['libraryPacks'],
    queryFn: () => base44.entities.LibraryPack.list('sort_order'),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['libraryItems'],
    queryFn: () => base44.entities.LibraryItem.list('sort_order'),
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['libraryBundles'],
    queryFn: () => base44.entities.LibraryBundle.list('sort_order'),
  });

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedPack) items = items.filter(i => i.pack_id === selectedPack.id);
    if (activeTab !== 'all') items = items.filter(i => i.side_of_ball === activeTab);
    if (typeFilter !== 'all') items = items.filter(i => i.item_type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.item_name?.toLowerCase().includes(q) ||
        i.concept_family?.toLowerCase().includes(q) ||
        i.formation_name?.toLowerCase().includes(q) ||
        i.short_description?.toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allItems, selectedPack, activeTab, typeFilter, searchQuery]);

  const visiblePacks = useMemo(() => {
    if (activeTab === 'all') return packs;
    return packs.filter(p => p.side_of_ball === activeTab);
  }, [packs, activeTab]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {selectedPack && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedPack(null); setView('packs'); }}
                className="gap-1.5 rounded-xl text-muted-foreground h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Packs
              </Button>
            )}
            <div>
              <h1 className="font-display font-bold text-xl">
                {selectedPack ? selectedPack.pack_name : 'Play Library'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedPack
                  ? selectedPack.description
                  : `${allItems.length} starter items across ${packs.length} packs`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'packs' ? 'default' : 'outline'}
              size="sm" onClick={() => { setView('packs'); setSelectedPack(null); }}
              className="gap-1.5 rounded-xl h-8 text-xs">
              <Package className="h-3.5 w-3.5" /> Packs
            </Button>
            <Button
              variant={view === 'bundles' ? 'default' : 'outline'}
              size="sm" onClick={() => setView('bundles')}
              className="gap-1.5 rounded-xl h-8 text-xs">
              <Layers className="h-3.5 w-3.5" /> Bundles
            </Button>
          </div>
        </div>

        {/* Side tabs */}
        <div className="flex gap-1 mt-3">
          {SIDE_TABS.map(tab => (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedPack(null); setView('packs'); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}>
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* PACKS VIEW */}
          {view === 'packs' && !selectedPack && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visiblePacks.map(pack => {
                  const packItems = allItems.filter(i => i.pack_id === pack.id);
                  const starterCount = packItems.filter(i => i.starter_recommended).length;
                  return (
                    <div key={pack.id}
                      onClick={() => { setSelectedPack(pack); setView('pack_detail'); }}
                      className="group cursor-pointer border border-border rounded-2xl bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{PACK_ICONS[pack.pack_type] || '📦'}</span>
                        <Badge className={cn("text-[10px] capitalize", SIDE_COLORS[pack.side_of_ball])}>
                          {pack.side_of_ball}
                        </Badge>
                      </div>
                      <h3 className="font-display font-bold text-sm leading-tight mb-1.5">{pack.pack_name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {pack.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground">{packItems.length} items</span>
                          {starterCount > 0 && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              · {starterCount} ⭐ starter
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All items search */}
              <div className="border-t border-border pt-6">
                <h2 className="font-display font-bold text-base mb-3">Browse All Items</h2>
                <ItemGrid
                  items={filteredItems}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onPreview={setPreviewItem}
                  onImport={setImportItem}
                />
              </div>
            </>
          )}

          {/* PACK DETAIL VIEW */}
          {view === 'pack_detail' && selectedPack && (
            <ItemGrid
              items={filteredItems}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onPreview={setPreviewItem}
              onImport={setImportItem}
            />
          )}

          {/* BUNDLES VIEW */}
          {view === 'bundles' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Situation bundles let you import a curated group of plays at once.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map(bundle => (
                  <BundleCard key={bundle.id} bundle={bundle}
                    items={allItems}
                    onPreview={() => setSelectedBundle(bundle)}
                    onImport={() => setImportItem({ bundle })} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview panel */}
        {previewItem && (
          <div className="w-96 border-l border-border bg-card shrink-0 overflow-y-auto">
            <LibraryItemPreview
              item={previewItem}
              onClose={() => setPreviewItem(null)}
              onImport={() => { setImportItem(previewItem); setPreviewItem(null); }}
            />
          </div>
        )}
      </div>

      {/* Import dialog */}
      {importItem && (
        <LibraryImportDialog
          item={importItem}
          onClose={() => setImportItem(null)}
        />
      )}
    </div>
  );
}

function ItemGrid({ items, typeFilter, setTypeFilter, searchQuery, setSearchQuery, onPreview, onImport }) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search plays, formations, tags..."
            className="pl-8 h-8 text-xs rounded-xl"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                typeFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{items.length} items</span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm">No items found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(item => (
            <LibraryItemCard key={item.id} item={item} onPreview={onPreview} onImport={onImport} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryItemCard({ item, onPreview, onImport }) {
  const hasDiagram = item.diagram_data?.players?.length > 0;
  const typeLabel = {
    play: 'Play', formation: 'Formation', defensive_call: 'Defense',
    special_teams: 'ST', concept_shell: 'Concept',
  }[item.item_type] || item.item_type;

  return (
    <div className="group border border-border rounded-xl bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden">
      {/* Mini diagram preview */}
      {hasDiagram && (
        <div className="h-24 bg-[#1a5c2e] relative overflow-hidden">
          <MiniDiagram players={item.diagram_data.players} paths={item.diagram_data.paths || []} />
          {item.starter_recommended && (
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-md">⭐ STARTER</span>
            </div>
          )}
        </div>
      )}
      {!hasDiagram && (
        <div className="h-16 bg-secondary/50 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-muted-foreground/30" />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h4 className="font-display font-bold text-xs leading-tight flex-1">{item.item_name}</h4>
          <span className="text-[9px] text-muted-foreground shrink-0">{typeLabel}</span>
        </div>

        {item.formation_name && item.item_type !== 'formation' && (
          <p className="text-[10px] text-muted-foreground mb-1">{item.formation_name}</p>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {item.short_description}
        </p>

        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {item.difficulty_level && (
            <Badge className={cn("text-[9px] border px-1.5 py-0", DIFFICULTY_COLORS[item.difficulty_level])}>
              {item.difficulty_level}
            </Badge>
          )}
          {item.run_pass && item.run_pass !== 'n_a' && item.run_pass !== 'formation' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{item.run_pass}</Badge>
          )}
          {item.direction && item.direction !== 'both' && item.direction !== 'n_a' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{item.direction}</Badge>
          )}
        </div>

        <div className="flex gap-1.5">
          <Button size="sm" variant="outline"
            onClick={() => onPreview(item)}
            className="flex-1 h-6 text-[10px] rounded-lg gap-1">
            <Eye className="h-2.5 w-2.5" /> Preview
          </Button>
          <Button size="sm"
            onClick={() => onImport(item)}
            className="flex-1 h-6 text-[10px] rounded-lg gap-1">
            <Download className="h-2.5 w-2.5" /> Import
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniDiagram({ players, paths }) {
  const W = 200, H = 96;
  const scaleX = x => (x / 800) * W;
  const scaleY = y => (y / 500) * H;

  const PATH_COLORS = {
    run_path: '#f59e0b', pass_route: '#60a5fa', blocking_track: '#fb923c',
    pull_path: '#fb923c', motion_path: '#a78bfa', blitz_path: '#f87171',
    pursuit_path: '#f87171', zone_drop: '#34d399', contain_path: '#f87171',
    ball_path: '#fde68a', fake_path: '#c084fc',
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Field stripes */}
      {[0,1,2,3].map(i => (
        <rect key={i} x={0} y={i * 24} width={W} height={24}
          fill={i % 2 === 0 ? '#1a5c2e' : '#174f27'} />
      ))}
      {/* LOS */}
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,100,0.3)" strokeWidth={0.8} strokeDasharray="4,2" />
      {/* Paths */}
      {paths.map((path, i) => {
        const color = PATH_COLORS[path.path_type] || '#fff';
        const pts = path.points || [];
        if (pts.length < 2) return null;
        const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />;
      })}
      {/* Players */}
      {players.map((p, i) => {
        const x = scaleX(p.x), y = scaleY(p.y);
        const isD = p.team_side === 'defense';
        const fill = isD ? '#ef4444' : '#3b82f6';
        return (
          <g key={i}>
            {isD
              ? <rect x={x-4} y={y-4} width={8} height={8} rx={1} fill={fill} opacity={0.9} />
              : <circle cx={x} cy={y} r={4} fill={fill} opacity={0.9} />
            }
            <text x={x} y={y+0.8} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={2.8} fontWeight="bold" style={{ pointerEvents: 'none' }}>
              {(p.display_label || '').slice(0, 2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BundleCard({ bundle, items, onPreview, onImport }) {
  return (
    <div className="border border-border rounded-2xl bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{bundle.icon_emoji || '📦'}</span>
        <Badge variant="outline" className="text-[10px] capitalize">{bundle.side_of_ball}</Badge>
      </div>
      <h3 className="font-display font-bold text-sm mb-1.5">{bundle.bundle_name}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{bundle.description}</p>
      <Button size="sm" onClick={onImport}
        className="w-full gap-1.5 rounded-xl h-8 text-xs">
        <Download className="h-3.5 w-3.5" /> Import Bundle
      </Button>
    </div>
  );
}