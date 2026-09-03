import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  SupportTicketQueue,
  type SupportTicketQueueItem,
} from '@/components/admin/SupportTicketQueue';
// Plain module — importing this value from the 'use client' queue component
// would hand the server a client reference instead of the array.
import { isSupportTicketStatus } from '@/components/admin/support-status';
import type { Role } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/support.tsx`.
 *
 * Mobile reads the submitter with a PostgREST embed
 * (`profiles:user_id (full_name, role)`), but the hand-written Database type
 * declares `Relationships: []` for `support_tickets`, so that embed isn't
 * expressible in its column unions. Two typed queries produce the identical
 * result without dropping to an untyped client. (`profiles` is
 * `SELECT ... TO authenticated USING (true)` since 20260217000000, so an admin
 * can read every submitter.)
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 */
export default async function AdminSupportPage() {
  const { user } = await requireRole(['admin']);
  const supabase = await createClient();

  const { data: ticketRows, error: ticketsError } = await supabase
    .from('support_tickets')
    .select('id, user_id, email, description, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const tickets = ticketRows ?? [];

  const submitterIds = [
    ...new Set(tickets.map((t) => t.user_id).filter((id): id is string => id != null)),
  ];

  const { data: profileRows, error: profilesError } = submitterIds.length
    ? await supabase.from('profiles').select('id, full_name, role').in('id', submitterIds)
    : { data: [], error: null };

  /*
   * A failed read resolves with `data: null`, which used to render as the
   * queue's empty state — indistinguishable from "no tickets have been filed".
   * Surface it instead, as `admin/categories/page.tsx` does.
   */
  const loadError = ticketsError?.message ?? profilesError?.message ?? null;

  const profileById = new Map(
    (profileRows ?? []).map((p) => [p.id, { full_name: p.full_name, role: p.role as Role }])
  );

  const queue: SupportTicketQueueItem[] = tickets.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    email: t.email,
    description: t.description,
    // `status` is TEXT with a DEFAULT and a CHECK, but nullable in the schema —
    // fall back to the column default rather than rendering an unknown state.
    status: isSupportTicketStatus(t.status) ? t.status : 'pending',
    created_at: t.created_at,
    submitter: (t.user_id && profileById.get(t.user_id)) || null,
  }));

  const openCount = queue.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Support Tickets
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {queue.length.toLocaleString()} ticket{queue.length === 1 ? '' : 's'} · {openCount} open
          {queue.length === 500 && ' · showing the 500 most recent'}
        </p>
      </header>

      {loadError && (
        <p className="rounded-xl border border-error bg-surface-tint p-3.5 text-md font-bold text-error">
          Could not load support tickets: {loadError}
        </p>
      )}

      <SupportTicketQueue initialTickets={queue} adminId={user.id} />
    </div>
  );
}
