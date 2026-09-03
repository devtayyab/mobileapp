'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useCart } from '@/providers/CartProvider';
import { cn } from '@/lib/cn';

export type ProductCardData = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  stock_quantity: number;
  is_featured?: boolean;
  categoryName?: string | null;
  imageUrl?: string | null;
  /** Minimum order quantity — surfaced as a badge, like the mobile shop tile. */
  moq?: number | null;
  /** Below this, the tile shows an "only N left" warning (mobile parity). */
  lowStockThreshold?: number | null;
};

/**
 * Mobile recipe: radius 16 card, square image, category micro-label,
 * 2-line name, bold price in Colors.secondary.
 */
export function ProductCard({
  product,
  isB2B,
  canAddToCart = true,
  className,
}: {
  product: ProductCardData;
  isB2B: boolean;
  canAddToCart?: boolean;
  className?: string;
}) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  const price = isB2B && product.b2b_price ? product.b2b_price : product.b2c_price;
  const showSaving = isB2B && product.b2b_price != null && product.b2b_price < product.b2c_price;
  const outOfStock = product.stock_quantity <= 0;
  const showMoq = (product.moq ?? 0) > 1;
  const lowStock =
    !outOfStock &&
    product.lowStockThreshold != null &&
    product.stock_quantity <= product.lowStockThreshold;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'group overflow-hidden rounded-2xl border border-edge bg-surface',
        className
      )}
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-page">
          {product.imageUrl ? (
            // Product images come from arbitrary Supabase/CDN URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-content-tertiary">
              <ShoppingCart size={28} />
            </div>
          )}

          {product.is_featured && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-3xl bg-warning px-2 py-1 text-2xs font-extrabold uppercase tracking-[0.5px] text-white">
              <Star size={9} /> Featured
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-3xl bg-surface px-3 py-1 text-xs font-extrabold uppercase tracking-[0.5px] text-content-primary">
                Out of stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        {product.categoryName && (
          <p className="mb-1 truncate text-2xs font-bold uppercase tracking-[0.4px] text-content-tertiary">
            {product.categoryName}
          </p>
        )}

        <Link href={`/product/${product.id}`}>
          <h3 className="mb-1.5 line-clamp-2 min-h-[2.4em] text-sm font-semibold text-content-primary hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* MOQ + low-stock hints, matching the mobile shop tile */}
        {(showMoq || lowStock) && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            {showMoq && (
              <span className="rounded-md bg-surface-tint px-1.5 py-0.5 text-2xs font-bold uppercase tracking-[0.4px] text-primary">
                Min {product.moq}
              </span>
            )}
            {lowStock && (
              <span className="rounded-md px-1.5 py-0.5 text-2xs font-bold uppercase tracking-[0.4px] text-warning">
                Only {product.stock_quantity} left
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold text-secondary">{formatPrice(price)}</p>
            {showSaving && (
              <p className="text-2xs font-bold text-content-tertiary line-through">
                {formatPrice(product.b2c_price)}
              </p>
            )}
          </div>

          {canAddToCart && !outOfStock && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => void addItem(product.id, price)}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark"
            >
              <ShoppingCart size={15} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
