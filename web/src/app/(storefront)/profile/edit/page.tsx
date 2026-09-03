import { requireRole } from '@/lib/auth';
import { EditProfileForm } from '@/components/profile/EditProfileForm';

export const dynamic = 'force-dynamic';

/** Edit profile — port of mobile `app/profile/edit.tsx`. */
export default async function EditProfilePage() {
  const { profile } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);

  return <EditProfileForm profile={profile} />;
}
