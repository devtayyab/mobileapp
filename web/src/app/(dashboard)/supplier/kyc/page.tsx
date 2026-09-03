import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { getOrCreateSupplierId } from '@/lib/supabase/supplier';
import { EmptyState } from '@/components/ui';
import { KycDocumentList, type KycDocumentRow } from '@/components/supplier/KycDocumentList';

export const dynamic = 'force-dynamic';

/**
 * Port of mobile `app/supplier/kyc.tsx`.
 *
 * Mobile creates the `suppliers` row on the spot if the user does not have one
 * yet (KYC is the first stop in supplier onboarding), so the web port routes
 * that through the sanctioned `create_supplier_profile` RPC helper rather than
 * inserting directly.
 */
export default async function SupplierKycPage() {
  const { user, profile } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  let supplierId: string;
  try {
    supplierId = await getOrCreateSupplierId(
      supabase,
      user.id,
      profile.company_name || profile.full_name || profile.email.split('@')[0] || 'My Business'
    );
  } catch {
    return (
      <div className="space-y-5">
        <Header />
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="Supplier profile not found"
          message="We could not create a supplier profile for this account. Add a product first, or contact support."
        />
      </div>
    );
  }

  const [{ data: supplier }, { data: documents }] = await Promise.all([
    supabase
      .from('suppliers')
      .select('id, kyc_status, rejection_reason, business_name, business_registration_number')
      .eq('id', supplierId)
      .maybeSingle(),
    supabase
      .from('kyc_documents')
      .select('id, document_type, document_url, status, rejection_reason, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false }),
  ]);

  if (!supplier) {
    return (
      <div className="space-y-5">
        <Header />
        <EmptyState icon={<AlertCircle size={26} />} title="Supplier profile not found" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header businessName={supplier.business_name} />
      <KycDocumentList
        supplierId={supplier.id}
        kycStatus={supplier.kyc_status ?? 'pending'}
        rejectionReason={supplier.rejection_reason}
        documents={(documents ?? []) as KycDocumentRow[]}
      />
    </div>
  );
}

function Header({ businessName }: { businessName?: string }) {
  return (
    <div>
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
        KYC Verification
      </h1>
      <p className="mt-0.5 text-md text-content-tertiary">
        {businessName ?? 'Verify your business to start selling'}
      </p>
    </div>
  );
}
