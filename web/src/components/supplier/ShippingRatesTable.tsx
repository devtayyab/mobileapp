'use client';

/**
 * Per-country supplier shipping rates — port of mobile
 * `app/supplier/shipping-rates.tsx`.
 *
 * Schema note: the columns are `supplier_shipping_rates.shipping_charge` and
 * `delivery_time_days` (NOT `shipping_fee` / `delivery_days`), plus `is_active`.
 * Every active country is listed; countries with no row yet show as "Not Set"
 * and get an INSERT on first save, otherwise an UPDATE by rate id.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Globe, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Badge, Button, EmptyState, Input, Modal, SearchInput } from '@/components/ui';
import { SupplierToggle } from '@/components/supplier/SupplierToggle';
import { formatMoney } from '@/components/supplier/money';
import { useToast } from '@/providers/ToastProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export type CountryShippingRate = {
  /** `countries.id` — also the `country_id` written on the rate row. */
  countryId: string;
  countryName: string;
  countryCode: string;
  /** `supplier_shipping_rates.id`, absent until the first save. */
  rateId: string | null;
  shippingCharge: number | null;
  deliveryTimeDays: number | null;
  isActive: boolean;
};

export function ShippingRatesTable({
  supplierId,
  rates,
}: {
  supplierId: string;
  rates: CountryShippingRate[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CountryShippingRate | null>(null);
  const [charge, setCharge] = useState('');
  const [days, setDays] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter(
      (r) => r.countryName.toLowerCase().includes(q) || r.countryCode.toLowerCase().includes(q)
    );
  }, [rates, search]);

  const openEditor = (rate: CountryShippingRate) => {
    setEditing(rate);
    setCharge(rate.shippingCharge != null ? String(rate.shippingCharge) : '');
    setDays(rate.deliveryTimeDays != null ? String(rate.deliveryTimeDays) : '');
    setActive(rate.rateId ? rate.isActive : true);
    setError(null);
  };

  const save = async () => {
    if (!editing) return;

    if (charge.trim() === '') {
      setError('Shipping charge is required. Enter 0 for free shipping.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload = {
        supplier_id: supplierId,
        country_id: editing.countryId,
        shipping_charge: Number.parseFloat(charge) || 0,
        delivery_time_days: days.trim() ? Number.parseInt(days, 10) : null,
        is_active: active,
      };

      const { error: writeError } = editing.rateId
        ? await supabase
            .from('supplier_shipping_rates')
            .update(payload)
            .eq('id', editing.rateId)
        : await supabase.from('supplier_shipping_rates').insert(payload);

      if (writeError) throw new Error(writeError.message);

      setEditing(null);
      toast({
        title: 'Rate saved',
        message: `Shipping to ${editing.countryName} updated.`,
        kind: 'success',
      });
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save the rate.';
      setError(message);
      toast({ title: 'Error saving rate', message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-edge bg-surface-tint p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-base leading-5 text-content-secondary">
          Configure your shipping charges for each destination country to allow international buyers
          to place orders.
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={`${t.search ?? 'Search'} countries…`}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Globe size={26} />}
          title={rates.length === 0 ? 'No countries available' : 'No countries match your search'}
          message={
            rates.length === 0
              ? 'An administrator has to activate destination countries before you can price them.'
              : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((rate, index) => {
            const configured = rate.rateId != null;

            return (
              <motion.li
                key={rate.countryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(index * 0.05, 0.3),
                }}
                className={cn(
                  'rounded-2xl border border-edge bg-surface p-4',
                  !configured && 'opacity-70'
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Globe
                      size={20}
                      className={configured ? 'shrink-0 text-primary' : 'shrink-0 text-content-tertiary'}
                    />
                    <p className="truncate text-xl font-bold text-content-primary">
                      {rate.countryName}
                    </p>
                    <span className="shrink-0 text-sm font-bold text-content-tertiary">
                      {rate.countryCode}
                    </span>
                  </div>

                  {configured && rate.isActive ? (
                    <Badge tone="success" className="shrink-0 gap-1">
                      <CheckCircle2 size={12} />
                      Active
                    </Badge>
                  ) : configured ? (
                    <Badge tone="error" className="shrink-0">
                      Inactive
                    </Badge>
                  ) : (
                    <Badge className="shrink-0">Not Set</Badge>
                  )}
                </div>

                <div className="flex items-end justify-between gap-3">
                  {configured ? (
                    <div className="flex min-w-0 flex-1 gap-6">
                      <div>
                        <p className="text-sm text-content-tertiary">Shipping Fee</p>
                        {/* The editor below prices in USD — the readout carries the same unit. */}
                        <p className="text-xl font-bold text-content-primary">
                          {formatMoney('USD', rate.shippingCharge ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-content-tertiary">Est. Delivery</p>
                        <p className="text-xl font-bold text-content-primary">
                          {rate.deliveryTimeDays ? `${rate.deliveryTimeDays} days` : '--'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="min-w-0 flex-1 pr-4 text-base italic text-content-tertiary">
                      No shipping rate configured for this country.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditor(rate)}
                    aria-label={`Edit shipping rate for ${rate.countryName}`}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-tint transition-colors hover:bg-surface-page',
                      configured ? 'text-primary' : 'text-content-tertiary'
                    )}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing ? `Set Rate: ${editing.countryName}` : 'Set Rate'}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Input
              label="Shipping Charge (USD)"
              inputMode="decimal"
              placeholder="0.00"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
            />
            <p className="mt-1 text-sm text-content-tertiary">Enter 0 for free shipping</p>
          </div>

          <Input
            label="Est. Delivery Time (Days)"
            inputMode="numeric"
            placeholder="e.g. 7"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-md font-bold text-content-primary">Enable Shipping</p>
              <p className="mt-0.5 text-sm text-content-tertiary">
                Allow buyers from this country
              </p>
            </div>
            <SupplierToggle checked={active} onChange={setActive} label="Enable Shipping" />
          </div>

          {error && <p className="text-base font-bold text-error">{error}</p>}

          <Button fullWidth size="lg" loading={saving} onClick={save}>
            Save Rate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
