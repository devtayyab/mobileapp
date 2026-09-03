/**
 * Support-ticket status vocabulary, in its own dependency-free module.
 *
 * This deliberately does NOT live in SupportTicketQueue.tsx: that file is
 * `'use client'`, and a non-component export imported from a client module into
 * a Server Component arrives as a client *reference* rather than the real
 * value — so `SUPPORT_TICKET_STATUSES.includes(...)` threw at request time on
 * /admin/support. Plain modules can be imported safely from either side.
 *
 * Mirrors the CHECK constraint on `support_tickets.status`
 * (supabase/migrations/20260609120000_add_support_tickets.sql).
 */
export const SUPPORT_TICKET_STATUSES = [
  'pending',
  'in_progress',
  'resolved',
  'closed',
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const isSupportTicketStatus = (
  value: string | null | undefined
): value is SupportTicketStatus =>
  value != null && (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
