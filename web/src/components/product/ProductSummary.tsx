'use client';

import { motion } from 'framer-motion';
import { Package, Star, Tag } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useLanguage } from '@/providers/LanguageProvider';

/**
 * Pills + name + hero price + stats strip, ported from the mobile detail
 * screen. Client-side because `t` and `formatPrice` are context-backed.
 */
export function ProductSummary({
  name,
  sku,
  categoryName,
  originCountry,
  stockQuantity,
  b2cPrice,
  b2bPrice,
  isB2B,
  averageRating,
  reviewCount,
}: {
  name: string;
  sku: string | null;
  categoryName: string | null;
  originCountry: string | null;
  stockQuantity: number;
  b2cPrice: number;
  b2bPrice: number | null;
  isB2B: boolean;
  averageRating: number;
  reviewCount: number;
}) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Mobile: `profile?.role === 'b2b' && product.b2b_price ? b2b_price : b2c_price`
  const hasB2BPrice = isB2B && b2bPrice != null && b2bPrice > 0;
  const price = hasB2BPrice ? (b2bPrice as number) : b2cPrice;
  // Only strike the retail price through when the wholesale price is a discount.
  const showStruckThrough = hasB2BPrice && (b2bPrice as number) < b2cPrice;

  const outOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 10;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {categoryName && (
          <span className="inline-flex items-center rounded-3xl border border-edge bg-surface-tint px-2.5 py-1 text-sm font-semibold text-secondary">
            {categoryName}
          </span>
        )}
        {originCountry && (
          <span className="inline-flex items-center rounded-3xl border border-edge bg-surface-tint px-2.5 py-1 text-sm font-semibold text-secondary">
            Origin: {originCountry}
          </span>
        )}
        {isLowStock && (
          <Badge tone="error">
            {(t.onlyLeft ?? 'Only {count} left').replace('{count}', String(stockQuantity))}
          </Badge>
        )}
        {outOfStock && <Badge tone="neutral">{t.outOfStock ?? 'Out of Stock'}</Badge>}
        {!outOfStock && !isLowStock && <Badge tone="success">{t.inStock ?? 'In Stock'}</Badge>}
      </div>

      <h1 className="text-4xl font-extrabold leading-8 tracking-[-0.3px] text-content-primary">
        {name}
      </h1>

      {sku && (
        <p className="text-sm font-semibold uppercase tracking-[0.4px] text-content-tertiary">
          SKU: {sku}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-7xl font-extrabold text-secondary">{formatPrice(price)}</p>

        {hasB2BPrice && (
          <span className="inline-flex items-center gap-1 rounded bg-surface-tint px-2 py-1 text-xs font-extrabold text-secondary">
            <Tag size={12} />
            {t.wholesalePrice ?? 'Wholesale Price'}
          </span>
        )}

        {showStruckThrough && (
          <span className="text-xl text-content-tertiary line-through">
            {formatPrice(b2cPrice)}
          </span>
        )}
      </div>

      <div className="flex items-stretch justify-around rounded-2xl border border-edge bg-surface p-4">
        <Stat
          icon={<Package size={16} className="text-primary" />}
          value={String(stockQuantity)}
          label={t.inStock ?? 'In Stock'}
        />
        <span className="w-px bg-edge-light" />
        <Stat
          icon={<Star size={16} className="fill-warning text-warning" />}
          value={averageRating > 0 ? averageRating.toFixed(1) : '-'}
          label={`${t.rating ?? 'Rating'}${reviewCount > 0 ? ` (${reviewCount})` : ''}`}
        />
        {/*
          Mobile shows a hardcoded "120+ sold" here. That is fabricated data, so
          it is deliberately omitted rather than ported. If a real figure is
          wanted, aggregate order_items.quantity for this product.
        */}
      </div>
    </motion.section>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      {icon}
      <p className="text-xl font-extrabold text-content-primary">{value}</p>
      <p className="text-center text-xs text-content-tertiary">{label}</p>
    </div>
  );
}
