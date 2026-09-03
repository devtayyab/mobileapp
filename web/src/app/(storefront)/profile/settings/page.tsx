import { requireRole } from '@/lib/auth';
import { SettingsPanel } from '@/components/profile/SettingsPanel';

export const dynamic = 'force-dynamic';

/** Settings — port of mobile `app/profile/settings.tsx`. */
export default async function ProfileSettingsPage() {
  await requireRole(['customer', 'b2b', 'supplier', 'admin']);

  return <SettingsPanel />;
}
