/**
 * Supplier dashboard — port of mobile `app/supplier/dashboard.tsx`.
 *
 * The mobile screen's slide-out drawer is deliberately not ported: navigation
 * lives in `DashboardSidebar`. Two mobile calculations are also corrected here
 * rather than reproduced:
 *   - `totalOrders` used `new Set(items.map(item => item))` — a set of distinct
 *     object references, i.e. the order_items row count, not the order count.
 *   - each recent-order row showed `totalRevenue / totalOrders` (its own comment
 *     called it a "simplified approximation"), a number that is not in the data.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Avatar } from '@/components/ui';
import { KycStatusBanner } from '@/components/supplier/KycStatusBanner';
import { ManageBusinessGrid } from '@/components/supplier/ManageBusinessGrid';
import { NoSupplierProfile } from '@/components/supplier/NoSupplierProfile';
import { RecentOrdersList } from '@/components/supplier/RecentOrdersList';
import { SupplierStatTiles } from '@/components/supplier/SupplierStatTiles';
import { extraMoneyHint, primaryMoney } from '@/components/supplier/money';
import {
  SUPPLIER_ORDER_ITEM_SELECT,
  groupByOrder,
  revenueBag,
  type SupplierOrderItem,
} from '@/components/supplier/order-metrics';

export const dynamic = 'force-dynamic';

/** Safety cap on the item scan behind the totals; suppliers past this are rare. */
const ITEM_SCAN_LIMIT = 2000;

export default async function SupplierDashboardPage() {
  const { user, profile } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, business_name, kyc_status, kyc_rejected_reason')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) return <NoSupplierProfile title="Dashboard" />;

  const [productsRes, itemsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id),
    supabase
      .from('order_items')
      .select(SUPPLIER_ORDER_ITEM_SELECT)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(ITEM_SCAN_LIMIT),
  ]);

  const items = (itemsRes.data ?? []) as unknown as SupplierOrderItem[];
  const orders = groupByOrder(items);
  const revenue = revenueBag(items);
  const primaryRevenue = primaryMoney(revenue);
  const revenueHint = extraMoneyHint(revenue);

  const totalProducts = productsRes.count ?? 0;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const firstName = profile.full_name?.split(' ')[0] ?? 'Supplier';

  return (
    <div className="space-y-8">
      <KycStatusBanner
        status={supplier.kyc_status}
        rejectionReason={supplier.kyc_rejected_reason}
      />

      {/* Welcome card — mobile `welcomeSection` */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-edge bg-surface p-6">
        <div className="min-w-0">
          <h1 className="truncate text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
            Hello, {firstName}!
          </h1>
          <p className="mt-1 truncate text-md text-content-tertiary">
            {supplier.business_name} · Here&rsquo;s what&rsquo;s happening today
          </p>
        </div>
        <Avatar name={profile.full_name ?? profile.email} size={48} />
      </div>

      <SupplierStatTiles
        tiles={[
          {
            label: 'Revenue',
            value: primaryRevenue.amount,
            icon: 'revenue',
            currency: primaryRevenue.currency,
            hint: revenueHint ?? 'Your share, cancelled orders excluded',
          },
          {
            label: 'Orders',
            value: orders.length,
            icon: 'orders',
            hint: 'Orders containing your products',
          },
          {
            label: 'Pending',
            value: pendingOrders,
            icon: 'pending',
            hint: 'Awaiting processing',
          },
          {
            label: 'Products',
            value: totalProducts,
            icon: 'products',
            hint: 'In your catalog',
          },
        ]}
      />

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-content-primary">Manage Business</h2>
        <ManageBusinessGrid />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl font-bold text-content-primary">Recent Orders</h2>
          <Link href="/supplier/orders" className="text-md font-bold text-primary hover:underline">
            See all
          </Link>
        </div>
        <RecentOrdersList orders={orders.slice(0, 5)} />
      </section>
    </div>
  );
}
