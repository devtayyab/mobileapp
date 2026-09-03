'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from './Skeleton';

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. Omit to render the raw value at `key`. */
  render?: (row: T) => React.ReactNode;
  /** Value used for sorting; omit to disable sorting on this column. */
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: 'left' | 'right' | 'center';
};

export type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Enables the checkbox column. */
  selection?: {
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
  };
  pageSize?: number;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  emptyState,
  onRowClick,
  selection,
  pageSize = 25,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const allVisibleSelected =
    selection != null && visible.length > 0 && visible.every((r) => selection.selected.has(rowKey(r)));

  const toggleAllVisible = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (allVisibleSelected) {
      visible.forEach((r) => next.delete(rowKey(r)));
    } else {
      visible.forEach((r) => next.add(rowKey(r)));
    }
    selection.onChange(next);
  };

  /** Shift-click selects the range from the previous click. */
  const toggleRow = (index: number, shiftKey: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);

    if (shiftKey && lastClicked !== null) {
      const [from, to] = [Math.min(lastClicked, index), Math.max(lastClicked, index)];
      for (let i = from; i <= to; i++) next.add(rowKey(visible[i]));
    } else {
      const id = rowKey(visible[index]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }

    setLastClicked(index);
    selection.onChange(next);
  };

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' }
    );
  };

  if (loading) {
    return (
      <div className="space-y-2 rounded-2xl border border-edge bg-surface p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0 && emptyState) return <>{emptyState}</>;

  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-edge bg-surface-page">
            <tr>
              {selection && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all rows on this page"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={cn(
                    'px-3 py-3 text-sm font-extrabold uppercase tracking-[0.5px] text-content-tertiary',
                    col.sortValue && 'cursor-pointer select-none hover:text-content-primary',
                    alignClass[col.align ?? 'left'],
                    col.className
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sort?.key === col.key &&
                      (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row, i) => {
              const id = rowKey(row);
              const isSelected = selection?.selected.has(id) ?? false;

              return (
                <motion.tr
                  key={id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.012, 0.2) }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-edge-light last:border-0',
                    onRowClick && 'cursor-pointer',
                    isSelected ? 'bg-surface-tint' : 'hover:bg-surface-page'
                  )}
                >
                  {selection && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => undefined}
                        onClick={(e) => toggleRow(i, e.shiftKey)}
                        aria-label="Select row"
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3 text-md text-content-primary',
                        alignClass[col.align ?? 'left'],
                        col.className
                      )}
                    >
                      {col.render ? col.render(row) : String((row as never)[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-edge px-3 py-2.5">
          <span className="text-base text-content-tertiary">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="rounded-lg border border-edge p-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-base font-bold">
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="rounded-lg border border-edge p-1.5 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
