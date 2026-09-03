import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  SupportTicketQueue,
  SUPPORT_TICKET_STATUSES,
  type SupportTicketQueueItem,
  type SupportTicketStatus,
} from '@/components/admin/SupportTicketQueue';
import type { Role } from '@/types/database';

export const dynamic = 'force-dynamic';

const isTicketStatus = (value: string | null): value is SupportTicketStatus =>
  value != null && (SUPPORT_TICKET_STATUSES as string[]).includes(value);

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

  const { data: ticketRows } = await supabase
    .from('support_tickets')
    .select('id, user_id, email, description, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const tickets = ticketRows ?? [];

  const submitterIds = [
    ...new Set(tickets.map((t) => t.user_id).filter((id): id is string => id != null)),
  ];

  const { data: profileRows } = submitterIds.length
    ? await supabase.from('profiles').select('id, full_name, role').in('id', submitterIds)
    : { data: [] };

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
    status: isTicketStatus(t.status) ? t.status : 'pending',
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

      <SupportTicketQueue initialTickets={queue} adminId={user.id} />
    </div>
  );
}
