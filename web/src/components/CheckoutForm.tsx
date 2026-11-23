'use client';

/**
 * Web port of mobile `app/checkout.tsx`.
 *
 * The Stripe Elements flow below is the one that already worked on web and is
 * preserved verbatim in ordering and payloads:
 *   create-payment-intent edge fn -> confirmCardPayment ->
 *   orders -> order_items -> stock decrement -> payments -> clear cart_items
 *
 * Schema notes (verified against the mobile source, migrations are stale):
 *  - `payments` uses payment_gateway + payment_method (no stripe intent column)
 *  - `supplier_shipping_rates` uses shipping_charge / delivery_time_days / is_active
 *  - `orders` carries vat_amount + shipping_country_id
 *  - order_items split: 6% platform commission for wholesale (B2B) / 11% for retail (B2C)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Globe, MapPin, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/providers/CartProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useToast } from '@/providers/ToastProvider';
import { getVariantsForProduct, clearCartVariants } from '@/lib/cart-variants';
import {
  Button,
  EmptyState,
  Input,
  Select,
  Skeleton,
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  StripeLogo,
  ApplePayLogo,
  GooglePayLogo,
} from '@/components/ui';
import { CheckoutSuccess } from '@/components/checkout/CheckoutSuccess';
import { OrderTotals } from '@/components/checkout/OrderTotals';
import { SupplierPackageList } from '@/components/checkout/SupplierPackageList';
import {
  type CheckoutCartRow,
  type ShippingAddress,
  type SupplierPackage,
  type SupplierRateMap,
} from '@/components/checkout/types';
import type { Country } from '@/types/database';

const CART_SELECT = `
  id, product_id, quantity,
  products (
    id, name, b2c_price, b2b_price, currency, supplier_id, shipping_cost,
    suppliers (id, business_name, user_id)
  )
`;

/**
 * Distinct `products.currency` codes in the cart, in first-seen order.
 *
 * One order carries exactly one currency: it is what Stripe charges and what
 * gets written to `orders.currency` (and read back by `order_items` /
 * `payments`, which have no currency of their own). Line prices from products
 * in different currencies therefore cannot be summed into a subtotal, and no
 * single code on the order would be right for all of them — such a cart has to
 * be split rather than charged.
 */
function cartCurrencies(rows: CheckoutCartRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => row.products?.currency)
        .filter((code): code is string => Boolean(code))
        .map((code) => code.toUpperCase())
    ),
  ];
}

export default function CheckoutForm({
  isB2B = false,
  initialAddress = null,
}: {
  isB2B?: boolean;
  /** profiles.address (jsonb) — mobile prefills the form from it. */
  initialAddress?: Partial<ShippingAddress> | null;
}) {
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState<CheckoutCartRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: items }, { data: countryList }] = await Promise.all([
        supabase.from('cart_items').select(CART_SELECT).eq('user_id', user.id),
        // `countries.is_active` is `boolean DEFAULT true` with no NOT NULL, so a
        // NULL row is active-by-default — `.eq(true)` would hide it.
        supabase.from('countries').select('*').not('is_active', 'is', false).order('name'),
      ]);

      setCartItems((items as unknown as CheckoutCartRow[]) ?? []);
      setCountries((countryList as Country[]) ?? []);
      setLoading(false);
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={26} />}
        title={t.yourCartIsEmpty ?? 'Your cart is empty'}
        message={t.startAddingItems ?? 'Start adding items from the shop'}
        action={
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
          >
            {t.browseShop ?? 'Browse Shop'}
          </Link>
        }
      />
    );
  }

  /*
    A mixed-currency cart cannot be charged: see `cartCurrencies` above. Block
    it here — before Stripe is even initialized — rather than silently billing
    everything in the first line's currency.
  */
  const currencies = cartCurrencies(cartItems);

  if (currencies.length > 1) {
    return <MixedCurrencyBlock currencies={currencies} />;
  }

  return (
    <Elements stripe={getStripe()}>
      <CheckoutInner
        cartItems={cartItems}
        countries={countries}
        isB2B={isB2B}
        initialAddress={initialAddress}
      />
    </Elements>
  );
}

