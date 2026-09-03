import { StorefrontHeader } from '@/components/shell/StorefrontHeader';
import { getAdminProfile } from '@/lib/supabase/server';

/** Public shell — guests can browse, matching mobile's "Browse as Guest". */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAdminProfile();

  return (
    <div className="min-h-screen bg-surface-page">
      <StorefrontHeader
        role={profile?.role ?? null}
        displayName={profile?.full_name ?? profile?.email ?? null}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
