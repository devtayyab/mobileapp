import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  AdminSuppliersList,
  type AdminSupplier,
  type SupplierKycDoc,
} from '@/components/admin/AdminSuppliersList';

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/suppliers.tsx`. Admin-only, re-gated per route.
 *
 * Mobile fetches the contact profile and KYC documents as PostgREST embeds
 * (`profiles!suppliers_user_id_fkey (...)`, `kyc_documents (...)`). The web
 * `Database` type declares `Relationships: []` for every table, so embeds are
 * not expressible on the typed client — three plain typed queries are stitched
 * together here instead of casting the client to `SupabaseClient`.
 */
export default async function AdminSuppliersPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: supplierRows } = await supabase
    .from('suppliers')
    // Must stay a single string literal — concatenation widens to `string` and
    // PostgREST loses the per-column row typing.
    .select(
      `id, user_id, business_name, business_registration_number, business_type,
       business_description, business_email, business_phone, business_address, website,
       kyc_status, commission_rate, created_at, rejection_reason, reviewed_at`
    )
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = supplierRows ?? [];
  const userIds = Array.from(new Set(rows.map((s) => s.user_id).filter(Boolean)));
  const supplierIds = rows.map((s) => s.id);

  const [contactsRes, docsRes] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, email, phone').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string; phone: string | null }[] }),
    supplierIds.length
      ? supabase
          .from('kyc_documents')
          .select('id, supplier_id, document_type, document_url, status')
          .in('supplier_id', supplierIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            supplier_id: string | null;
            document_type: string;
            document_url: string;
            status: SupplierKycDoc['status'];
          }[],
        }),
  ]);

  const contactById = new Map(
    (contactsRes.data ?? []).map((p) => [
      p.id,
      { full_name: p.full_name, email: p.email, phone: p.phone },
    ])
  );

  const docsBySupplier = new Map<string, SupplierKycDoc[]>();
  for (const doc of docsRes.data ?? []) {
    if (!doc.supplier_id) continue;
    const list = docsBySupplier.get(doc.supplier_id) ?? [];
    list.push({
      id: doc.id,
      document_type: doc.document_type,
      document_url: doc.document_url,
      status: doc.status,
    });
    docsBySupplier.set(doc.supplier_id, list);
  }

  const suppliers: AdminSupplier[] = rows.map((s) => ({
    ...s,
    contact: contactById.get(s.user_id) ?? null,
    kyc_documents: docsBySupplier.get(s.id) ?? [],
  }));

  const pendingCount = suppliers.filter(
    (s) => s.kyc_status === 'pending' || s.kyc_status === 'under_review'
  ).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Supplier Management
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {suppliers.length.toLocaleString()} supplier{suppliers.length === 1 ? '' : 's'} ·{' '}
          {pendingCount.toLocaleString()} awaiting review
        </p>
      </header>

      <AdminSuppliersList initialSuppliers={suppliers} />
    </div>
  );
}
