'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, EyeOff, Percent, Star, Tag, Undo2, X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import type { BulkCategory } from './bulk-types';

export type PriceMode = 'set' | 'percent';
export type StockMode = 'set' | 'delta';

/**
 * Sticky bar shown while rows are selected. Grouped by the kind of change so a
 * long op list stays scannable, and every destructive-ish action states the
 * number of affected rows.
 */
export function BulkActionBar({
  count,
  categories,
  busy,
  canUndo,
  undoLabel,
  onSetActive,
  onSetFeatured,
  onSetCategory,
  onPrice,
  onStock,
  onUndo,
  onClear,
}: {
  count: number;
  categories: BulkCategory[];
  busy: boolean;
  canUndo: boolean;
  undoLabel?: string;
  onSetActive: (value: boolean) => void;
  onSetFeatured: (value: boolean) => void;
  onSetCategory: (categoryId: string) => void;
  onPrice: (mode: PriceMode, value: number) => void;
  onStock: (mode: StockMode, value: number) => void;
  onUndo: () => void;
  onClear: () => void;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [priceMode, setPriceMode] = useState<PriceMode>('percent');
  const [priceValue, setPriceValue] = useState('');
  const [stockMode, setStockMode] = useState<StockMode>('set');
  const [stockValue, setStockValue] = useState('');

  const numberInput =
    'h-9 w-24 rounded-lg border-[1.5px] border-edge bg-surface-page px-2 text-base ' +
    'text-content-primary outline-none focus:border-secondary';
  const modeSelect =
    'h-9 rounded-lg border-[1.5px] border-edge bg-surface-page px-2 text-base font-bold ' +
    'text-content-primary outline-none focus:border-secondary';

  const priceNum = Number(priceValue);
  const stockNum = Number(stockValue);
  const priceValid = priceValue !== '' && Number.isFinite(priceNum);
  const stockValid = stockValue !== '' && Number.isFinite(stockNum);

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="sticky bottom-4 z-30 rounded-2xl border border-edge bg-surface p-3 shadow-float"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-3xl bg-primary px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-white">
          {count} selected
        </span>

        {/* Visibility */}
        <div className="flex items-center gap-1 rounded-lg border border-edge-light p-1">
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSetActive(true)}>
            <Check size={14} /> Activate
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSetActive(false)}>
            <EyeOff size={14} /> Deactivate
          </Button>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-1 rounded-lg border border-edge-light p-1">
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSetFeatured(true)}>
            <Star size={14} /> Feature
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSetFeatured(false)}>
            Unfeature
          </Button>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1">
          <Tag size={14} className="text-content-tertiary" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={modeSelect}
            aria-label="Category to apply"
          >
            <option value="">Set category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !categoryId}
            onClick={() => onSetCategory(categoryId)}
          >
            Apply
          </Button>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1">
          <Percent size={14} className="text-content-tertiary" />
          <select
            value={priceMode}
            onChange={(e) => setPriceMode(e.target.value as PriceMode)}
            className={modeSelect}
            aria-label="Price change mode"
          >
            <option value="percent">Price ±%</option>
            <option value="set">Price =</option>
          </select>
          <input
            type="number"
            step="0.01"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            placeholder={priceMode === 'percent' ? '-10' : '19.99'}
            aria-label="Price value"
            className={numberInput}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !priceValid}
            onClick={() => onPrice(priceMode, priceNum)}
          >
            Apply
          </Button>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1">
          <select
            value={stockMode}
            onChange={(e) => setStockMode(e.target.value as StockMode)}
            className={modeSelect}
            aria-label="Stock change mode"
          >
            <option value="set">Stock =</option>
            <option value="delta">Stock ±</option>
          </select>
          <input
            type="number"
            value={stockValue}
            onChange={(e) => setStockValue(e.target.value)}
            placeholder={stockMode === 'delta' ? '+25' : '100'}
            aria-label="Stock value"
            className={numberInput}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !stockValid}
            onClick={() => onStock(stockMode, stockNum)}
          >
            Apply
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {canUndo && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onUndo} title={undoLabel}>
              <Undo2 size={14} /> Undo
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClear}>
            <X size={14} /> Clear
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
