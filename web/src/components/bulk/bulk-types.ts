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

/**
 * Fields a bulk edit can change.
 * `b2c_price | b2b_price | stock_quantity | is_active | category_id` go through
 * the `bulk_update_products` RPC; `sku` and `is_featured` are not handled by it
 * and are applied with plain per-row UPDATEs (still governed by RLS).
 */
export type BulkPatch = Partial<
  Pick<
    BulkProduct,
    'b2c_price' | 'b2b_price' | 'stock_quantity' | 'is_active' | 'category_id' | 'sku' | 'is_featured'
  >
>;

/** The subset the RPC understands. */
export const RPC_PATCH_FIELDS = [
  'b2c_price',
  'b2b_price',
  'stock_quantity',
  'is_active',
  'category_id',
] as const;

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

/** One element of the `bulk_update_products` RPC `updates` array. */
export type RpcUpdate = {
  id: string;
  b2c_price?: number;
  b2b_price?: number | null;
  stock_quantity?: number;
  is_active?: boolean;
  category_id?: string | null;
};

/**
 * Partitions patches into the fields the RPC handles and the rest.
 * `sku` / `is_featured` are not touched by `bulk_update_products`, so sending
 * them through it would silently drop the change.
 */
export function splitPatches(updates: { id: string; patch: BulkPatch }[]): {
  rpcUpdates: RpcUpdate[];
  directUpdates: { id: string; patch: BulkPatch }[];
} {
  const rpcUpdates: RpcUpdate[] = [];
  const directUpdates: { id: string; patch: BulkPatch }[] = [];

  for (const { id, patch } of updates) {
    const rpcPart: RpcUpdate = { id };
    const directPart: BulkPatch = {};
    let hasRpc = false;
    let hasDirect = false;

    if ('b2c_price' in patch) { rpcPart.b2c_price = patch.b2c_price; hasRpc = true; }
    if ('b2b_price' in patch) { rpcPart.b2b_price = patch.b2b_price; hasRpc = true; }
    if ('stock_quantity' in patch) { rpcPart.stock_quantity = patch.stock_quantity; hasRpc = true; }
    if ('is_active' in patch) { rpcPart.is_active = patch.is_active; hasRpc = true; }
    if ('category_id' in patch) { rpcPart.category_id = patch.category_id; hasRpc = true; }

    if ('sku' in patch) { directPart.sku = patch.sku; hasDirect = true; }
    if ('is_featured' in patch) { directPart.is_featured = patch.is_featured; hasDirect = true; }

    if (hasRpc) rpcUpdates.push(rpcPart);
    if (hasDirect) directUpdates.push({ id, patch: directPart });
  }

  return { rpcUpdates, directUpdates };
}
