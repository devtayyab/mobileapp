'use client';

/**
 * Supplier business settings — port of mobile `app/supplier/business-settings.tsx`.
 *
 * Stripe Connect onboarding is a two-call sequence against the existing edge
 * functions, exactly as mobile does it:
 *   1. `create-stripe-connect-account` (no body) -> `{ stripeAccountId }`.
 *      It creates the Express account if `suppliers.stripe_account_id` is null
 *      and persists it, or returns the existing id.
 *   2. `create-stripe-account-link` with `{ refresh_url, return_url }`
 *      -> `{ url }`, an `account_onboarding` link we then navigate to.
 * Both return `{ error }` with a non-2xx status on failure, which supabase-js
 * surfaces as a FunctionsHttpError whose `.context` is the raw Response —
 * mobile digs the real message out of it, so we do the same.
 *
 * Mobile passes `exp://localhost:8081` for both URLs; on web the natural values
 * are this page's own URL, so Stripe returns the supplier straight back here.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CreditCard, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea } from '@/components/ui';
import { SupplierToggle } from '@/components/supplier/SupplierToggle';
import { useToast } from '@/providers/ToastProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export type BusinessSettingsValues = {
  id: string;
  business_name: string;
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  website: string | null;
  is_active: boolean | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
};

/** Pulls the edge function's `{ error }` body out of a FunctionsHttpError. */
async function readFunctionError(err: unknown, fallback: string) {
  const withContext = err as { message?: string; context?: { json?: () => Promise<unknown> } };
  if (withContext?.context?.json) {
    try {
      const body = (await withContext.context.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      /* non-JSON body — fall through to the generic message */
    }
  }
  return withContext?.message ?? fallback;
}

export function BusinessSettingsForm({ supplier }: { supplier: BusinessSettingsValues }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [businessName, setBusinessName] = useState(supplier.business_name ?? '');
  const [businessDescription, setBusinessDescription] = useState(
    supplier.business_description ?? ''
  );
  const [businessEmail, setBusinessEmail] = useState(supplier.business_email ?? '');
  const [businessPhone, setBusinessPhone] = useState(supplier.business_phone ?? '');
  const [businessAddress, setBusinessAddress] = useState(supplier.business_address ?? '');
  const [website, setWebsite] = useState(supplier.website ?? '');
  const [isActive, setIsActive] = useState(supplier.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [stripeAccountId, setStripeAccountId] = useState(supplier.stripe_account_id);
  const stripeComplete = supplier.stripe_onboarding_complete ?? false;
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const save = async () => {
    if (!businessName.trim()) {
      setNameError('Business name is required.');
      return;
    }

    setNameError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('suppliers')
        .update({
          business_name: businessName.trim(),
          business_description: businessDescription.trim() || null,
          business_email: businessEmail.trim() || null,
          business_phone: businessPhone.trim() || null,
          business_address: businessAddress.trim() || null,
          website: website.trim() || null,
          is_active: isActive,
        })
        .eq('id', supplier.id);

      if (error) throw new Error(error.message);

      toast({ title: 'Saved', message: 'Business settings updated successfully.', kind: 'success' });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Error',
        message: e instanceof Error ? e.message : 'Failed to save. Please try again.',
        kind: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const setUpStripe = async () => {
    setStripeLoading(true);
    setStripeError('');

    try {
      const supabase = createClient();

      const { data: connectData, error: connectError } = await supabase.functions.invoke<{
        stripeAccountId?: string;
      }>('create-stripe-connect-account');

      if (connectError) {
        throw new Error(
          `Stripe Error: ${await readFunctionError(connectError, 'Failed to create Stripe account')}`
        );
      }

      if (connectData?.stripeAccountId) {
        setStripeAccountId(connectData.stripeAccountId);
      }

      const here = `${window.location.origin}/supplier/business-settings`;
      const { data: linkData, error: linkError } = await supabase.functions.invoke<{
        url?: string;
      }>('create-stripe-account-link', {
        body: {
          refresh_url: `${here}?stripe=refresh`,
          return_url: `${here}?stripe=return`,
        },
      });

      if (linkError) {
        throw new Error(await readFunctionError(linkError, 'Failed to create Stripe link'));
      }

      if (!linkData?.url) throw new Error('Stripe did not return an onboarding link.');

      window.location.href = linkData.url;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Stripe setup failed.';
      setStripeError(message);
      toast({ title: 'Stripe Setup Error', message, kind: 'error' });
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Business Info">
        <Input
          label="Business Name *"
          placeholder="Your business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          error={nameError ?? undefined}
        />
        <Textarea
          label="Business Description"
          placeholder="Describe your business…"
          rows={4}
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
        />
      </Section>

      <Section title="Contact">
        <Input
          label="Business Email"
          type="email"
          placeholder="business@email.com"
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
        />
        <Input
          label="Business Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
        />
        <Input
          label="Website"
          placeholder="https://yourwebsite.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          spellCheck={false}
        />
      </Section>

      <Section title="Address">
        <Textarea
          label="Business Address"
          placeholder="Street, City, State, ZIP, Country"
          rows={3}
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
        />
      </Section>

      <Section title="Payout Settings">
        <div className="flex items-start gap-3">
          <CreditCard
            size={24}
            className={stripeComplete ? 'mt-0.5 text-success' : 'mt-0.5 text-content-tertiary'}
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-content-primary">Stripe Connected Account</p>
            <p className="mt-0.5 text-sm text-content-tertiary">
              {stripeComplete
                ? 'Your account is verified and ready to receive payouts.'
                : 'Set up your bank details to receive payouts securely.'}
            </p>
            {stripeAccountId && !stripeComplete && (
              <p className="mt-1 text-sm text-content-tertiary">
                Account <span className="font-bold">{stripeAccountId}</span> — onboarding not
                finished.
              </p>
            )}
          </div>
        </div>

        {stripeComplete ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5 text-base font-bold text-success">
            <CheckCircle2 size={16} />
            Verified
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            <Button className="w-fit" loading={stripeLoading} onClick={setUpStripe}>
              {stripeAccountId ? 'Continue Payout Setup' : 'Set up Payouts'}
            </Button>
            {stripeError && <p className="text-base font-bold text-error">{stripeError}</p>}
          </div>
        )}
      </Section>

      <Section title="Store Status">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-content-primary">Store Active</p>
            <p className="mt-0.5 text-sm text-content-tertiary">
              Allow customers to see your products
            </p>
          </div>
          <SupplierToggle checked={isActive} onChange={setIsActive} label="Store Active" />
        </div>
      </Section>

      <Button fullWidth size="lg" loading={saving} onClick={save}>
        <Save size={20} />
        {t.save ?? 'Save'} Settings
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="mb-3.5 text-md font-bold uppercase tracking-[0.6px] text-content-tertiary">
        {title}
      </h2>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
