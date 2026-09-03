import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  PaymentSettingsForm,
  type PaymentSettingsView,
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

  const { data, error } = await supabase
    .from('payment_settings')
    .select('stripe_secret_key, stripe_publishable_key, updated_at')
    .eq('id', 1)
    .maybeSingle();

  const storedSecret = data?.stripe_secret_key?.trim() ?? '';
  const masked = storedSecret ? maskSecretKey(storedSecret) : null;

  // Only the mask crosses the server/client boundary — `storedSecret` is
  // deliberately not part of `settings`, and is never logged.
  const settings: PaymentSettingsView = {
    secretKeyMask: masked?.mask ?? null,
    secretKeyMode: masked?.mode ?? null,
    publishableKey: data?.stripe_publishable_key ?? null,
    updatedAt: data?.updated_at ?? null,
    loadError: error
      ? `${error.message} — the singleton row is readable only by admins.`
      : null,
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Payment Settings
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          Manage the platform&apos;s Stripe API keys
        </p>
      </header>

      <PaymentSettingsForm settings={settings} />
    </div>
  );
}
