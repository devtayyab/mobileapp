import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getAdminProfile } from '@/lib/supabase/server';
import type { Profile, Role } from '@/types/database';
import { homeForRole } from '@/lib/roles';

export { WEB_ROLES, homeForRole } from '@/lib/roles';

export async function requireRole(allowed: Role[]): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getAdminProfile();

  if (!user || !profile) {
    redirect('/login');
  }

  if (!allowed.includes(profile.role)) {
    redirect(homeForRole(profile.role));
  }

  return { user, profile };
}
