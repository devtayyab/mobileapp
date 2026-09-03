import { createClient, getAdminProfile } from '@/lib/supabase/server';
import { SupportCenter } from '@/components/profile/SupportCenter';
import type { SupportTicket } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * Help Center — port of mobile `app/help.tsx`.
 *
 * The page itself is written to work for guests (guidance copy is public, the
 * ticket form asks them to sign in), but `/help` is NOT in the middleware's
 * PUBLIC_PREFIXES list, so a signed-out visitor is currently redirected to
 * /login before getting here. Adding '/help' to that list makes the FAQ public.
 */
export default async function HelpPage() {
  const { user, profile } = await getAdminProfile();

  let tickets: SupportTicket[] = [];

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    tickets = data ?? [];
  }

  return (
    <SupportCenter
      userId={user?.id ?? null}
      email={profile?.email ?? user?.email ?? null}
      tickets={tickets}
    />
  );
}
