import React, { useMemo, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/components/TeamContext';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Loader2,
  Tag,
} from 'lucide-react';

import { TERMINOLOGY_CATEGORIES, PRESETS } from '@/lib/terminologyPresets';

// ── helpers ──────────────────────────────────────────────────────────────────
const sortByOrder = (rows) =>
  [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

const parseAliases = (raw) =>
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// ── row editor ───────────────────────────────────────────────────────────────
function TerminologyRow({ row, isFirst, isLast, onSave, onDelete, onMove }) {
  const [value, setValue] = useState(row.value || '');
  const [aliasText, setAliasText] = useState((row.aliases || []).join(', '));
  const [dirty, setDirty] = useState(false);

  React.useEffect(() => {
    setValue(row.value || '');
    setAliasText((row.aliases || []).join(', '));
    setDirty(false);
  }, [row.id, row.value, row.aliases]);

  const handleSave = () => {
    if (!value.trim()) {
      toast.error('Term cannot be empty');
      return;
    }
    onSave({ value: value.trim(), aliases: parseAliases(aliasText) });
    setDirty(false);
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center px-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        onBlur={handleSave}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder="Term"
        className="h-9"
      />
      <Input
        value={aliasText}
        onChange={(e) => { setAliasText(e.target.value); setDirty(true); }}
        onBlur={handleSave}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder="Aliases (comma-separated)"
        className="h-9"
      />
      <div className="flex items-center gap-1">
        {dirty && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            unsaved
          </Badge>
        )}
        <button
          onClick={() => onMove(-1)}
          disabled={isFirst}
          title="Move up"
          className="p-1 rounded hover:bg-muted disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={isLast}
          title="Move down"
          className="p-1 rounded hover:bg-muted disabled:opacity-30"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── category panel ───────────────────────────────────────────────────────────
function CategoryPanel({ category, rows, onAdd, onUpdate, onDelete, onMove }) {
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.value?.toLowerCase().includes(q) ||
        (r.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const handleAdd = () => {
    const v = newValue.trim();
    if (!v) { toast.error('Enter a term'); return; }
    onAdd({
      category: category.id,
      key: v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      value: v,
      aliases: [],
      sort_order: rows.length,
    });
    setNewValue('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">{category.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{category.hint}</p>
        </div>
        <Badge variant="secondary">{rows.length} {rows.length === 1 ? 'term' : 'terms'}</Badge>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${category.label.toLowerCase()}…`}
            className="pl-9 h-9"
          />
        </div>
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add new term…"
          className="h-9 w-48"
        />
        <Button size="sm" onClick={handleAdd} className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Term</span>
          <span>Aliases</span>
          <span>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? `No ${category.label.toLowerCase()} yet. Add your first term or import a preset.`
              : 'No terms match your search.'}
          </div>
        ) : (
          filtered.map((row, idx) => (
            <TerminologyRow
              key={row.id}
              row={row}
              isFirst={idx === 0}
              isLast={idx === filtered.length - 1}
              onSave={(patch) => onUpdate(row.id, patch)}
              onDelete={() => onDelete(row.id)}
              onMove={(dir) => onMove(row.id, dir)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── preset import dialog ─────────────────────────────────────────────────────
function PresetDialog({ open, onOpenChange, onImport, importing }) {
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('merge');

  const handleImport = () => {
    const preset = PRESETS.find((p) => p.id === selected);
    if (!preset) { toast.error('Select a preset first'); return; }
    onImport(preset, mode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Terminology Preset</DialogTitle>
          <DialogDescription>
            Start your playbook vocabulary with a curated pack. You can edit every term afterward.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-72">
          <div className="grid grid-cols-2 gap-3 pr-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelected(preset.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selected === preset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{preset.label}</span>
                  <Badge variant="secondary" className="text-xs">{preset.data.length} terms</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <p className="text-sm font-medium">Import Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('merge')}
              className={`flex-1 px-3 py-2 rounded-md text-sm border transition-colors ${
                mode === 'merge' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'
              }`}
            >
              Merge — keep existing, add new
            </button>
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 px-3 py-2 rounded-md text-sm border transition-colors ${
                mode === 'replace' ? 'border-destructive bg-destructive/10 font-medium' : 'border-border hover:bg-muted'
              }`}
            >
              Replace — wipe current, import fresh
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !selected}>
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Import {selected ? PRESETS.find(p => p.id === selected)?.label : 'Preset'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function Terminology() {
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState(TERMINOLOGY_CATEGORIES[0].id);
  const [showPreset, setShowPreset] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(null);

  const queryKey = ['terminology', activeTeamId];

  const { data: terms = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => base44.entities.Terminology.filter({ team_id: activeTeamId }),
    enabled: !!activeTeamId,
  });

  const byCategory = useMemo(() => {
    const map = {};
    TERMINOLOGY_CATEGORIES.forEach((c) => (map[c.id] = []));
    terms.forEach((t) => { if (map[t.category]) map[t.category].push(t); });
    Object.keys(map).forEach((k) => (map[k] = sortByOrder(map[k])));
    return map;
  }, [terms]);

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Terminology.create({ ...data, team_id: activeTeamId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Term added'); },
    onError: (e) => toast.error(`Failed to add: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => base44.entities.Terminology.update(id, patch),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Saved'); },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Terminology.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Term deleted'); },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });

  const handleMove = async (id, dir) => {
    const list = byCategory[activeCategory];
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const a = list[idx];
    const b = list[targetIdx];
    try {
      await Promise.all([
        base44.entities.Terminology.update(a.id, { sort_order: b.sort_order ?? targetIdx }),
        base44.entities.Terminology.update(b.id, { sort_order: a.sort_order ?? idx }),
      ]);
      queryClient.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(`Reorder failed: ${e.message}`);
    }
  };

  const handleImport = async (preset, mode) => {
    if (mode === 'replace') {
      setShowPreset(false);
      setConfirmReplace({ preset });
      return;
    }
    await runImport(preset, 'merge');
  };

  const runImport = async (preset, mode) => {
    setImporting(true);
    try {
      if (mode === 'replace') {
        await Promise.all(terms.map((t) => base44.entities.Terminology.delete(t.id)));
      }
      const existingKeys = new Set(
        mode === 'merge' ? terms.map((t) => `${t.category}:${t.key}`) : []
      );
      const toCreate = preset.data.filter((p) => !existingKeys.has(`${p.category}:${p.key}`));
      for (const item of toCreate) {
        await base44.entities.Terminology.create({ ...item, team_id: activeTeamId });
      }
      queryClient.invalidateQueries({ queryKey });
      toast.success(
        `Imported ${toCreate.length} ${toCreate.length === 1 ? 'term' : 'terms'} from ${preset.label}${
          mode === 'merge' && toCreate.length < preset.data.length
            ? ` (${preset.data.length - toCreate.length} already existed)`
            : ''
        }`
      );
      setShowPreset(false);
      setConfirmReplace(null);
    } catch (e) {
      toast.error(`Import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const totalTerms = terms.length;

  if (!activeTeamId) {
    return (
      <div className="page-shell">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-muted-foreground">Select a team to manage terminology.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Playbook</p>
          <h1 className="page-title">Terminology</h1>
          <p className="page-subtitle">
            Define your team's football vocabulary. These terms flow into Play Designer,
            Wristband, Scout Cards, and player quizzes.
          </p>
        </div>
        <div className="page-actions">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Tag className="h-3.5 w-3.5 mr-1.5" />
            {totalTerms} total {totalTerms === 1 ? 'term' : 'terms'}
          </Badge>
          <Button variant="outline" onClick={() => setShowPreset(true)}>
            <Sparkles className="h-4 w-4 mr-2" /> Import Preset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1 mb-6">
            {TERMINOLOGY_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.label}
                {byCategory[cat.id]?.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                    {byCategory[cat.id].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TERMINOLOGY_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <Card className="surface-card">
                <CardContent className="pt-6">
                  <CategoryPanel
                    category={cat}
                    rows={byCategory[cat.id] || []}
                    onAdd={(data) => addMutation.mutate(data)}
                    onUpdate={(id, patch) => updateMutation.mutate({ id, patch })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onMove={handleMove}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <PresetDialog
        open={showPreset}
        onOpenChange={setShowPreset}
        onImport={handleImport}
        importing={importing}
      />

      <AlertDialog open={!!confirmReplace} onOpenChange={(o) => { if (!o) setConfirmReplace(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all terminology?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {totalTerms} existing terms and replace them with the{' '}
              <strong>{confirmReplace?.preset.label}</strong> preset. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmReplace(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => runImport(confirmReplace.preset, 'replace')}
            >
              Yes, Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}