import Link from 'next/link';
import { requireRole, WEB_ROLES } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import CartLink from '@/components/CartLink';

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  admin: [{ href: '/products', label: 'Products' }],
  supplier: [
    { href: '/supplier/products', label: 'My Products' },
    { href: '/supplier/orders', label: 'My Orders' },
  ],
  b2b: [
    { href: '/shop', label: 'Shop' },
    { href: '/orders', label: 'My Orders' },
  ],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(WEB_ROLES);
  const nav = NAV_BY_ROLE[profile.role] ?? [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-slate-900">Admin Web</span>
            <nav className="flex items-center gap-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {profile.role === 'b2b' && <CartLink />}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
