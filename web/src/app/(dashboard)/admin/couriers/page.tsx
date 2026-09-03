import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CourierEditor, type AdminCourierRow } from '@/components/admin/CourierEditor';

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/couriers.tsx`.
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 *
 * `couriers` has both an `is_active = true` read policy and an admin `FOR ALL`
 * policy (migration 20260615145100), so inactive couriers are visible here.
 */
export default async function AdminCouriersPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('couriers')
    .select('id, name, code, tracking_url_format, is_active')
    .order('name', { ascending: true });

  const couriers = (data ?? []) as AdminCourierRow[];
  const active = couriers.filter((c) => c.is_active !== false).length;
  const withoutTracking = couriers.filter((c) => !c.tracking_url_format).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Couriers
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {couriers.length.toLocaleString()} courier{couriers.length === 1 ? '' : 's'} ·{' '}
          {active.toLocaleString()} active
          {withoutTracking > 0 ? ` · ${withoutTracking} without a tracking URL` : ''}
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-error bg-surface-tint p-3.5 text-md font-bold text-error">
          Could not load couriers: {error.message}
        </p>
      )}

      <CourierEditor initialCouriers={couriers} />
    </div>
  );
}
