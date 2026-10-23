'use client';

/**
 * Per-supplier package split — mobile `getSupplierPackages()` in app/checkout.tsx.
 *
 * Shipping per package comes from `supplier_shipping_rates`
 * (shipping_charge / delivery_time_days, is_active) for the chosen destination
 * country. When no rate row exists we fall back to summing the products'
 * `shipping_cost * quantity`, and label it "Standard Shipping" like mobile.
 */

import { motion } from 'framer-motion';
import { Clock, Package, Truck } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { getVariantsForProduct } from '@/lib/cart-variants';
import { formatAmount, type SupplierPackage } from './types';

export function SupplierPackageList({
  packages,
  currency,
  unitPrice,
  calculating,
}: {
  packages: SupplierPackage[];
  currency: string;
  unitPrice: (row: SupplierPackage['items'][number]) => number;
  calculating: boolean;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      {packages.map((pkg, index) => (
        <motion.div
          key={pkg.supplierId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
          className="rounded-xl border border-edge-light bg-surface-page p-3.5"
        >
          <div className="mb-2 flex items-center gap-1.5">
            <Package size={15} className="shrink-0 text-primary" />
            <p className="truncate text-md font-extrabold text-content-primary">{pkg.supplierName}</p>
            <span className="ml-auto shrink-0 text-2xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
              {pkg.items.length} {pkg.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {pkg.items.map((row) => {
              const variants = getVariantsForProduct(row.product_id);

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 rounded-xl border border-edge/60 bg-surface/80 p-2.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-content-primary">
                      {row.products?.name ?? 'Product'}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-secondary">
                      {formatAmount(currency, unitPrice(row) * row.quantity)}
                    </span>
                  </div>

                  {/* Summary of order variants in checkout */}
                  {variants.length > 0 ? (
                    <div className="flex flex-col gap-1 border-t border-edge/40 pt-1.5 notranslate" translate="no">
                      {variants.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-2xs font-semibold text-content-secondary"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-md bg-primary/10 px-1 text-3xs font-extrabold text-primary">
                              {v.quantity}&times;
                            </span>
                            {v.color && (
                              <span>
                                {language.code === 'el' ? 'Χρώμα: ' : 'Colour: '}
                                <strong className="text-content-primary">{v.color}</strong>
                              </span>
                            )}
                            {v.color && v.size && <span className="text-edge">·</span>}
                            {v.size && (
                              <span>
                                {language.code === 'el' ? 'Μέγεθος: ' : 'Size: '}
                                <strong className="text-content-primary">{v.size}</strong>
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-2xs text-content-tertiary">
                      &times; {row.quantity}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-edge-light pt-2.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-content-tertiary">
              <Truck size={13} className="shrink-0" />
              {calculating
                ? 'Calculating…'
                : pkg.hasRate
                  ? 'Supplier direct shipping'
                  : `${t.shipping ?? 'Shipping'} (standard)`}
            </span>
            <span className="shrink-0 text-sm font-bold text-content-primary">
              {pkg.shippingFee > 0 ? formatAmount(currency, pkg.shippingFee) : (t.free ?? 'Free')}
            </span>
          </div>

          {pkg.hasRate && pkg.deliveryDays ? (
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-sm text-content-tertiary">
                <Clock size={13} className="shrink-0" />
                Est. delivery
              </span>
              <span className="shrink-0 text-sm font-bold text-success">{pkg.deliveryDays} days</span>
            </div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
