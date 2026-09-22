import { StorefrontHeader } from '@/components/shell/StorefrontHeader';
import { StorefrontFooter } from '@/components/shell/StorefrontFooter';
import { getAdminProfile } from '@/lib/supabase/server';

/** Public shell — guests can browse, matching mobile's "Browse as Guest". */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAdminProfile();

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <StorefrontHeader
        role={profile?.role ?? null}
        displayName={profile?.full_name ?? profile?.email ?? null}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
