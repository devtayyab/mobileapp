import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/supabase/server';
import { homeForRole } from '@/lib/auth';

export default async function Home() {
  const { user, profile } = await getAdminProfile();

  if (!user) {
    redirect('/login');
  }

  redirect(homeForRole(profile?.role));
}
