import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAdminProfile();

  if (!user) {
    redirect('/login');
  }

  if (profile?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Admin Web</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
