'use client';

import { useState } from 'react';
import type { Category } from '@/types/database';

export default function BulkEditToolbar({
  count,
  categories,
  onSetActive,
  onSetFeatured,
  onSetCategory,
  onSetStock,
  onAdjustPrice,
  onClear,
}: {
  count: number;
  categories: Pick<Category, 'id' | 'name'>[];
  onSetActive: (value: boolean) => void;
  onSetFeatured: (value: boolean) => void;
  onSetCategory: (categoryId: string) => void;
  onSetStock: (value: number) => void;
  onAdjustPrice: (percent: number) => void;
  onClear: () => void;
}) {
  const [stockValue, setStockValue] = useState('');
  const [pricePercent, setPricePercent] = useState('');
  const [categoryId, setCategoryId] = useState('');

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
      <span className="font-medium text-slate-700">{count} selected</span>

      <button
        onClick={() => onSetActive(true)}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
      >
        Mark active
      </button>
      <button
        onClick={() => onSetActive(false)}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
      >
        Mark inactive
      </button>
      <button
        onClick={() => onSetFeatured(true)}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
      >
        Feature
      </button>
      <button
        onClick={() => onSetFeatured(false)}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
      >
        Unfeature
      </button>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="rounded border border-slate-300 bg-white px-2 py-1"
      >
        <option value="">Set category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        disabled={!categoryId}
        onClick={() => categoryId && onSetCategory(categoryId)}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
      >
        Apply
      </button>

      <input
        type="number"
        placeholder="Set stock…"
        value={stockValue}
        onChange={(e) => setStockValue(e.target.value)}
        className="w-24 rounded border border-slate-300 bg-white px-2 py-1"
      />
      <button
        disabled={stockValue === ''}
        onClick={() => onSetStock(Number(stockValue))}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
      >
        Apply
      </button>

      <input
        type="number"
        placeholder="Price % (+/-)"
        value={pricePercent}
        onChange={(e) => setPricePercent(e.target.value)}
        className="w-28 rounded border border-slate-300 bg-white px-2 py-1"
      />
      <button
        disabled={pricePercent === ''}
        onClick={() => onAdjustPrice(Number(pricePercent))}
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
      >
        Apply
      </button>

      <button onClick={onClear} className="ml-auto text-slate-500 hover:text-slate-700">
        Clear selection
      </button>
    </div>
  );
}
