'use client';

/**
 * Web port of mobile `app/(tabs)/cart.tsx`.
 *
 * Parity checklist:
 *  - line rows with product image / name / unit price / per-line subtotal
 *  - quantity +/- with a hard stock limit guard (mobile alerts, we toast)
 *  - remove line
 *  - B2B wholesale savings total: sum((b2c_price - b2b_price) * qty)
 *  - guest sign-in prompt (never an error), empty state, checkout CTA
 *
 * `cart_items` is the source of truth; mutations go through CartProvider so the
 * header badge stays in sync (and because cart_items.price is NOT NULL).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, EmptyState, QuantityStepper, SkeletonRows } from '@/components/ui';

type CartProduct = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  product_images: Array<{ image_url: string; is_primary: boolean; display_order: number }> | null;
};

type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  products: CartProduct | null;
};

const CART_SELECT = `
  id, product_id, quantity,
  products (
    id, name, b2c_price, b2b_price, currency, stock_quantity,
    product_images (image_url, is_primary, display_order)
  )
`;

export default function CartView({
  userId,
  isB2B,
}: {
  userId: string | null;
  isB2B: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { updateQuantity, removeItem, refresh } = useCart();

  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('cart_items')
      .select(CART_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: t.error ?? 'Error', message: error.message, kind: 'error' });
    }

    setRows((data as unknown as CartRow[]) ?? []);
    setLoading(false);
  }, [userId, t.error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Mobile: b2b role falls back to b2c_price when b2b_price is null. */
  const priceOf = useCallback(
    (row: CartRow) => {
      const p = row.products;
      if (!p) return 0;
      if (isB2B && p.b2b_price) return p.b2b_price;
      return p.b2c_price;
    },
    [isB2B]
  );

  const imageOf = (row: CartRow) => {
    const images = row.products?.product_images ?? [];
    const primary = images.find((img) => img.is_primary);
    return primary?.image_url ?? images[0]?.image_url ?? null;
  };

  const subtotal = useMemo(
    () => rows.reduce((sum, row) => sum + priceOf(row) * row.quantity, 0),
    [rows, priceOf]
  );

  /** Wholesale savings only apply to b2b pricing, exactly as on mobile. */
  const savings = useMemo(() => {
    if (!isB2B) return 0;
    return rows.reduce((sum, row) => {
      const p = row.products;
      if (!p?.b2b_price) return sum;
      return sum + (p.b2c_price - p.b2b_price) * row.quantity;
    }, 0);
  }, [rows, isB2B]);

  const handleQuantity = async (row: CartRow, next: number) => {
    if (next < 1) return;

    const maxStock = row.products?.stock_quantity ?? 0;
    if (next > maxStock) {
      toast({
        title: t.outOfStock ?? 'Stock limit',
        message: `Only ${maxStock} ${t.units ?? 'units'} available`,
        kind: 'error',
      });
      return;
    }

    setBusyId(row.id);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: next } : r)));
    await updateQuantity(row.id, next);
    setBusyId(null);
  };

  const handleRemove = async (row: CartRow) => {
    setBusyId(row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    await removeItem(row.id);
    await refresh();
    setBusyId(null);
  };

  /* ── Guest: a friendly prompt, never an error ─────────────────────────── */
  if (!userId) {
    return (
      <div className="space-y-5">
        <Header title={t.myCart ?? 'My Cart'} />
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title={t.signInToViewCart ?? 'Sign in to view cart'}
          message={t.loginToAddItems ?? 'Log in to add items and complete your purchase'}
          action={
            <Link
              href="/login?next=/cart"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
            >
              {t.signIn ?? 'Sign In'}
              <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Header title={t.myCart ?? 'My Cart'} />
        <SkeletonRows rows={3} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-5">
        <Header title={t.myCart ?? 'My Cart'} />
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title={t.yourCartIsEmpty ?? 'Your cart is empty'}
          message={t.startAddingItems ?? 'Start adding items from the shop'}
          action={
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
            >
              {t.browseShop ?? 'Browse Shop'}
              <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  const currency = rows[0]?.products?.currency ?? 'USD';

  return (
    <div className="space-y-5">
      <Header title={t.myCart ?? 'My Cart'} count={rows.length} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Lines */}
        <ul className="flex flex-col gap-3.5">
          <AnimatePresence initial={false}>
            {rows.map((row, index) => {
              const unitPrice = priceOf(row);
              const image = imageOf(row);
              const stock = row.products?.stock_quantity ?? 0;
              const showStrike =
                isB2B && row.products?.b2b_price != null && row.products.b2b_price < row.products.b2c_price;

              return (
                <motion.li
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                  exit={{ opacity: 0, x: -24, height: 0, marginBottom: -14 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="flex gap-3.5 overflow-hidden rounded-2xl border border-edge bg-surface p-3.5"
                >
                  <Link
                    href={`/product/${row.product_id}`}
                    className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-surface-page"
                  >
                    {image ? (
                      // Product images are arbitrary Supabase/CDN URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={row.products?.name ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-content-tertiary">
                        <ShoppingBag size={22} />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${row.product_id}`}
                      className="line-clamp-2 text-md font-bold text-content-primary hover:text-primary"
                    >
                      {row.products?.name ?? 'Product'}
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-secondary">{formatPrice(unitPrice)}</span>
                      {showStrike && (
                        <span className="text-xs font-bold text-content-tertiary line-through">
                          {formatPrice(row.products!.b2c_price)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-content-tertiary">
                      {t.subtotal ?? 'Subtotal'}:{' '}
                      <span className="font-bold text-content-secondary">
                        {formatPrice(unitPrice * row.quantity)}
                      </span>
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <QuantityStepper
                        value={row.quantity}
                        max={stock}
                        onChange={(next) => void handleQuantity(row, next)}
                      />
                      <span className="text-xs font-bold text-content-tertiary">
                        {(t.available ?? 'of {count} available').replace('{count}', String(stock))}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemove(row)}
                    disabled={busyId === row.id}
                    aria-label={`Remove ${row.products?.name ?? 'item'}`}
                    className="h-9 w-9 shrink-0 self-start rounded-lg text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                  >
                    <Trash2 size={17} className="mx-auto" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {/* Summary */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2.5 rounded-2xl border border-edge bg-surface p-5 lg:sticky lg:top-6"
        >
          {savings > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2.5">
              <Tag size={14} className="shrink-0 text-success" />
              <p className="text-base font-bold text-success">
                {(t.wholesaleSavings ?? 'Wholesale savings: ${count}').replace(
                  '${count}',
                  formatPrice(savings)
                )}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-md text-content-tertiary">
              {(t.subtotalCount ?? 'Subtotal ({count} items)').replace('{count}', String(rows.length))}
            </span>
            <span className="text-md font-bold text-content-primary">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between border-t border-edge pt-2.5">
            <span className="text-xl font-bold text-content-primary">{t.total ?? 'Total'}</span>
            <span className="text-5xl font-extrabold text-content-primary">{formatPrice(subtotal)}</span>
          </div>

          <p className="text-xs text-content-tertiary">
            {t.shipping ?? 'Shipping'} &amp; {t.vat ?? 'VAT'} calculated at checkout.
          </p>

          <Button fullWidth size="lg" className="mt-1.5" onClick={() => router.push('/checkout')}>
            {t.proceedToCheckout ?? 'Proceed to Checkout'}
            <ArrowRight size={17} />
          </Button>

          <p className="text-center text-2xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
            {currency}
          </p>
        </motion.aside>
      </div>
    </div>
  );
}

function Header({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">{title}</h1>
      {count ? (
        <span className="rounded-lg bg-secondary px-2.5 py-0.5 text-base font-bold text-white">{count}</span>
      ) : null}
    </div>
  );
}
