'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Download, Package, Plus, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  SearchInput,
  StatusBadge,
  Tabs,
  type Column,
} from '@/components/ui';
import { BulkActionBar, type PriceMode, type StockMode } from './BulkActionBar';
import { BulkCsvImport } from './BulkCsvImport';
import { downloadCsv, productsToCsv } from './bulk-csv';
import type {
  BulkCategory,
  BulkPatch,
  BulkProduct,
  CsvParseResult,
  UndoEntry,
} from './bulk-types';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'featured', label: 'Featured' },
  { key: 'low_stock', label: 'Low stock' },
];

/**
 * Bulk product editor shared by the admin catalog (all products) and the
 * supplier catalog (own products only). Writes go through the
 * `bulk_update_products` RPC, which is `security invoker` — so the existing RLS
 * policies still decide what each role may touch, and a supplier physically
 * cannot edit another supplier's row even by crafting a request.
 */
export function BulkProductManager({
  initialProducts,
  categories,
  addHref,
  editHrefFor,
  title,
}: {
  initialProducts: BulkProduct[];
  categories: BulkCategory[];
  addHref?: string;
  editHrefFor?: (id: string) => string;
  title: string;
}) {
  const { toast } = useToast();
  const [products, setProducts] = useState<BulkProduct[]>(initialProducts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? '—';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      if (filter === 'active' && !p.is_active) return false;
      if (filter === 'inactive' && p.is_active) return false;
      if (filter === 'featured' && !p.is_featured) return false;
      if (filter === 'low_stock' && p.stock_quantity >= 10) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, search, filter]);

  const tabs = useMemo(
    () =>
      FILTERS.map((f) => ({
        ...f,
        count:
          f.key === 'all'
            ? products.length
            : products.filter((p) => {
                if (f.key === 'active') return p.is_active;
                if (f.key === 'inactive') return !p.is_active;
                if (f.key === 'featured') return p.is_featured;
                return p.stock_quantity < 10;
              }).length,
      })),
    [products]
  );

  /** Apply per-row patches through the RPC, recording an undo snapshot. */
  const applyPatches = async (
    updates: { id: string; patch: BulkPatch }[],
    label: string
  ) => {
    if (updates.length === 0) return;

    setBusy(true);
    const supabase = createClient();

    // Snapshot the prior values of exactly the fields being written.
    const previous = updates.map(({ id, patch }) => {
      const current = products.find((p) => p.id === id);
      const snapshot: BulkPatch = {};
      (Object.keys(patch) as (keyof BulkPatch)[]).forEach((field) => {
        if (current) (snapshot as Record<string, unknown>)[field] = current[field];
      });
      return { id, patch: snapshot };
    });

    const { data, error } = await supabase.rpc('bulk_update_products', {
      updates: updates.map(({ id, patch }) => ({ id, ...patch })),
    });

    setBusy(false);

    if (error) {
      toast({ title: 'Bulk update failed', message: error.message, kind: 'error' });
      return;
    }

    const affected = typeof data === 'number' ? data : updates.length;

    // RLS can silently match zero rows; say so instead of implying success.
    if (affected === 0) {
      toast({
        title: 'Nothing was updated',
        message: 'The database rejected these changes — you may not have permission.',
        kind: 'error',
      });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        const update = updates.find((u) => u.id === p.id);
        return update ? { ...p, ...update.patch } : p;
      })
    );
    setUndoStack((prev) => [{ label, at: Date.now(), previous }, ...prev].slice(0, 10));
    setSelected(new Set());

    toast({
      title: `${affected} product${affected === 1 ? '' : 's'} updated`,
      message: `${label} · undo available`,
      kind: 'success',
    });
  };

  const selectedProducts = () => products.filter((p) => selected.has(p.id));

  const bulkSet = (patch: BulkPatch, label: string) =>
    applyPatches(
      selectedProducts().map((p) => ({ id: p.id, patch })),
      label
    );

  const bulkPrice = (mode: PriceMode, value: number) => {
    const updates = selectedProducts().map((p) => {
      const next =
        mode === 'set'
          ? value
          : Math.round(p.b2c_price * (1 + value / 100) * 100) / 100;
      return { id: p.id, patch: { b2c_price: Math.max(0, next) } };
    });

    return applyPatches(
      updates,
      mode === 'set' ? `Price set to ${value}` : `Price ${value > 0 ? '+' : ''}${value}%`
    );
  };

  const bulkStock = (mode: StockMode, value: number) => {
    const updates = selectedProducts().map((p) => {
      const next = mode === 'set' ? value : p.stock_quantity + value;
      return { id: p.id, patch: { stock_quantity: Math.max(0, Math.round(next)) } };
    });

    return applyPatches(
      updates,
      mode === 'set' ? `Stock set to ${value}` : `Stock ${value > 0 ? '+' : ''}${value}`
    );
  };

  const undo = async () => {
    const [entry, ...rest] = undoStack;
    if (!entry) return;

    setUndoStack(rest);
    const supabase = createClient();
    setBusy(true);

    const { error } = await supabase.rpc('bulk_update_products', {
      updates: entry.previous.map(({ id, patch }) => ({ id, ...patch })),
    });

    setBusy(false);

    if (error) {
      toast({ title: 'Undo failed', message: error.message, kind: 'error' });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        const restored = entry.previous.find((u) => u.id === p.id);
        return restored ? { ...p, ...restored.patch } : p;
      })
    );
    toast({ title: 'Reverted', message: entry.label, kind: 'success' });
  };

  const columns: Column<BulkProduct>[] = [
    {
      key: 'name',
      header: 'Product',
      sortValue: (p) => p.name.toLowerCase(),
      render: (p) => (
        <div className="min-w-0">
          {editHrefFor ? (
            <Link
              href={editHrefFor(p.id)}
              className="block truncate font-semibold text-content-primary hover:text-primary hover:underline"
            >
              {p.name}
            </Link>
          ) : (
            <span className="block truncate font-semibold text-content-primary">{p.name}</span>
          )}
          <span className="block truncate text-sm text-content-tertiary">
            {p.sku ?? 'No SKU'}
          </span>
        </div>
      ),
    },
    {
      key: 'category_id',
      header: 'Category',
      sortValue: (p) => categoryName(p.category_id).toLowerCase(),
      render: (p) => (
        <span className="text-content-tertiary">{categoryName(p.category_id)}</span>
      ),
    },
    {
      key: 'b2c_price',
      header: 'Retail',
      align: 'right',
      sortValue: (p) => p.b2c_price,
      render: (p) => <span className="font-bold">{p.b2c_price.toFixed(2)}</span>,
    },
    {
      key: 'b2b_price',
      header: 'Wholesale',
      align: 'right',
      sortValue: (p) => p.b2b_price ?? -1,
      render: (p) => (
        <span className="text-content-tertiary">
          {p.b2b_price != null ? p.b2b_price.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Stock',
      align: 'right',
      sortValue: (p) => p.stock_quantity,
      render: (p) => (
        <span
          className={
            p.stock_quantity === 0
              ? 'font-bold text-error'
              : p.stock_quantity < 10
                ? 'font-bold text-warning'
                : ''
          }
        >
          {p.stock_quantity}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortValue: (p) => (p.is_active ? 1 : 0),
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge
            status={p.is_active ? 'delivered' : 'cancelled'}
            label={p.is_active ? 'Active' : 'Inactive'}
          />
          {p.is_featured && <Badge tone="warning">Featured</Badge>}
        </div>
      ),
    },
  ];

  const exportCsv = () => {
    const rows = selected.size > 0 ? selectedProducts() : filtered;
    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      productsToCsv(rows)
    );
    toast({
      title: `Exported ${rows.length} product${rows.length === 1 ? '' : 's'}`,
      message: selected.size > 0 ? 'Current selection' : 'Current filter',
      kind: 'success',
    });
  };

  const applyCsv = async (result: CsvParseResult) => {
    await applyPatches(
      result.changes.map((c) => ({ id: c.id, patch: c.patch })),
      `CSV import (${result.changes.length} rows)`
    );
    setCsvOpen(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
            {title}
          </h1>
          <p className="text-base text-content-tertiary">
            {products.length} product{products.length === 1 ? '' : 's'} · select rows to edit in
            bulk (shift-click for a range)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download size={15} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload size={15} /> Import CSV
          </Button>
          {addHref && (
            <Link href={addHref}>
              <Button size="sm">
                <Plus size={15} /> Add product
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or SKU…"
          className="w-full sm:w-72"
        />
        <Tabs tabs={tabs} active={filter} onChange={setFilter} />
      </div>

      {filtered.length > 0 && selected.size < filtered.length && (
        <button
          onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
          className="text-base font-semibold text-secondary hover:underline"
        >
          Select all {filtered.length} matching this filter
        </button>
      )}

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(p) => p.id}
        pageSize={25}
        selection={{ selected, onChange: setSelected }}
        emptyState={
          <EmptyState
            icon={<Package size={26} />}
            title="No products found"
            message={
              search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Products you add will appear here.'
            }
          />
        }
      />

      <AnimatePresence>
        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            categories={categories}
            busy={busy}
            canUndo={undoStack.length > 0}
            undoLabel={undoStack[0]?.label}
            onSetActive={(v) => void bulkSet({ is_active: v }, v ? 'Activated' : 'Deactivated')}
            onSetFeatured={(v) =>
              // is_featured isn't handled by the RPC, so this one goes direct.
              void bulkSetFeatured(v)
            }
            onSetCategory={(id) => void bulkSet({ category_id: id }, 'Category changed')}
            onPrice={(mode, value) => void bulkPrice(mode, value)}
            onStock={(mode, value) => void bulkStock(mode, value)}
            onUndo={() => void undo()}
            onClear={() => setSelected(new Set())}
          />
        )}
      </AnimatePresence>

      <BulkCsvImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        products={products}
        onApply={applyCsv}
        applying={busy}
      />
    </div>
  );

  /**
   * `bulk_update_products` intentionally does not touch is_featured, so the
   * featured toggle uses a plain filtered UPDATE (still governed by RLS).
   */
  async function bulkSetFeatured(value: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .update({ is_featured: value })
      .in('id', ids)
      .select('id');

    setBusy(false);

    if (error) {
      toast({ title: 'Update failed', message: error.message, kind: 'error' });
      return;
    }

    const affected = data?.length ?? 0;
    if (affected === 0) {
      toast({
        title: 'Nothing was updated',
        message: 'The database rejected these changes — you may not have permission.',
        kind: 'error',
      });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, is_featured: value } : p))
    );
    setSelected(new Set());
    toast({
      title: `${affected} product${affected === 1 ? '' : 's'} updated`,
      message: value ? 'Featured' : 'Unfeatured',
      kind: 'success',
    });
  }
}
