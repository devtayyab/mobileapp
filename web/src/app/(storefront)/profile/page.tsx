import { requireRole } from '@/lib/auth';
import { ProfileMenu } from '@/components/profile/ProfileMenu';

export const dynamic = 'force-dynamic';

/** Account overview — port of mobile `app/(tabs)/profile.tsx`. */
export default async function ProfilePage() {
  const { profile } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);

  return <ProfileMenu profile={profile} />;
}
