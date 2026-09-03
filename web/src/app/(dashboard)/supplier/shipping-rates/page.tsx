import { Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import {
  ShippingRatesTable,
  type CountryShippingRate,
} from '@/components/supplier/ShippingRatesTable';

export const dynamic = 'force-dynamic';

/**
 * Port of mobile `app/supplier/shipping-rates.tsx`.
 *
 * Lists every active `countries` row joined against the supplier's own
 * `supplier_shipping_rates` rows, so unconfigured destinations are visible and
 * priceable. Columns are `shipping_charge` + `delivery_time_days` + `is_active`.
 */
export default async function SupplierShippingRatesPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <div className="space-y-5">
        <Header />
        <EmptyState
          icon={<Truck size={26} />}
          title="No supplier profile found"
          message="Add a product first to initialize your supplier profile."
        />
      </div>
    );
  }

  const [{ data: countries }, { data: rateRows }] = await Promise.all([
    supabase.from('countries').select('id, name, code').eq('is_active', true).order('name'),
    supabase
      .from('supplier_shipping_rates')
      .select('id, country_id, shipping_charge, delivery_time_days, is_active')
      .eq('supplier_id', supplier.id),
  ]);

  const byCountry = new Map((rateRows ?? []).map((r) => [r.country_id, r]));

  const rates: CountryShippingRate[] = (countries ?? []).map((country) => {
    const existing = byCountry.get(country.id);

    return {
      countryId: country.id,
      countryName: country.name,
      countryCode: country.code,
      rateId: existing?.id ?? null,
      shippingCharge: existing ? Number(existing.shipping_charge) : null,
      deliveryTimeDays: existing?.delivery_time_days ?? null,
      isActive: existing?.is_active ?? false,
    };
  });

  return (
    <div className="space-y-5">
      <Header />
      <ShippingRatesTable supplierId={supplier.id} rates={rates} />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
        Shipping Rates
      </h1>
      <p className="mt-0.5 text-md text-content-tertiary">
        Per-country shipping charges and estimated delivery times
      </p>
    </div>
  );
}
