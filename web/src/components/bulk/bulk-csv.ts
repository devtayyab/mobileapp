import Papa from 'papaparse';
import {
  CSV_COLUMNS,
  type BulkPatch,
  type BulkProduct,
  type CsvParseResult,
  type CsvRowChange,
} from './bulk-types';

/** Serialize the given products to CSV using the importer's own column set. */
export function productsToCsv(products: BulkProduct[]): string {
  return Papa.unparse(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku ?? '',
      b2c_price: p.b2c_price,
      b2b_price: p.b2b_price ?? '',
      stock_quantity: p.stock_quantity,
      is_active: p.is_active,
      is_featured: p.is_featured,
      category_id: p.category_id ?? '',
    })),
    { columns: [...CSV_COLUMNS] }
  );
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const TRUTHY = new Set(['true', '1', 'yes', 'y']);
const FALSY = new Set(['false', '0', 'no', 'n']);

function parseBoolean(raw: string): boolean | undefined {
  const v = raw.trim().toLowerCase();
  if (TRUTHY.has(v)) return true;
  if (FALSY.has(v)) return false;
  return undefined;
}

function parseNumber(raw: string): number | undefined {
  const v = raw.trim();
  if (v === '') return undefined;
  // Tolerate values pasted from spreadsheets ("1,234.50", "$12.00")
  const cleaned = v.replace(/[$\s]/g, '').replace(/,(?=\d{3}\b)/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Diff a CSV against the products currently loaded, producing a per-row patch
 * of only the fields that genuinely changed. Rows whose id is unknown, or whose
 * values are unparseable/invalid, are reported as errors rather than skipped
 * silently — a partially-applied import is worse than a rejected one.
 */
export function diffCsvAgainstProducts(
  csvText: string,
  products: BulkProduct[]
): CsvParseResult {
  const byId = new Map(products.map((p) => [p.id, p]));
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const changes: CsvRowChange[] = [];
  const errors: { line: number; reason: string }[] = [];
  let unchanged = 0;

  parsed.data.forEach((row, i) => {
    // +2 accounts for the header row and 1-based line numbers.
    const line = i + 2;
    const id = row.id?.trim();

    if (!id) {
      errors.push({ line, reason: 'Missing "id" column value' });
      return;
    }

    const current = byId.get(id);
    if (!current) {
      errors.push({ line, reason: `No product in view matches id ${id}` });
      return;
    }

    const patch: BulkPatch = {};
    const changed: CsvRowChange['changes'] = {};
    let rowHadError = false;

    const numericField = (field: 'b2c_price' | 'b2b_price' | 'stock_quantity') => {
      const raw = row[field];
      if (raw === undefined || raw.trim() === '') return;

      const parsedValue = parseNumber(raw);
      if (parsedValue === undefined) {
        errors.push({ line, reason: `"${field}" is not a number: "${raw}"` });
        rowHadError = true;
        return;
      }
      if (parsedValue < 0) {
        errors.push({ line, reason: `"${field}" cannot be negative` });
        rowHadError = true;
        return;
      }
      if (field === 'stock_quantity' && !Number.isInteger(parsedValue)) {
        errors.push({ line, reason: '"stock_quantity" must be a whole number' });
        rowHadError = true;
        return;
      }

      if (parsedValue !== current[field]) {
        patch[field] = parsedValue;
        changed[field] = { from: current[field], to: parsedValue };
      }
    };

    numericField('b2c_price');
    numericField('b2b_price');
    numericField('stock_quantity');

    if (row.is_active !== undefined && row.is_active.trim() !== '') {
      const value = parseBoolean(row.is_active);
      if (value === undefined) {
        errors.push({ line, reason: `"is_active" must be true/false: "${row.is_active}"` });
        rowHadError = true;
      } else if (value !== current.is_active) {
        patch.is_active = value;
        changed.is_active = { from: current.is_active, to: value };
      }
    }

    if (row.sku !== undefined) {
      const value = row.sku.trim();
      const next = value === '' ? null : value;
      if (next !== current.sku) {
        patch.sku = next;
        changed.sku = { from: current.sku, to: next };
      }
    }

    if (row.is_featured !== undefined && row.is_featured.trim() !== '') {
      const value = parseBoolean(row.is_featured);
      if (value === undefined) {
        errors.push({ line, reason: `"is_featured" must be true/false: "${row.is_featured}"` });
        rowHadError = true;
      } else if (value !== current.is_featured) {
        patch.is_featured = value;
        changed.is_featured = { from: current.is_featured, to: value };
      }
    }

    if (row.category_id !== undefined && row.category_id.trim() !== '') {
      const value = row.category_id.trim();
      if (value !== current.category_id) {
        patch.category_id = value;
        changed.category_id = { from: current.category_id, to: value };
      }
    }

    if (rowHadError) return;

    if (Object.keys(patch).length === 0) {
      unchanged += 1;
      return;
    }

    changes.push({ id, productName: current.name, changes: changed, patch });
  });

  return { changes, errors, unchanged };
}
