'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createClient } from '@/lib/supabase/client';
import { getStripe } from '@/lib/stripe';
import type { Country } from '@/types/database';

type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    b2c_price: number;
    b2b_price: number | null;
    currency: string;
    supplier_id: string;
    shipping_cost: number | null;
    suppliers: { id: string; business_name: string } | null;
  } | null;
};

type Address = { street: string; city: string; state: string; zipCode: string };

export default function CheckoutForm() {
  const [cartItems, setCartItems] = useState<CartRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: items }, { data: countryList }] = await Promise.all([
        supabase
          .from('cart_items')
          .select(
            'id, product_id, quantity, products (id, name, b2c_price, b2b_price, currency, supplier_id, shipping_cost, suppliers (id, business_name))'
          )
          .eq('user_id', user.id),
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
      ]);

      setCartItems((items as unknown as CartRow[]) ?? []);
      setCountries(countryList ?? []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  if (cartItems.length === 0) {
    return <p className="text-sm text-slate-400">Your cart is empty.</p>;
  }

  return (
    <Elements stripe={getStripe()}>
      <CheckoutInner cartItems={cartItems} countries={countries} />
    </Elements>
  );
}

function CheckoutInner({ cartItems, countries }: { cartItems: CartRow[]; countries: Country[] }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [countryId, setCountryId] = useState('');
  const [supplierRates, setSupplierRates] = useState<
    Record<string, { charge: number; deliveryDays: number | null }>
  >({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = countries.find((c) => c.id === countryId) ?? null;

  useEffect(() => {
    if (!selectedCountry) return;
    const supabase = createClient();
    const supplierIds = [...new Set(cartItems.map((i) => i.products?.supplier_id).filter(Boolean))] as string[];
    if (supplierIds.length === 0) return;

    supabase
      .from('supplier_shipping_rates')
      .select('supplier_id, shipping_charge, delivery_time_days')
      .eq('country_id', selectedCountry.id)
      .eq('is_active', true)
      .in('supplier_id', supplierIds)
      .then(({ data }) => {
        const map: Record<string, { charge: number; deliveryDays: number | null }> = {};
        (data ?? []).forEach((r) => {
          map[r.supplier_id] = { charge: r.shipping_charge, deliveryDays: r.delivery_time_days };
        });
        setSupplierRates(map);
      });
  }, [selectedCountry, cartItems]);

  const getPrice = (row: CartRow) => row.products?.b2b_price ?? row.products?.b2c_price ?? 0;

  const packages = useMemo(() => {
    const map = new Map<
      string,
      { supplierId: string; supplierName: string; items: CartRow[]; shippingFee: number; hasRate: boolean }
    >();

    for (const row of cartItems) {
      if (!row.products) continue;
      const supplierId = row.products.supplier_id;
      const entry = map.get(supplierId) ?? {
        supplierId,
        supplierName: row.products.suppliers?.business_name ?? 'Supplier',
        items: [],
        shippingFee: 0,
        hasRate: Boolean(supplierRates[supplierId]),
      };
      entry.items.push(row);
      if (entry.hasRate) {
        entry.shippingFee = supplierRates[supplierId].charge;
      } else {
        entry.shippingFee += (row.products.shipping_cost ?? 0) * row.quantity;
      }
      map.set(supplierId, entry);
    }

    return Array.from(map.values());
  }, [cartItems, supplierRates]);

  const subtotal = cartItems.reduce((sum, row) => sum + getPrice(row) * row.quantity, 0);
  const shippingFee = packages.reduce((sum, p) => sum + p.shippingFee, 0);
  const isVatIncluded = selectedCountry?.vat_type === 'included';
  const vatAmount = selectedCountry && !isVatIncluded ? (subtotal * selectedCountry.vat_percentage) / 100 : 0;
  const total = subtotal + shippingFee + vatAmount;
  const currency = cartItems[0]?.products?.currency ?? 'USD';

  const handlePlaceOrder = async () => {
    setError(null);

    if (!address.street || !address.city || !address.state || !address.zipCode || !selectedCountry) {
      setError('Please complete the shipping address and select a country.');
      return;
    }
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setPlacing(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const orderNumber = `ORD-${Date.now()}`;
      const platformCommission = subtotal * 0.1;
      const supplierId = cartItems.length === 1 ? cartItems[0]?.products?.supplier_id : undefined;

      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: { amount: total, currency: currency.toLowerCase(), supplier_id: supplierId } }
      );

      if (intentError || !intentData?.clientSecret) {
        throw new Error(intentError?.message ?? 'Failed to initialize payment');
      }

      const { error: confirmError } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (confirmError) {
        throw new Error(confirmError.message ?? 'Payment failed');
      }

      const fullAddress = { ...address, country: selectedCountry.name };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          status: 'pending',
          subtotal,
          tax: 0,
          shipping_fee: shippingFee,
          vat_amount: vatAmount,
          shipping_country_id: selectedCountry.id,
          platform_commission: platformCommission,
          total,
          currency,
          shipping_address: fullAddress,
          billing_address: fullAddress,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order');

      const orderItems = cartItems
        .filter((row) => row.products)
        .map((row) => ({
          order_id: order.id,
          product_id: row.product_id,
          supplier_id: row.products!.supplier_id,
          product_name: row.products!.name,
          quantity: row.quantity,
          unit_price: getPrice(row),
          subtotal: getPrice(row) * row.quantity,
          supplier_amount: getPrice(row) * row.quantity * 0.9,
          platform_commission: getPrice(row) * row.quantity * 0.1,
        }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      await Promise.all(
        cartItems.map(async (row) => {
          const { data: p } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', row.product_id)
            .single();
          if (p) {
            await supabase
              .from('products')
              .update({ stock_quantity: Math.max(0, p.stock_quantity - row.quantity) })
              .eq('id', row.product_id);
          }
        })
      );

      await supabase.from('payments').insert({
        order_id: order.id,
        payment_gateway: 'stripe',
        payment_method: 'card',
        amount: total,
        currency,
        status: 'completed',
      });

      await supabase.from('cart_items').delete().eq('user_id', user.id);

      router.push('/orders');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Shipping address</h2>
        <select
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select destination country…</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Street address"
          value={address.street}
          onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="State"
            value={address.state}
            onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="ZIP code"
            value={address.zipCode}
            onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment</h2>
        <div className="rounded-md border border-slate-300 p-3">
          <CardElement options={{ style: { base: { fontSize: '14px' } } }} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Order summary</h2>
        {packages.map((pkg) => (
          <div key={pkg.supplierId} className="mb-3 border-b border-slate-100 pb-3 last:border-0">
            <p className="mb-1 text-xs font-semibold text-slate-600">{pkg.supplierName}</p>
            {pkg.items.map((row) => (
              <div key={row.id} className="flex justify-between text-sm text-slate-600">
                <span>
                  {row.products?.name} x {row.quantity}
                </span>
                <span>{(getPrice(row) * row.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>Shipping</span>
              <span>{pkg.shippingFee.toFixed(2)}</span>
            </div>
          </div>
        ))}

        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>
            {currency} {subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span>
            {currency} {shippingFee.toFixed(2)}
          </span>
        </div>
        {selectedCountry && (
          <div className="flex justify-between text-sm text-slate-600">
            <span>
              VAT ({selectedCountry.vat_percentage}%){isVatIncluded ? ' — included' : ''}
            </span>
            <span>{isVatIncluded ? 'Included' : `${currency} ${vatAmount.toFixed(2)}`}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>
            {currency} {total.toFixed(2)}
          </span>
        </div>
      </section>

      <button
        onClick={handlePlaceOrder}
        disabled={placing || !stripe}
        className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {placing ? 'Placing order…' : `Pay ${currency} ${total.toFixed(2)}`}
      </button>
    </div>
  );
}
