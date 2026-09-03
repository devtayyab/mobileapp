import type { ProductCardData } from '@/components/ProductCard';

/**
 * Standard storefront product projection. Kept in one place so /shop, /search
 * and /categories stay in sync with the mobile screens they were ported from
 * (app/(tabs)/shop.tsx, app/search.tsx).
 */
export const PRODUCT_SELECT =
  'id, name, b2c_price, b2b_price, stock_quantity, low_stock_threshold, moq, is_featured, product_images (image_url, is_primary), categories (name)';

export type RawStorefrontProduct = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  moq: number | null;
  is_featured: boolean;
  product_images: { image_url: string; is_primary: boolean }[] | null;
  categories: { name: string } | null;
};

/**
 * Mobile image resolution: primary flag first, otherwise the first row.
 * (`product_images.is_primary` — verified against the migration + mobile code.)
 */
export function toCardData(rows: RawStorefrontProduct[] | null): ProductCardData[] {
  return (rows ?? []).map((p) => {
    const primary = p.product_images?.find((i) => i.is_primary);
    return {
      id: p.id,
      name: p.name,
      b2c_price: p.b2c_price,
      b2b_price: p.b2b_price,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      categoryName: p.categories?.name ?? null,
      imageUrl: primary?.image_url ?? p.product_images?.[0]?.image_url ?? null,
      moq: p.moq,
      lowStockThreshold: p.low_stock_threshold,
    };
  });
}
