import { Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import {
  BusinessSettingsForm,
  type BusinessSettingsValues,
} from '@/components/supplier/BusinessSettingsForm';

export const dynamic = 'force-dynamic';

/**
 * Port of mobile `app/supplier/business-settings.tsx`.
 *
 * Mobile does NOT create a supplier row here (unlike the KYC screen) — it shows
 * a "no supplier profile" state and tells the user to add a product first, so
 * the web port keeps that behaviour.
 */
export default async function SupplierBusinessSettingsPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select(
      `id, business_name, business_description, business_email, business_phone,
       business_address, website, is_active, kyc_status, commission_rate,
       stripe_account_id, stripe_onboarding_complete`
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          Business Settings
        </h1>
        <p className="mt-0.5 text-md text-content-tertiary">
          Your storefront details, contact information and payout account
        </p>
      </div>

      {supplier ? (
        <BusinessSettingsForm supplier={supplier as BusinessSettingsValues} />
      ) : (
        <EmptyState
          icon={<Store size={26} />}
          title="No supplier profile found"
          message="Add a product first to initialize your supplier profile."
        />
      )}
    </div>
  );
}
