'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, FileUp } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { CSV_COLUMNS, type BulkProduct, type CsvParseResult } from './bulk-types';
import { diffCsvAgainstProducts } from './bulk-csv';

function formatValue(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

/**
 * CSV import with an explicit diff preview: the admin sees exactly which fields
 * change on which products before anything is written, and any unparseable row
 * is surfaced as an error rather than quietly dropped.
 */
export function BulkCsvImport({
  open,
  onClose,
  products,
  onApply,
  applying,
}: {
  open: boolean;
  onClose: () => void;
  products: BulkProduct[];
  onApply: (result: CsvParseResult) => Promise<void>;
  applying: boolean;
}) {
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setFileName(null);
    setReadError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setReadError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      setResult(diffCsvAgainstProducts(text, products));
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Could not read that file');
      setResult(null);
    }
  };

  const applicable = result?.changes.length ?? 0;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Bulk import from CSV"
      size="xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={applicable === 0 || applying}
            loading={applying}
            onClick={async () => {
              if (!result) return;
              await onApply(result);
              reset();
            }}
          >
            {applying ? 'Applying…' : `Apply ${applicable} change${applicable === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-edge bg-surface-page p-3">
          <p className="text-md font-bold text-content-primary">Expected columns</p>
          <p className="mt-1 text-base text-content-tertiary">
            <code className="font-mono">id</code> is required and identifies the product. Any of{' '}
            {CSV_COLUMNS.filter((c) => c !== 'id' && c !== 'name').map((c, i, arr) => (
              <span key={c}>
                <code className="font-mono">{c}</code>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}{' '}
            may be included; blank cells are left unchanged. Export first to get a template.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-edge-dark p-4 transition-colors hover:border-secondary">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tint text-primary">
            <FileUp size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-md font-bold text-content-primary">
              {fileName ?? 'Choose a CSV file'}
            </span>
            <span className="block text-sm text-content-tertiary">
              Compared against the {products.length} product
              {products.length === 1 ? '' : 's'} currently loaded
            </span>
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>

        {readError && (
          <div className="rounded-xl bg-error-light/40 p-3 text-md font-medium text-error-dark">
            {readError}
          </div>
        )}

        {result && (
          <>
            <div className="flex flex-wrap gap-2 text-base">
              <span className="rounded-3xl bg-surface-tint px-2.5 py-1 font-bold text-primary">
                {result.changes.length} to update
              </span>
              {result.unchanged > 0 && (
                <span className="rounded-3xl bg-surface-page px-2.5 py-1 font-bold text-content-tertiary">
                  {result.unchanged} already up to date
                </span>
              )}
              {result.errors.length > 0 && (
                <span className="rounded-3xl bg-error px-2.5 py-1 font-bold text-white">
                  {result.errors.length} row{result.errors.length === 1 ? '' : 's'} rejected
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-xl border border-error p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-md font-bold text-error">
                  <AlertTriangle size={15} /> These rows will be skipped
                </p>
                <ul className="max-h-32 space-y-0.5 overflow-y-auto text-base text-content-tertiary">
                  {result.errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                      Line {e.line}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.changes.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-edge">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-base">
                    <thead className="sticky top-0 bg-surface-page">
                      <tr>
                        <th className="px-3 py-2 text-sm font-extrabold uppercase tracking-[0.5px] text-content-tertiary">
                          Product
                        </th>
                        <th className="px-3 py-2 text-sm font-extrabold uppercase tracking-[0.5px] text-content-tertiary">
                          Changes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.changes.map((row) => (
                        <tr key={row.id} className="border-t border-edge-light">
                          <td className="px-3 py-2 align-top">
                            <span className="block font-semibold text-content-primary">
                              {row.productName ?? row.id}
                            </span>
                            <span className="block font-mono text-sm text-content-tertiary">
                              {row.id.slice(0, 8)}…
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <ul className="space-y-0.5">
                              {Object.entries(row.changes).map(([field, diff]) => (
                                <li key={field} className="text-content-tertiary">
                                  <span className="font-mono text-sm">{field}</span>{' '}
                                  <span className="text-error line-through">
                                    {formatValue(diff.from)}
                                  </span>{' '}
                                  →{' '}
                                  <span className="font-bold text-success">
                                    {formatValue(diff.to)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
