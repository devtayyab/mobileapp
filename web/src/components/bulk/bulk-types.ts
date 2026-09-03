import type { Category, Product } from '@/types/database';

/** The product fields the bulk editor can read and write. */
export type BulkProduct = Pick<
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

export const BULK_PRODUCT_SELECT =
  'id, name, sku, b2c_price, b2b_price, stock_quantity, is_active, is_featured, category_id, created_at';

export type BulkCategory = Pick<Category, 'id' | 'name'>;

/** Columns the CSV importer understands. `id` identifies the row. */
export const CSV_COLUMNS = [
  'id',
  'name',
  'sku',
  'b2c_price',
  'b2b_price',
  'stock_quantity',
  'is_active',
  'is_featured',
  'category_id',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Fields the RPC can update per row. */
export type BulkPatch = Partial<
  Pick<
    BulkProduct,
    'b2c_price' | 'b2b_price' | 'stock_quantity' | 'is_active' | 'category_id'
  >
>;

/**
 * Snapshot of a product's prior values so a bulk change can be reverted.
 * Undo is client-side and lives only for the current page session.
 */
export type UndoEntry = {
  label: string;
  at: number;
  previous: { id: string; patch: BulkPatch }[];
};

export type CsvRowChange = {
  id: string;
  productName: string | null;
  /** field -> { from, to } for fields that actually differ */
  changes: Record<string, { from: unknown; to: unknown }>;
  patch: BulkPatch;
};

export type CsvParseResult = {
  changes: CsvRowChange[];
  /** Rows that could not be applied, with the reason. */
  errors: { line: number; reason: string }[];
  /** Rows parsed but identical to current values. */
  unchanged: number;
};
