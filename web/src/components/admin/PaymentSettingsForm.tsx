'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Percent,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import { Badge, Button, ConfirmDialog, Input } from '@/components/ui';
import { formatOrderAmount } from '@/components/orders/types';

/**
 * `payment_settings` is an INT singleton pinned to `id = 1` (NOT a uuid) —
 * see 20260709191500_add_payment_settings.sql and CONTRIBUTING.md.
 */
const SETTINGS_ID = 1;

export type AdminPaymentSplitItem = {
  id: string;
  order_id: string | null;
  order_number: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  supplier_stripe_ready: boolean;
  split_type: string;
  amount: number;
  currency: string;
  subtotal_amount: number;
  commission_amount: number;
  shipping_amount: number;
  status: string;
  payout_reference: string | null;
  failure_reason: string | null;
  created_at: string;
  paid_at: string | null;
};

export type PaymentSettingsView = {
  /**
   * A masked rendering of `stripe_secret_key`, e.g. `sk_live_…a1b2`, or null
   * when no key is stored. The plaintext secret NEVER reaches the browser:
   * the mask is built server-side and the full value is not part of this
   * component's props, state, or DOM.
   */
  secretKeyMask: string | null;
  /** Which environment the stored secret belongs to, derived from its prefix. */
  secretKeyMode: 'test' | 'live' | 'unknown' | null;
  /**
   * Safe to render in full — a Stripe publishable key is designed to ship to
   * clients, and this project already exposes it to PUBLIC through the
   * `get_stripe_publishable_key()` SECURITY DEFINER RPC (20260713120000).
   */
  publishableKey: string | null;
  /** Default platform commission % on retail (B2C) product subtotal. */
  retailCommissionRate: number;
  /** Default platform commission % on wholesale (B2B) product subtotal. */
  b2bCommissionRate: number;
  updatedAt: string | null;
  /** Set when the singleton row could not be read (RLS or missing row). */
  loadError?: string | null;
};

