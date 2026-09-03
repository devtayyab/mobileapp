import { requireRole } from '@/lib/auth';
import { DashboardSidebar } from '@/components/shell/DashboardSidebar';

/** Back-office shell for supplier + admin. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['supplier', 'admin']);

  return (
    <div className="flex min-h-screen bg-surface-page">
      <DashboardSidebar
        role={profile.role}
        displayName={profile.full_name}
        email={profile.email}
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
