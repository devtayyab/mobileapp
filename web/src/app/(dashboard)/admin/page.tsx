import Link from 'next/link';
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  FolderTree,
  Globe2,
  LifeBuoy,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  AdminStatsGrid,
  type PlatformStats,
  type RevenueByCurrency,
} from '@/components/admin/AdminStatsGrid';

/** Shape returned by the `admin_platform_stats()` RPC. */
type AdminPlatformStats = {
  total_users: number;
  total_suppliers: number;
  pending_kyc: number;
  under_review_kyc: number;
  approved_kyc: number;
  total_products: number;
  active_products: number;
  total_orders: number;
  revenue_by_currency: {
    currency: string;
    revenue: number | string;
    commission: number | string;
    orders: number | string;
  }[];
};

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/index.tsx`.
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so every admin
 * route re-gates on ['admin'] itself.
 */
export default async function AdminOverviewPage() {
  const { profile } = await requireRole(['admin']);
  const supabase = await createClient();

  const [
    usersRes,
    suppliersRes,
    kycPendingRes,
    kycApprovedRes,
    productsRes,
    activeProductsRes,
    ordersRes,
    pendingOrdersRes,
    statsRpc,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    /*
      Revenue is aggregated in SQL (migration 20260903001000) for two reasons:
      summing fetched rows in JS gets silently truncated by PostgREST's
      max-rows default, and `orders.currency` varies per row so a single
      blended total is meaningless. The RPC returns one entry per currency.
    */
    supabase.rpc('admin_platform_stats'),
  ]);

  const rpc = statsRpc.error ? null : (statsRpc.data as AdminPlatformStats | null);

  const revenueByCurrency: RevenueByCurrency[] = (rpc?.revenue_by_currency ?? []).map((r) => ({
    currency: r.currency,
    revenue: Number(r.revenue ?? 0),
    commission: Number(r.commission ?? 0),
    orders: Number(r.orders ?? 0),
  }));

  const stats: PlatformStats = {
    totalUsers: rpc?.total_users ?? usersRes.count ?? 0,
    totalSuppliers: rpc?.total_suppliers ?? suppliersRes.count ?? 0,
    pendingKyc: rpc?.pending_kyc ?? kycPendingRes.count ?? 0,
    approvedSuppliers: rpc?.approved_kyc ?? kycApprovedRes.count ?? 0,
    totalProducts: rpc?.total_products ?? productsRes.count ?? 0,
    activeProducts: rpc?.active_products ?? activeProductsRes.count ?? 0,
    totalOrders: rpc?.total_orders ?? ordersRes.count ?? 0,
    pendingOrders: pendingOrdersRes.count ?? 0,
    revenueByCurrency,
    // Set when the RPC hasn't been applied to the database yet.
    revenueUnavailable: rpc == null,
  };

  const navItems: {
    href: string;
    label: string;
    subtitle: string;
    icon: React.ElementType;
    badge?: number;
    badgeTone?: 'error' | 'warning';
  }[] = [
    {
      href: '/admin/suppliers',
      label: 'Supplier Management',
      subtitle: 'KYC reviews & approvals',
      icon: Store,
      badge: stats.pendingKyc > 0 ? stats.pendingKyc : undefined,
      badgeTone: 'error',
    },
    {
      href: '/admin/products',
      label: 'Product Catalog',
      subtitle: 'Feature, activate & manage listings',
      icon: Package,
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      subtitle: 'Manage product categories',
      icon: FolderTree,
    },
    {
      href: '/admin/orders',
      label: 'Order Monitoring',
      subtitle: 'Track & update order statuses',
      icon: ShoppingBag,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      badgeTone: 'warning',
    },
    {
      href: '/admin/reports',
      label: 'Revenue Reports',
      subtitle: 'Platform earnings & commission',
      icon: BarChart3,
    },
    {
      href: '/admin/users',
      label: 'User Management',
      subtitle: 'All users, roles & analytics',
      icon: Users,
    },
    {
      href: '/admin/support',
      label: 'Support Tickets',
      subtitle: 'Manage user help requests',
      icon: LifeBuoy,
    },
    {
      href: '/chat',
      label: 'Live Chats',
      subtitle: 'Direct messages with users',
      icon: MessageSquare,
    },
    {
      href: '/admin/countries',
      label: 'Global Shipping & VAT',
      subtitle: 'Manage countries and taxes',
      icon: Globe2,
    },
    {
      href: '/admin/couriers',
      label: 'Couriers',
      subtitle: 'Manage tracking and couriers',
      icon: Truck,
    },
    {
      href: '/admin/payment-settings',
      label: 'Payment Settings',
      subtitle: 'Manage Stripe API keys & config',
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-2xs font-extrabold uppercase tracking-[0.5px] text-white">
          <ShieldCheck size={10} />
          Admin
        </span>
        <h1 className="mt-1.5 text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {profile.full_name ?? 'Administrator'}
        </h1>
        <p className="text-base text-content-tertiary">{profile.email}</p>
      </header>

      {stats.pendingKyc > 0 && (
        <Link
          href="/admin/suppliers"
          className="flex items-center gap-3 rounded-xl border border-warning bg-surface-tint p-3.5 transition-colors hover:bg-surface-page"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-warning">
            <AlertCircle size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-md font-bold text-warning">
              {stats.pendingKyc} Pending KYC Review{stats.pendingKyc > 1 ? 's' : ''}
            </span>
            <span className="mt-0.5 block text-sm text-content-tertiary">
              Review supplier applications
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-warning" />
        </Link>
      )}

      <section>
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
          Platform Overview
        </h2>
        <AdminStatsGrid stats={stats} />
      </section>

      <section>
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
          Management
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3.5 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:bg-surface-page"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-primary">
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-content-primary">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-content-tertiary">{item.subtitle}</span>
                </span>
                {item.badge != null && (
                  <span
                    className={`shrink-0 rounded-3xl px-2 py-0.5 text-xs font-extrabold text-white ${
                      item.badgeTone === 'warning' ? 'bg-warning' : 'bg-error'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={18} className="shrink-0 text-content-tertiary" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