export function PaymentSettingsForm({
  settings,
  initialSplits = [],
}: {
  settings: PaymentSettingsView;
  initialSplits?: AdminPaymentSplitItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [publishableKey, setPublishableKey] = useState(settings.publishableKey ?? '');
  const [replacingSecret, setReplacingSecret] = useState(false);
  const [secretDraft, setSecretDraft] = useState('');
  const [retailRateDraft, setRetailRateDraft] = useState(String(settings.retailCommissionRate));
  const [b2bRateDraft, setB2bRateDraft] = useState(String(settings.b2bCommissionRate));
  const [saving, setSaving] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [errors, setErrors] = useState<{
    secret?: string;
    publishable?: string;
    retailRate?: string;
    b2bRate?: string;
  }>({});

  const publishableDirty = publishableKey.trim() !== (settings.publishableKey ?? '').trim();
  const secretDirty = replacingSecret && secretDraft.trim().length > 0;
  const ratesDirty =
    Number(retailRateDraft) !== settings.retailCommissionRate ||
    Number(b2bRateDraft) !== settings.b2bCommissionRate;

  /**
   * Writes the singleton row. Only the fields the admin actually changed are
   * sent, so an untouched secret key is never re-transmitted — and a blank
   * "replace" box never silently nulls the stored key.
   *
   * The payload is deliberately never logged: `console.log(patch)` here would
   * put a live Stripe secret into the browser console and any log drain
   * attached to it.
   */
  const persist = async (patch: {
    stripe_secret_key?: string | null;
    stripe_publishable_key?: string | null;
    retail_commission_rate?: number;
    b2b_commission_rate?: number;
  }) => {
    const supabase = createClient();
    const payload = { ...patch, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('payment_settings')
      .update(payload)
      .eq('id', SETTINGS_ID)
      .select('id');

    if (error) return error.message;

    // The migration seeds row 1, but if it is missing (or a later reset
    // dropped it) insert it rather than silently saving nothing. Mobile uses
    // `upsert`, which would null out whichever column it wasn't sending.
    if ((data ?? []).length === 0) {
      const { error: insertError } = await supabase
        .from('payment_settings')
        .insert({ id: SETTINGS_ID, ...payload });

      if (insertError) return insertError.message;
    }

    return null;
  };

  const handleSave = async () => {
    const nextErrors: { secret?: string; publishable?: string } = {};
    const trimmedPublishable = publishableKey.trim();
    const trimmedSecret = secretDraft.trim();

    if (trimmedPublishable && !trimmedPublishable.startsWith('pk_')) {
      nextErrors.publishable = 'A Stripe publishable key starts with "pk_".';
    }

    if (replacingSecret && trimmedSecret && !trimmedSecret.startsWith('sk_')) {
      nextErrors.secret = 'A Stripe secret key starts with "sk_".';
    }

    if (replacingSecret && !trimmedSecret) {
      nextErrors.secret = 'Enter the new secret key, or cancel the replacement.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!publishableDirty && !secretDirty) {
      toast({ title: 'Nothing to save', message: 'No fields were changed.', kind: 'info' });
      return;
    }

    setSaving(true);

    const patch: { stripe_secret_key?: string | null; stripe_publishable_key?: string | null } = {};
    if (publishableDirty) patch.stripe_publishable_key = trimmedPublishable || null;
    if (secretDirty) patch.stripe_secret_key = trimmedSecret;

    const message = await persist(patch);
    setSaving(false);

    if (message) {
      toast({ title: 'Save failed', message, kind: 'error' });
      return;
    }

    // Drop the plaintext secret from state the moment it is persisted.
    setSecretDraft('');
    setReplacingSecret(false);
    toast({
      title: 'Payment settings saved',
      message: secretDirty ? 'Stripe keys updated.' : 'Publishable key updated.',
      kind: 'success',
    });
    router.refresh();
  };

  const handleSaveRates = async () => {
    const retail = Number.parseFloat(retailRateDraft);
    const b2b = Number.parseFloat(b2bRateDraft);
    const nextErrors: { retailRate?: string; b2bRate?: string } = {};

    if (Number.isNaN(retail) || retail < 0 || retail > 100) {
      nextErrors.retailRate = 'Enter a percentage between 0 and 100.';
    }
    if (Number.isNaN(b2b) || b2b < 0 || b2b > 100) {
      nextErrors.b2bRate = 'Enter a percentage between 0 and 100.';
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) return;

    setSavingRates(true);
    const message = await persist({
      retail_commission_rate: Math.round(retail * 100) / 100,
      b2b_commission_rate: Math.round(b2b * 100) / 100,
    });
    setSavingRates(false);

    if (message) {
      toast({ title: 'Save failed', message, kind: 'error' });
      return;
    }

    toast({
      title: 'Commission rates updated',
      message: `Retail: ${retail}% · Wholesale (B2B): ${b2b}%`,
      kind: 'success',
    });
    router.refresh();
  };

  const handleReleaseSplit = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('process-order-transfers', {
        body: { order_id: orderId },
      });

      if (error) {
        let msg = error.message;
        const ctx = (error as { context?: { json?: () => Promise<any> } }).context;
        if (ctx?.json) {
          try {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          } catch {
            /* ignore */
          }
        }
        throw new Error(msg);
      }

      const transfers = (data?.transfers ?? []) as Array<{
        status: string;
        business_name: string;
        reason?: string | null;
      }>;
      const completed = transfers.filter((t) => t.status === 'completed').length;
      const stillPending = transfers.filter((t) => t.status !== 'completed');

      toast({
        title: stillPending.length === 0 ? 'Payout Released' : 'Payout Check Complete',
        message:
          stillPending.length === 0
            ? `Successfully transferred payout for ${completed} supplier${completed === 1 ? '' : 's'}.`
            : stillPending.map((t) => `${t.business_name}: ${t.reason ?? 'Pending'}`).join(' | '),
        kind: stillPending.length === 0 ? 'success' : 'info',
      });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Transfer failed',
        message: e instanceof Error ? e.message : 'Could not trigger Stripe transfer.',
        kind: 'error',
      });
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleRemoveSecret = async () => {
    setSaving(true);
    const message = await persist({ stripe_secret_key: null });
    setSaving(false);
    setConfirmRemove(false);

    if (message) {
      toast({ title: 'Removal failed', message, kind: 'error' });
      return;
    }

    setSecretDraft('');
    setReplacingSecret(false);
    toast({
      title: 'Secret key removed',
      message: 'Stripe payments will fail until a new key is saved.',
      kind: 'success',
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-edge bg-surface-tint p-4">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-md font-bold text-content-primary">Admin-only credentials</p>
          <p className="mt-0.5 text-sm leading-5 text-content-secondary">
            These keys drive Stripe for the whole platform. The stored secret key is shown masked
            and is never sent to this page — replace it to change it. Only admins can read or write
            this row (RLS on <code className="font-mono">payment_settings</code>).
          </p>
        </div>
      </div>

      {settings.loadError && (
        <div className="rounded-2xl border border-error bg-error/10 p-4">
          <p className="text-md font-bold text-error">Could not read payment settings</p>
          <p className="mt-0.5 text-sm text-content-tertiary">{settings.loadError}</p>
        </div>
      )}

      <section className="rounded-2xl border border-edge bg-surface p-4">
        <h2 className="text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
          Stripe API Keys
        </h2>

        {/* ── Secret key ─────────────────────────────────────────────────── */}
        <div className="mt-4 border-b border-edge-light pb-4">
          <p className="text-md font-bold text-content-primary">Secret key</p>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Used by the backend to process payments and transfers. Never leaves the server in
            plaintext.
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border-[1.5px] border-edge bg-surface-page px-3.5 py-2.5">
              <KeyRound size={15} className="shrink-0 text-content-tertiary" />
              <code className="truncate text-md text-content-primary">
                {settings.secretKeyMask ?? 'No key stored'}
              </code>
            </span>

            {settings.secretKeyMode === 'live' && (
              <span className="rounded-3xl bg-error px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-white">
                Live mode
              </span>
            )}
            {settings.secretKeyMode === 'test' && (
              <span className="rounded-3xl bg-surface-page px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-content-tertiary">
                Test mode
              </span>
            )}
            {settings.secretKeyMode === 'unknown' && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-warning">
                <ShieldAlert size={14} />
                Stored value is not a valid <code className="font-mono">sk_</code> key
              </span>
            )}
          </div>

          {replacingSecret ? (
            <div className="mt-3 space-y-2.5">
              <Input
                autoFocus
                type="password"
                label="New secret key"
                placeholder="sk_live_… or sk_test_…"
                autoComplete="off"
                spellCheck={false}
                value={secretDraft}
                onChange={(e) => setSecretDraft(e.target.value)}
                error={errors.secret}
              />
              <div className="flex gap-2">
                <Button loading={saving} onClick={() => void handleSave()}>
                  <Save size={17} />
                  Save new secret key
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setReplacingSecret(false);
                    setSecretDraft('');
                    setErrors((prev) => ({ ...prev, secret: undefined }));
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setReplacingSecret(true)}>
                {settings.secretKeyMask ? 'Replace secret key' : 'Add secret key'}
              </Button>
              {settings.secretKeyMask && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:text-error"
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Publishable key ────────────────────────────────────────────── */}
        <div className="mt-4">
          <Input
            label="Publishable key"
            placeholder="pk_live_… or pk_test_…"
            autoComplete="off"
            spellCheck={false}
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            error={errors.publishable}
          />
          <p className="mt-1.5 text-sm text-content-tertiary">
            Used by the checkout UI. Publishable keys are meant to be public, so this one is shown
            in full.
          </p>
        </div>

        {!replacingSecret && (
          <div className="mt-4 flex items-center gap-3 border-t border-edge-light pt-4">
            <Button loading={saving} disabled={!publishableDirty} onClick={() => void handleSave()}>
              <Save size={17} />
              Save settings
            </Button>
            {settings.updatedAt && (
              <span className="text-sm text-content-tertiary">
                Last updated {new Date(settings.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Global Platform Commission Rates ───────────────────────────── */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="flex items-center gap-2">
          <Percent size={16} className="text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
            Platform Commission Rates (Instant Split Rules)
          </h2>
        </div>
        <p className="mt-1.5 text-sm leading-5 text-content-secondary">
          Applied to <strong>Product Subtotal</strong> only. Suppliers automatically receive{' '}
          <strong>(Subtotal − Commission) + 100% of Shipping Fee</strong> immediately via Stripe
          Connect. <strong>Platform Commission + VAT</strong> stay on the Platform Stripe account
          for tax remittance. You can also set custom per-supplier rates under{' '}
          <strong>Admin → Suppliers</strong>.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            label="Retail (B2C) Commission %"
            value={retailRateDraft}
            onChange={(e) => setRetailRateDraft(e.target.value)}
            error={errors.retailRate}
          />
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            label="Wholesale (B2B) Commission %"
            value={b2bRateDraft}
            onChange={(e) => setB2bRateDraft(e.target.value)}
            error={errors.b2bRate}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-edge-light pt-4">
          <Button
            loading={savingRates}
            disabled={!ratesDirty}
            onClick={() => void handleSaveRates()}
          >
            <Save size={17} />
            Save Commission Rates
          </Button>
          <span className="text-xs text-content-tertiary">
            Default: 11% Retail / 6% Wholesale (B2B)
          </span>
        </div>
      </section>

      {/* ── Payment Splits & Supplier Payouts Ledger ───────────────────── */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
              Recent Payment Splits &amp; Supplier Transfers
            </h2>
            <p className="mt-0.5 text-xs text-content-tertiary">
              Every paid order splits instantly. Pending supplier payouts (e.g. awaiting Stripe
              onboarding) can be released with 1 click once connected.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>

        {initialSplits.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-edge py-6 text-center text-sm text-content-tertiary">
            No payment split records yet — new card orders will appear here automatically.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-edge-light">
            {initialSplits.map((split) => {
              const isSupplierPayout = split.split_type === 'supplier_payout';
              const isCompleted = split.status === 'completed';
              const splitLabel =
                split.split_type === 'platform_commission'
                  ? 'Platform Commission'
                  : split.split_type === 'platform_vat'
                    ? 'Platform VAT (Tax Remittance)'
                    : split.supplier_name || 'Supplier Payout';

              return (
                <li
                  key={split.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-md font-bold text-content-primary">{splitLabel}</span>
                      {split.order_number && (
                        <span className="rounded-md bg-surface-page px-2 py-0.5 font-mono text-xs text-content-tertiary">
                          #{split.order_number}
                        </span>
                      )}
                      <Badge tone={isCompleted ? 'success' : 'warning'}>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Transferred
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            Pending
                          </span>
                        )}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-content-tertiary">
                      {isSupplierPayout
                        ? `Items: ${formatOrderAmount(split.currency, split.subtotal_amount)} · Comm: -${formatOrderAmount(split.currency, split.commission_amount)} · Shipping: +${formatOrderAmount(split.currency, split.shipping_amount)}`
                        : `Retained on Platform Stripe account`}
                      {split.payout_reference ? ` · Ref: ${split.payout_reference}` : ''}
                    </p>
                    {!isCompleted && split.failure_reason && (
                      <p className="mt-1 text-xs font-semibold text-warning">
                        {split.failure_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-content-primary">
                      {formatOrderAmount(split.currency, split.amount)}
                    </span>
                    {isSupplierPayout && !isCompleted && split.order_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={retryingOrderId === split.order_id}
                        onClick={() => void handleReleaseSplit(split.order_id!)}
                      >
                        <ArrowUpRight size={14} />
                        Release Payout
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => void handleRemoveSecret()}
        title="Remove Stripe secret key?"
        message="Payments and transfers will fail until a new secret key is saved. This cannot be undone from here — you will need to paste a key from the Stripe dashboard."
        confirmLabel="Remove key"
        destructive
        loading={saving}
      />
    </div>
  );
}
