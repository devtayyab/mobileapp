'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';

type CsvRow = Record<string, string>;

type PreparedUpdate = {
  id: string;
  b2c_price?: number;
  b2b_price?: number;
  stock_quantity?: number;
  is_active?: boolean;
  category_id?: string;
};

const NUMERIC_FIELDS = ['b2c_price', 'b2b_price', 'stock_quantity'] as const;

export default function CsvImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (updatedCount: number) => void;
}) {
  const [rows, setRows] = useState<PreparedUpdate[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: PreparedUpdate[] = [];
        for (const row of result.data) {
          if (!row.id) continue;
          const update: PreparedUpdate = { id: row.id.trim() };

          for (const field of NUMERIC_FIELDS) {
            const value = row[field];
            if (value !== undefined && value !== '') {
              update[field] = Number(value);
            }
          }
          if (row.is_active !== undefined && row.is_active !== '') {
            update.is_active = ['true', '1', 'yes'].includes(row.is_active.toLowerCase());
          }
          if (row.category_id) {
            update.category_id = row.category_id.trim();
          }

          parsed.push(update);
        }
        setRawCount(result.data.length);
        setRows(parsed);
        if (parsed.length === 0) {
          setError('No valid rows found — CSV must include an "id" column.');
        }
      },
      error: (err) => setError(err.message),
    });
  };

  const handleImport = async () => {
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('bulk_update_products', {
      updates: rows,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onImported(data ?? rows.length);
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Bulk import CSV</h2>
        <p className="mb-3 text-sm text-slate-500">
          Columns: <code>id</code> (required), plus any of <code>b2c_price</code>,{' '}
          <code>b2b_price</code>, <code>stock_quantity</code>, <code>is_active</code>,{' '}
          <code>category_id</code>.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="mb-3 block w-full text-sm"
        />

        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {rows.length > 0 && (
          <div className="mb-3 max-h-64 overflow-y-auto rounded-md border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1">id</th>
                  <th className="px-2 py-1">b2c_price</th>
                  <th className="px-2 py-1">stock_quantity</th>
                  <th className="px-2 py-1">is_active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1">{r.id}</td>
                    <td className="px-2 py-1">{r.b2c_price ?? '—'}</td>
                    <td className="px-2 py-1">{r.stock_quantity ?? '—'}</td>
                    <td className="px-2 py-1">{r.is_active === undefined ? '—' : String(r.is_active)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">
            {rows.length} of {rawCount} rows ready to apply.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={rows.length === 0 || submitting}
            onClick={handleImport}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Applying…' : `Apply to ${rows.length} product(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
