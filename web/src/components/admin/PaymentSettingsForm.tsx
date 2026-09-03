'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Save, ShieldAlert, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import { Button, ConfirmDialog, Input } from '@/components/ui';

/**
 * `payment_settings` is an INT singleton pinned to `id = 1` (NOT a uuid) —
 * see 20260709191500_add_payment_settings.sql and CONTRIBUTING.md.
 */
const SETTINGS_ID = 1;

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
  updatedAt: string | null;
  /** Set when the singleton row could not be read (RLS or missing row). */
  loadError?: string | null;
};

export function PaymentSettingsForm({ settings }: { settings: PaymentSettingsView }) {
  const router = useRouter();
  const { toast } = useToast();

  const [publishableKey, setPublishableKey] = useState(settings.publishableKey ?? '');
  const [replacingSecret, setReplacingSecret] = useState(false);
  const [secretDraft, setSecretDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [errors, setErrors] = useState<{ secret?: string; publishable?: string }>({});

  const publishableDirty = publishableKey.trim() !== (settings.publishableKey ?? '').trim();
  const secretDirty = replacingSecret && secretDraft.trim().length > 0;

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
