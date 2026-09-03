'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Tag, Truck } from 'lucide-react';
import { Button, QuantityStepper } from '@/components/ui';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';

/**
 * Quantity + add-to-cart, ported from the mobile detail screen's quantity
 * section and sticky footer.
 *
 * MOQ note: mobile only clamps to `moq` for B2B buyers; here `moq` is treated
 * as the product-level minimum for every buyer (a superset of that behaviour),
 * because `moq` is a supplier constraint on the product, not on the role.
 */
export function ProductPurchasePanel({
  productId,
  b2cPrice,
  b2bPrice,
  isB2B,
  moq,
  stockQuantity,
  shippingCost,
  isSignedIn,
}: {
  productId: string;
  b2cPrice: number;
  b2bPrice: number | null;
  isB2B: boolean;
  moq: number | null;
  stockQuantity: number;
  shippingCost: number | null;
  isSignedIn: boolean;
}) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const hasB2BPrice = isB2B && b2bPrice != null && b2bPrice > 0;
  const price = hasB2BPrice ? (b2bPrice as number) : b2cPrice;

  const outOfStock = stockQuantity <= 0;
  // Never let the minimum exceed what is actually in stock.
  const minQuantity = Math.max(1, Math.min(moq ?? 1, Math.max(stockQuantity, 1)));

  const [quantity, setQuantity] = useState(minQuantity);
  const [adding, setAdding] = useState(false);

  const clamp = (next: number) =>
    Math.min(Math.max(next, minQuantity), Math.max(stockQuantity, minQuantity));

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(productId, price, quantity);
      router.push('/cart');
    } catch {
      toast({
        title: 'Could not add to cart',
        message: 'Please try again.',
        kind: 'error',
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      className="space-y-3 rounded-2xl border border-edge bg-surface p-4"
    >
      <h2 className="text-xl font-bold text-content-primary">{t.quantity ?? 'Quantity'}</h2>

      {minQuantity > 1 && (
        <div className="flex items-center gap-1.5 rounded border border-edge bg-surface-tint p-2.5">
          <Tag size={13} className="shrink-0 text-secondary" />
          <p className="text-sm font-semibold text-secondary">
            {(t.minOrderQuantity ?? 'Minimum order quantity: {count} units').replace(
              '{count}',
              String(minQuantity)
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={(next) => setQuantity(clamp(next))}
          min={minQuantity}
          max={Math.max(stockQuantity, minQuantity)}
        />
        <p className="text-sm text-content-tertiary">
          {(t.available ?? 'of {count} available').replace('{count}', String(stockQuantity))}
        </p>
      </div>

      {shippingCost != null && shippingCost > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-content-tertiary">
          <Truck size={13} />
          {`+ ${formatPrice(shippingCost)} shipping`}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-edge-light pt-3">
        <div>
          <p className="text-sm text-content-tertiary">{t.total ?? 'Total'}</p>
          <p className="text-4xl font-extrabold text-content-primary">
            {formatPrice(price * quantity)}
          </p>
        </div>

        {!isSignedIn ? (
          <Link href="/login" className="min-w-[200px] flex-1">
            <Button fullWidth size="lg">
              <ShoppingCart size={18} />
              Sign in to add to cart
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            className="min-w-[200px] flex-1"
            loading={adding}
            disabled={outOfStock}
            onClick={() => void handleAddToCart()}
          >
            {!adding && <ShoppingCart size={18} />}
            {outOfStock ? (t.outOfStock ?? 'Out of Stock') : (t.addToCart ?? 'Add to Cart')}
          </Button>
        )}
      </div>
    </motion.section>
  );
}
