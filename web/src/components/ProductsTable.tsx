'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, Category } from '@/types/database';
import BulkEditToolbar from './BulkEditToolbar';
import CsvImportModal from './CsvImportModal';

type Row = Pick<
  Product,
  | 'id'
  | 'name'
  | 'sku'
  | 'b2c_price'
  | 'b2b_price'
  | 'stock_quantity'
  | 'is_active'
  | 'is_featured'
  | 'category_id'
  | 'created_at'
>;

export default function ProductsTable({
  initialProducts,
  categories,
}: {
  initialProducts: Row[];
  categories: Pick<Category, 'id' | 'name'>[];
}) {
  const [products, setProducts] = useState<Row[]>(initialProducts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? '—';

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkUpdate = async (patch: Partial<Row>) => {
    const supabase = createClient();
    const ids = Array.from(selected);
    const { error } = await supabase.from('products').update(patch).in('id', ids);

    if (error) {
      alert(`Bulk update failed: ${error.message}`);
      return;
    }

    setProducts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, ...patch } : p)));
    setSelected(new Set());
  };

  const applyPriceAdjustment = async (percent: number) => {
    const supabase = createClient();
    const targets = products.filter((p) => selected.has(p.id));

    const results = await Promise.all(
      targets.map((p) => {
        const newPrice = Math.round(p.b2c_price * (1 + percent / 100) * 100) / 100;
        return supabase.from('products').update({ b2c_price: newPrice }).eq('id', p.id);
      })
    );

    const failed = results.filter((r) => r.error);
    if (failed.length) {
      alert(`${failed.length} product(s) failed to update`);
    }

    setProducts((prev) =>
      prev.map((p) =>
        selected.has(p.id)
          ? { ...p, b2c_price: Math.round(p.b2c_price * (1 + percent / 100) * 100) / 100 }
          : p
      )
    );
    setSelected(new Set());
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
        />
        <button
          onClick={() => setCsvOpen(true)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Bulk import CSV
        </button>
      </div>

      {selected.size > 0 && (
        <BulkEditToolbar
          count={selected.size}
          categories={categories}
          onSetActive={(is_active) => applyBulkUpdate({ is_active })}
          onSetFeatured={(is_featured) => applyBulkUpdate({ is_featured })}
          onSetCategory={(category_id) => applyBulkUpdate({ category_id })}
          onSetStock={(stock_quantity) => applyBulkUpdate({ stock_quantity })}
          onAdjustPrice={applyPriceAdjustment}
          onClear={() => setSelected(new Set())}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">B2C Price</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Featured</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                  />
                </td>
                <td className="px-3 py-2 text-slate-900">{p.name}</td>
                <td className="px-3 py-2 text-slate-500">{p.sku ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">{categoryName(p.category_id)}</td>
                <td className="px-3 py-2">{p.b2c_price.toFixed(2)}</td>
                <td className="px-3 py-2">{p.stock_quantity}</td>
                <td className="px-3 py-2">{p.is_active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{p.is_featured ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {csvOpen && (
        <CsvImportModal
          onClose={() => setCsvOpen(false)}
          onImported={(updatedCount) => {
            setCsvOpen(false);
            location.reload();
            void updatedCount;
          }}
        />
      )}
    </div>
  );
}
