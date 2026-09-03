import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  AdminUsersTable,
  type AdminUserRow,
  type RoleCounts,
} from '@/components/admin/AdminUsersTable';

export const dynamic = 'force-dynamic';

/** Ported from mobile `app/admin/users.tsx`. Admin-only, re-gated per route. */
export default async function AdminUsersPage() {
  const { user } = await requireRole(['admin']);
  const supabase = await createClient();

  const [profilesRes, allRes, customerRes, b2bRes, supplierRes, adminRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, company_name, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    // Mobile derives tab counts from a full `select('role')`; exact head counts
    // stay correct even though the visible list is capped at 500 rows.
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'b2b'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'supplier'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
  ]);

  const counts: RoleCounts = {
    all: allRes.count ?? 0,
    customer: customerRes.count ?? 0,
    b2b: b2bRes.count ?? 0,
    supplier: supplierRes.count ?? 0,
    admin: adminRes.count ?? 0,
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          User Management
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {counts.all.toLocaleString()} account{counts.all === 1 ? '' : 's'} · showing the 500 most
          recent
        </p>
      </header>

      <AdminUsersTable
        initialUsers={(profilesRes.data ?? []) as AdminUserRow[]}
        counts={counts}
        viewerId={user.id}
      />
    </div>
  );
}