/** Explains the split the shopper has to make, naming the currencies involved. */
function MixedCurrencyBlock({ currencies }: { currencies: string[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-5">
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
        {t.checkout ?? 'Checkout'}
      </h1>

      <section className="rounded-2xl border border-error bg-error/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-error" />
          <div className="min-w-0 space-y-2">
            <h2 className="text-2xl font-bold text-error">
              Your cart mixes {currencies.length} currencies
            </h2>
            <p className="text-md leading-6 text-content-secondary">
              These items are priced in{' '}
              <span className="font-bold text-content-primary">{currencies.join(', ')}</span>. One
              order can only be charged in a single currency, and amounts in different currencies
              cannot be added together — so this cart cannot be paid for in one go.
            </p>
            <p className="text-md leading-6 text-content-secondary">
              Please place a separate order per currency: go back to your cart, keep the items of
              one currency, and check out. Then repeat for the rest.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/cart"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
          >
            Back to Cart
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-edge bg-surface px-5 text-xl font-bold text-content-primary transition-colors hover:bg-surface-page"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

function CheckoutInner({
  cartItems,
  countries,
  isB2B,
  initialAddress,
}: {
  cartItems: CheckoutCartRow[];
  countries: Country[];
  isB2B: boolean;
  initialAddress: Partial<ShippingAddress> | null;
}) {
  const { t } = useLanguage();
  const { currency: activeCurrency, formatPrice } = useCurrency();
  const { toast } = useToast();
  const { clear, refresh } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [address, setAddress] = useState<ShippingAddress>({
    street: initialAddress?.street ?? '',
    city: initialAddress?.city ?? '',
    state: initialAddress?.state ?? '',
    zipCode: initialAddress?.zipCode ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress | 'country', string>>>({});
  const [countryId, setCountryId] = useState('');
  const [supplierRates, setSupplierRates] = useState<SupplierRateMap>({});
  const [calculatingRates, setCalculatingRates] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{
    id: string | null;
    number: string;
    total: number;
    currency: string;
    /** Post-charge bookkeeping that did not land — shown as a warning. */
    issues: string[];
  } | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.id === countryId) ?? null,
    [countries, countryId]
  );

  /* ── Shipping rates per supplier for the chosen destination ──────────── */
  useEffect(() => {
    if (!selectedCountry) {
      setSupplierRates({});
      return;
    }

    const supplierIds = [
      ...new Set(cartItems.map((row) => row.products?.supplier_id).filter(Boolean)),
    ] as string[];

    if (supplierIds.length === 0) return;

    let cancelled = false;
    setCalculatingRates(true);

    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('supplier_shipping_rates')
        .select('supplier_id, shipping_charge, delivery_time_days')
        .eq('country_id', selectedCountry.id)
        .eq('is_active', true)
        .in('supplier_id', supplierIds);

      if (cancelled) return;

      const map: SupplierRateMap = {};
      (data ?? []).forEach((rate) => {
        map[rate.supplier_id] = {
          charge: rate.shipping_charge,
          deliveryDays: rate.delivery_time_days ?? null,
        };
      });

      setSupplierRates(map);
      setCalculatingRates(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [selectedCountry, cartItems]);

  /** Mobile: b2b pricing only when the role is b2b AND b2b_price is set. */
  const unitPrice = useCallback(
    (row: CheckoutCartRow) => {
      const p = row.products;
      if (!p) return 0;
      if (isB2B && p.b2b_price) return p.b2b_price;
      return p.b2c_price;
    },
    [isB2B]
  );

  /* ── One package per supplier ────────────────────────────────────────── */
  const packages = useMemo<SupplierPackage[]>(() => {
    const map = new Map<string, SupplierPackage>();

    for (const row of cartItems) {
      if (!row.products) continue;

      const supplierId = row.products.supplier_id || 'unknown';
      let pkg = map.get(supplierId);

      if (!pkg) {
        const rate = selectedCountry ? supplierRates[supplierId] : undefined;
        pkg = {
          supplierId,
          supplierName: row.products.suppliers?.business_name ?? 'Global Supplier',
          items: [],
          shippingFee: rate ? rate.charge : 0,
          deliveryDays: rate ? rate.deliveryDays : null,
          hasRate: Boolean(rate),
        };
        map.set(supplierId, pkg);
      }

      pkg.items.push(row);

      // No configured rate for this country -> fall back to per-product cost.
      if (!pkg.hasRate) {
        pkg.shippingFee += (row.products.shipping_cost ?? 0) * row.quantity;
      }
    }

    return Array.from(map.values());
  }, [cartItems, selectedCountry, supplierRates]);

  const subtotal = cartItems.reduce((sum, row) => sum + unitPrice(row) * row.quantity, 0);
  const shippingFee = packages.reduce((sum, pkg) => sum + pkg.shippingFee, 0);
  const vatIncluded = selectedCountry?.vat_type === 'included';
  const vatAmount =
    selectedCountry && !vatIncluded ? (subtotal * selectedCountry.vat_percentage) / 100 : 0;
  const total = subtotal + shippingFee + vatAmount;
  const currency = activeCurrency?.code ?? cartItems[0]?.products?.currency ?? 'USD';

  /*
    The parent blocks a mixed-currency cart before rendering this form, so this
    is only a backstop: `subtotal`/`total` above sum line prices across every
    cart line, and `currency` is the single code sent to Stripe and written to
    orders / order_items / payments. If they ever disagree, refuse to charge.
  */
  const mixedCurrencies = cartCurrencies(cartItems);

  const validate = () => {
    const next: typeof errors = {};
    if (!address.street.trim()) next.street = t.required ?? 'Required';
    if (!address.city.trim()) next.city = t.required ?? 'Required';
    if (!address.state.trim()) next.state = t.required ?? 'Required';
    if (!address.zipCode.trim()) next.zipCode = t.required ?? 'Required';
    if (!selectedCountry) next.country = t.required ?? 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (mixedCurrencies.length > 1) {
      setError(
        `Your cart mixes ${mixedCurrencies.join(', ')}. One order can only be charged in a single currency — please order the items of each currency separately.`
      );
      return;
    }

    if (!validate() || !selectedCountry) {
      setError('Please complete the shipping address and select a destination country.');
      return;
    }
    if (!stripe || !elements) {
      setError('Payment gateway is still initializing. Please wait a moment and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Please enter your card details in the payment section.');
      return;
    }

    setPlacing(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const orderNumber = `ORD-${Date.now()}`;
      const activeRate = activeCurrency?.rate ?? 1;

      // Resolve effective per-supplier commission rates (default: 11% retail / 6% B2B,
      // or Super Admin's global / per-supplier custom rates).
      const defaultFallbackRate = isB2B ? 0.06 : 0.11;
      const supplierCommissionMap = new Map<string, number>();
      let globalDefaultRate = defaultFallbackRate;

      try {
        const supplierIds = Array.from(
          new Set(
            cartItems
              .map((row) => row.products?.supplier_id)
              .filter((id): id is string => Boolean(id))
          )
        );
        const [{ data: globalRates }, { data: suppRates }] = await Promise.all([
          (supabase.rpc as any)('get_platform_commission_rates'),
          supplierIds.length > 0
            ? (supabase.rpc as any)('get_supplier_commission_rates', {
                p_supplier_ids: supplierIds,
              })
            : Promise.resolve({ data: [] }),
        ]);

        if (globalRates) {
          const pct = isB2B
            ? Number(globalRates.b2b_commission_rate)
            : Number(globalRates.retail_commission_rate);
          if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
            globalDefaultRate = pct / 100;
          }
        }

        if (Array.isArray(suppRates)) {
          for (const r of suppRates) {
            const pct = isB2B ? Number(r.b2b_rate) : Number(r.retail_rate);
            if (r.supplier_id && Number.isFinite(pct) && pct >= 0 && pct <= 100) {
              supplierCommissionMap.set(r.supplier_id, pct / 100);
            }
          }
        }
      } catch (rateErr) {
        console.warn('Using fallback commission rates:', rateErr);
      }

      const rateForSupplier = (suppId: string | undefined) =>
        (suppId ? supplierCommissionMap.get(suppId) : undefined) ?? globalDefaultRate;

      const convertedTotal = Math.round(total * activeRate * 100) / 100;
      const convertedSubtotal = Math.round(subtotal * activeRate * 100) / 100;
      const convertedShippingFee = Math.round(shippingFee * activeRate * 100) / 100;
      const convertedVatAmount = Math.round(vatAmount * activeRate * 100) / 100;

      // Exact per-supplier shipping breakdown (in order currency) so instant Stripe
      // transfers send each supplier their exact shipping fee.
      const supplierShippingBreakdown: Record<string, number> = {};
      for (const pkg of packages) {
        if (pkg.supplierId && pkg.supplierId !== 'unknown') {
          supplierShippingBreakdown[pkg.supplierId] =
            Math.round(pkg.shippingFee * activeRate * 100) / 100;
        }
      }

      const uniqueCartSupplierIds = Array.from(
        new Set(cartItems.map((r) => r.products?.supplier_id).filter(Boolean))
      );
      const singleSupplierId =
        uniqueCartSupplierIds.length === 1 ? uniqueCartSupplierIds[0] : undefined;

      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount: convertedTotal,
            currency: currency.toLowerCase(),
            supplier_id: singleSupplierId,
            is_b2b: isB2B,
            order_number: orderNumber,
          },
        }
      );

      if (intentError || !intentData?.clientSecret) {
        throw new Error(intentError?.message ?? 'Failed to initialize payment');
      }

      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: { card: cardElement },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message ?? 'Payment failed');
      }

      const confirmedPaymentIntentId: string | null =
        paymentIntent?.id ?? intentData.paymentIntentId ?? null;

      const fullAddress = { ...address, country: selectedCountry.name };

      // Compile detailed order variant notes (e.g. 2 blue shoes size 38, 2 red shoes size 42)
      const orderSummaryNotes = cartItems
        .filter((row) => row.products)
        .map((row) => {
          const variants = getVariantsForProduct(row.product_id);
          const varText =
            variants.length > 0
              ? variants
                  .map(
                    (v) =>
                      `${v.quantity}x [${v.color ? `Colour: ${v.color}` : ''}${v.color && v.size ? ', ' : ''}${v.size ? `Size: ${v.size}` : ''}]`
                  )
                  .join(', ')
              : `${row.quantity}x`;
          return `${row.products!.name}: ${varText}`;
        })
        .join(' | ');

      // Pre-compute line items so order.platform_commission matches the exact
      // sum of per-supplier commissions (supporting custom per-supplier rates).
      const draftOrderItems = cartItems
        .filter((row) => row.products)
        .flatMap((row) => {
          const variants = getVariantsForProduct(row.product_id);
          const convertedUnitPrice = Math.round(unitPrice(row) * activeRate * 100) / 100;
          const itemCommRate = rateForSupplier(row.products!.supplier_id);
          const itemSuppRate = 1 - itemCommRate;

          if (variants.length > 0) {
            return variants.map((v) => {
              const details = [
                v.color ? `Colour: ${v.color}` : '',
                v.size ? `Size: ${v.size}` : '',
              ]
                .filter(Boolean)
                .join(', ');
              const fullProductName = details
                ? `${row.products!.name} (${details})`
                : row.products!.name;

              const lineSubtotal = Math.round(convertedUnitPrice * v.quantity * 100) / 100;
              const lineCommission = Math.round(lineSubtotal * itemCommRate * 100) / 100;
              const lineSupplierAmount = Math.round((lineSubtotal - lineCommission) * 100) / 100;
              return {
                product_id: row.product_id,
                supplier_id: row.products!.supplier_id,
                product_name: fullProductName,
                quantity: v.quantity,
                unit_price: convertedUnitPrice,
                subtotal: lineSubtotal,
                supplier_amount: lineSupplierAmount,
                platform_commission: lineCommission,
              };
            });
          }

          const lineSubtotal = Math.round(convertedUnitPrice * row.quantity * 100) / 100;
          const lineCommission = Math.round(lineSubtotal * itemCommRate * 100) / 100;
          const lineSupplierAmount = Math.round(lineSubtotal * itemSuppRate * 100) / 100;
          return [
            {
              product_id: row.product_id,
              supplier_id: row.products!.supplier_id,
              product_name: row.products!.name,
              quantity: row.quantity,
              unit_price: convertedUnitPrice,
              subtotal: lineSubtotal,
              supplier_amount: Math.round((lineSubtotal - lineCommission) * 100) / 100 || lineSupplierAmount,
              platform_commission: lineCommission,
            },
          ];
        });

      const convertedCommission =
        Math.round(
          draftOrderItems.reduce((sum, item) => sum + item.platform_commission, 0) * 100
        ) / 100;

      const baseOrderPayload = {
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        subtotal: convertedSubtotal,
        tax: 0,
        shipping_fee: convertedShippingFee,
        vat_amount: convertedVatAmount,
        shipping_country_id: selectedCountry.id,
        platform_commission: convertedCommission,
        total: convertedTotal,
        currency,
        shipping_address: fullAddress,
        billing_address: fullAddress,
        notes: orderSummaryNotes || null,
      };

      let { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...baseOrderPayload,
          supplier_shipping_breakdown: supplierShippingBreakdown,
        })
        .select()
        .single();

      // Fallback if supplier_shipping_breakdown migration hasn't been applied yet
      if (orderError && orderError.message?.includes('supplier_shipping_breakdown')) {
        const retry = await supabase
          .from('orders')
          .insert(baseOrderPayload)
          .select()
          .single();
        order = retry.data;
        orderError = retry.error;
      }

      if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order');

      const orderItems = draftOrderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      // Immediately notify each supplier whose products were ordered
      try {
        const uniqueSupplierIds = Array.from(
          new Set(orderItems.map((i) => i.supplier_id).filter(Boolean))
        );
        for (const suppId of uniqueSupplierIds) {
          const { data: supp } = await supabase
            .from('suppliers')
            .select('user_id, business_name')
            .eq('id', suppId)
            .maybeSingle();

          if (supp?.user_id) {
            const itemsForSupplier = orderItems.filter((i) => i.supplier_id === suppId);
            const itemNames = itemsForSupplier.map((i) => `${i.product_name} (x${i.quantity})`).join(', ');

            await supabase.from('notifications').insert({
              user_id: supp.user_id,
              title: 'New Order Received',
              message: `Order #${orderNumber} received for: ${itemNames.length > 80 ? `${itemNames.slice(0, 77)}...` : itemNames}`,
              type: 'new_order',
              payload: { order_id: order.id, order_number: orderNumber },
            });
          }
        }
      } catch (notifyErr) {
        console.error('Failed to notify suppliers of new order:', notifyErr);
      }

      /*
       * From here on the card is already charged and the order + line items
       * exist, so a failure must NOT abort the flow — it is surfaced as a
       * warning on the success screen instead. A missing `payments` row is an
       * unreconciled charge, so it is called out explicitly.
       */
      const issues: string[] = [];

      // Safe stock decrement (RPC or graceful update)
      await Promise.all(
        cartItems.map(async (row) => {
          try {
            const { error: rpcError } = await (supabase.rpc as any)('decrement_product_stock_safe', {
              p_product_id: row.product_id,
              p_quantity: row.quantity,
            });
            if (!rpcError) return true;

            const { data: p } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', row.product_id)
              .maybeSingle();

            if (p && typeof p.stock_quantity === 'number') {
              await supabase
                .from('products')
                .update({ stock_quantity: Math.max(0, p.stock_quantity - row.quantity) })
                .eq('id', row.product_id);
            }
            return true;
          } catch {
            return true;
          }
        })
      );

      const { data: paymentRows, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_gateway: 'stripe',
          payment_method: 'card',
          transaction_id: confirmedPaymentIntentId,
          amount: convertedTotal,
          currency,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select('id');

      if (paymentError || !paymentRows || paymentRows.length === 0) {
        console.error(
          'Payment record insert failed for order',
          order.id,
          paymentError ?? 'no row was inserted'
        );
        issues.push('the payment receipt could not be recorded');
      }

      // Trigger instant Stripe Connect payment split (Separate Charges & Transfers):
      // Platform retains Commission + VAT; each Supplier receives (Items Net + Shipping Fee).
      if (confirmedPaymentIntentId) {
        try {
          const { error: splitError } = await supabase.functions.invoke(
            'process-order-transfers',
            {
              body: {
                order_id: order.id,
                payment_intent_id: confirmedPaymentIntentId,
              },
            }
          );
          if (splitError) {
            console.error('Instant split transfer warning:', splitError);
          }
        } catch (splitErr) {
          console.error('Failed to invoke process-order-transfers:', splitErr);
        }
      }

      const { data: clearedRows, error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .select('id');

      // The cart is non-empty by the time this screen renders, so a zero-row
      // delete means the statement never reached the rows.
      if (cartError || !clearedRows || clearedRows.length === 0) {
        console.error(
          'Could not clear the cart after checkout:',
          cartError ?? 'no rows were deleted'
        );
        issues.push('your cart could not be emptied');
      }

      clear();
      clearCartVariants();
      void refresh();

      setPlaced({ id: order.id, number: orderNumber, total: convertedTotal, currency, issues });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast({
        title: 'Payment Failed',
        message: msg,
        kind: 'error',
      });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <CheckoutSuccess
        orderId={placed.id}
        orderNumber={placed.number}
        total={placed.total}
        currency={placed.currency}
        issues={placed.issues}
      />
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
        {t.checkout ?? 'Checkout'}
      </h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-error bg-error/10 px-3.5 py-2.5 text-md font-bold text-error"
        >
          {error}
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Shipping address + destination country */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-edge bg-surface p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              <h2 className="text-2xl font-bold text-content-primary">
                {t.shippingAddress ?? 'Shipping Address'}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <Select
                label={t.country ?? 'Destination Country'}
                value={countryId}
                error={errors.country}
                onChange={(e) => {
                  setCountryId(e.target.value);
                  setErrors((prev) => ({ ...prev, country: undefined }));
                }}
              >
                <option value="">Select destination country…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>

              {selectedCountry && (
                <p className="flex items-center gap-1.5 text-sm font-bold text-content-tertiary">
                  <Globe size={13} className="shrink-0" />
                  {vatIncluded
                    ? `VAT ${selectedCountry.vat_percentage}% is already included in the listed prices.`
                    : `VAT ${selectedCountry.vat_percentage}% will be added to the total.`}
                </p>
              )}

              <Input
                label={t.streetAddress ?? 'Street Address'}
                value={address.street}
                error={errors.street}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, street: e.target.value }));
                  setErrors((prev) => ({ ...prev, street: undefined }));
                }}
              />
              <Input
                label={t.city ?? 'City'}
                value={address.city}
                error={errors.city}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, city: e.target.value }));
                  setErrors((prev) => ({ ...prev, city: undefined }));
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t.state ?? 'State'}
                  value={address.state}
                  error={errors.state}
                  onChange={(e) => {
                    setAddress((a) => ({ ...a, state: e.target.value }));
                    setErrors((prev) => ({ ...prev, state: undefined }));
                  }}
                />
                <Input
                  label={t.zipCode ?? 'ZIP Code'}
                  value={address.zipCode}
                  error={errors.zipCode}
                  onChange={(e) => {
                    setAddress((a) => ({ ...a, zipCode: e.target.value }));
                    setErrors((prev) => ({ ...prev, zipCode: undefined }));
                  }}
                />
              </div>
            </div>
          </motion.section>

          {/* Payment */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
            className="rounded-2xl border border-edge bg-surface p-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <h2 className="text-2xl font-bold text-content-primary">
                  {t.paymentMethod ?? 'Payment Method'}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <VisaLogo className="h-6 w-9 rounded" />
                <MastercardLogo className="h-6 w-9 rounded" />
                <AmexLogo className="h-6 w-9 rounded" />
                <StripeLogo className="h-6 w-9 rounded" />
                <ApplePayLogo className="h-6 w-9 rounded" />
                <GooglePayLogo className="h-6 w-9 rounded" />
              </div>
            </div>

            <div className="min-h-[52px] rounded-xl border-[1.5px] border-edge bg-surface-page px-3.5 py-3.5 focus-within:border-primary">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '15px',
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      '::placeholder': {
                        color: '#9CA3AF',
                      },
                    },
                    invalid: {
                      color: '#EF4444',
                    },
                  },
                }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-content-tertiary">
              <p>
                {t.creditDebitCard ?? 'Credit/Debit Card, Apple Pay & Google Pay'} — processed securely by Stripe.
              </p>
              <span className="font-semibold text-success">256-bit Encrypted</span>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-error bg-error/10 p-3 text-md font-bold text-error">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-error" />
                <span>{error}</span>
              </div>
            )}
          </motion.section>
        </div>

        {/* Order summary: per-supplier packages + totals */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-5 lg:sticky lg:top-6"
        >
          <h2 className="text-2xl font-bold text-content-primary">
            {t.orderSummary ?? 'Order Summary'}
          </h2>

          <SupplierPackageList
            packages={packages}
            currency={currency}
            unitPrice={unitPrice}
            calculating={calculatingRates}
          />

          <OrderTotals
            currency={currency}
            subtotal={subtotal}
            shippingFee={shippingFee}
            vatAmount={vatAmount}
            total={total}
            country={selectedCountry}
          />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-error bg-error/10 p-3 text-sm font-bold text-error">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-error" />
              <span>{error}</span>
            </div>
          )}

          <Button
            size="lg"
            fullWidth
            loading={placing}
            disabled={placing || calculatingRates || !stripe || mixedCurrencies.length > 1}
            onClick={() => void handlePlaceOrder()}
          >
            {placing
              ? (t.placeOrder ?? 'Place Order')
              : `${t.placeOrder ?? 'Place Order'} · ${formatPrice(total)}`}
          </Button>

          <p className="text-center text-2xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
            Shown in {currency}
          </p>
        </motion.aside>
      </div>
    </div>
  );
}
