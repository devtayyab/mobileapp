'use client';

/**
 * Totals breakdown — mobile app/checkout.tsx summary rows.
 *
 * VAT rule (do not change): when the destination country's `vat_type` is
 * 'included', VAT is already inside the product prices, so it is NOT added to
 * the total and the row reads "Included".
 */

import type { Country } from '@/types/database';
import { useLanguage } from '@/providers/LanguageProvider';
import { formatAmount } from './types';

export function OrderTotals({
  currency,
  subtotal,
  shippingFee,
  vatAmount,
  total,
  country,
}: {
  currency: string;
  subtotal: number;
  shippingFee: number;
  vatAmount: number;
  total: number;
  country: Country | null;
}) {
  const { t } = useLanguage();
  const vatIncluded = country?.vat_type === 'included';

  return (
    <div className="flex flex-col gap-1.5">
      <Row label={t.subtotal ?? 'Subtotal'} value={formatAmount(currency, subtotal)} />
      <Row
        label={`${t.shipping ?? 'Shipping'} (total)`}
        value={shippingFee > 0 ? formatAmount(currency, shippingFee) : (t.free ?? 'Free')}
      />

      {country && (
        <Row
          label={`${t.vat ?? 'VAT'}/Tax (${country.vat_percentage}%)${vatIncluded ? ' — included in price' : ''}`}
          value={vatIncluded ? 'Included' : `+ ${formatAmount(currency, vatAmount)}`}
        />
      )}

      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-edge pt-2.5">
        <span className="text-xl font-bold text-content-primary">{t.total ?? 'Total'}</span>
        <span className="text-4xl font-extrabold text-content-primary">
          {formatAmount(currency, total)}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-md text-content-tertiary">{label}</span>
      <span className="shrink-0 text-md font-bold text-content-primary">{value}</span>
    </div>
  );
}
