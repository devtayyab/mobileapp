import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  PaymentSettingsForm,
  type PaymentSettingsView,
  type AdminPaymentSplitItem,
} from '@/components/admin/PaymentSettingsForm';

export const dynamic = 'force-dynamic';

/**
 * Renders a Stripe secret key as `sk_live_…a1b2` — the environment prefix
 * (operationally important, not sensitive) plus the last 4 characters.
 *
 * Anything shorter than a plausible key is reduced to a bare prefix so a
 * short/garbage value can't leak most of itself through the "last 4".
 */
function maskSecretKey(key: string): { mask: string; mode: 'test' | 'live' | 'unknown' } {
  const mode = key.startsWith('sk_live_')
    ? 'live'
    : key.startsWith('sk_test_')
      ? 'test'
      : key.startsWith('sk_')
        ? 'unknown'
        : 'unknown';

  const prefix = mode === 'live' ? 'sk_live_' : mode === 'test' ? 'sk_test_' : 'sk_';
  const body = key.slice(prefix.length);

  // Only reveal the tail when there is enough hidden material left behind it.
  const tail = body.length >= 12 ? body.slice(-4) : '';

  return { mask: `${prefix}${'•'.repeat(8)}${tail}`, mode };
}

/**
 * Ported from mobile `app/admin/payment-settings.tsx`, with the secret key
 * handling tightened:
 *
 * - Mobile loads `stripe_secret_key` into a `TextInput` (masked only by
 *   `secureTextEntry`) and re-sends it on every save. Here the plaintext
 *   secret never leaves the server: only a mask is passed to the client, and
 *   a new value is written only when the admin explicitly replaces it.
 * - Mobile `upsert`s the whole row, so a partial payload would null the other
 *   column. The form sends only the changed fields.
 * - `payment_settings.id` is an INT singleton pinned to 1 (CHECK (id = 1)),
 *   not a uuid.
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 */
export default async function AdminPaymentSettingsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const [{ data, error }, { data: splitRows }] = await Promise.all([
    supabase
      .from('payment_settings')
      .select(
        'stripe_secret_key, stripe_publishable_key, retail_commission_rate, b2b_commission_rate, updated_at'
      )
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('payment_splits')
      .select(
        'id, order_id, supplier_id, split_type, amount, currency, subtotal_amount, commission_amount, shipping_amount, status, payout_reference, failure_reason, created_at, paid_at'
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const splits = splitRows ?? [];
  const orderIds = Array.from(new Set(splits.map((s) => s.order_id).filter(Boolean))) as string[];
  const supplierIds = Array.from(
    new Set(splits.map((s) => s.supplier_id).filter(Boolean))
  ) as string[];

  const [ordersRes, suppliersRes] = await Promise.all([
    orderIds.length
      ? supabase.from('orders').select('id, order_number').in('id', orderIds)
      : Promise.resolve({ data: [] as { id: string; order_number: string }[] }),
    supplierIds.length
      ? supabase
          .from('suppliers')
          .select('id, business_name, stripe_onboarding_complete')
          .in('id', supplierIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            business_name: string;
            stripe_onboarding_complete: boolean | null;
          }[],
        }),
  ]);

  const orderMap = new Map((ordersRes.data ?? []).map((o) => [o.id, o.order_number]));
  const supplierMap = new Map(
    (suppliersRes.data ?? []).map((s) => [
      s.id,
      { name: s.business_name, stripeReady: Boolean(s.stripe_onboarding_complete) },
    ])
  );

  const recentSplits: AdminPaymentSplitItem[] = splits.map((s) => ({
    id: s.id,
    order_id: s.order_id,
    order_number: s.order_id ? (orderMap.get(s.order_id) ?? null) : null,
    supplier_id: s.supplier_id,
    supplier_name: s.supplier_id ? (supplierMap.get(s.supplier_id)?.name ?? 'Supplier') : null,
    supplier_stripe_ready: s.supplier_id
      ? (supplierMap.get(s.supplier_id)?.stripeReady ?? false)
      : false,
    split_type: s.split_type,
    amount: Number(s.amount ?? 0),
    currency: s.currency ?? 'USD',
    subtotal_amount: Number(s.subtotal_amount ?? 0),
    commission_amount: Number(s.commission_amount ?? 0),
    shipping_amount: Number(s.shipping_amount ?? 0),
    status: s.status ?? 'pending',
    payout_reference: s.payout_reference,
    failure_reason: s.failure_reason,
    created_at: s.created_at,
    paid_at: s.paid_at,
  }));

  const storedSecret = data?.stripe_secret_key?.trim() ?? '';
  const masked = storedSecret ? maskSecretKey(storedSecret) : null;

  // Only the mask crosses the server/client boundary — `storedSecret` is
  // deliberately not part of `settings`, and is never logged.
  const settings: PaymentSettingsView = {
    secretKeyMask: masked?.mask ?? null,
    secretKeyMode: masked?.mode ?? null,
    publishableKey: data?.stripe_publishable_key ?? null,
    retailCommissionRate: Number(data?.retail_commission_rate ?? 11),
    b2bCommissionRate: Number(data?.b2b_commission_rate ?? 6),
    updatedAt: data?.updated_at ?? null,
    loadError: error
      ? `${error.message} — the singleton row is readable only by admins.`
      : null,
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Payment &amp; Split Settings
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          Manage Stripe API keys, global Retail/B2B commission rates, and supplier payment splits
        </p>
      </header>

      <PaymentSettingsForm settings={settings} initialSplits={recentSplits} />
    </div>
  );
}
