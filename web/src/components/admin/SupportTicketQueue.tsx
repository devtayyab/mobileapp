'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Mail,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import { Badge, Button, EmptyState, Modal, SearchInput, Tabs } from '@/components/ui';
import type { Role } from '@/types/database';

/** `support_tickets.status` is TEXT with a CHECK constraint on these four. */
export type SupportTicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  'pending',
  'in_progress',
  'resolved',
  'closed',
];

export type SupportTicketQueueItem = {
  id: string;
  /** Nullable: `user_id` is `ON DELETE CASCADE` but the column itself is nullable. */
  user_id: string | null;
  email: string;
  description: string;
  status: SupportTicketStatus;
  created_at: string;
  /** Resolved from `profiles` in a second query (see the page's comment). */
  submitter: { full_name: string | null; role: Role } | null;
};

const STATUS_META: Record<
  SupportTicketStatus,
  { label: string; tone: 'warning' | 'info' | 'success' | 'neutral'; icon: React.ElementType }
> = {
  pending: { label: 'Pending', tone: 'warning', icon: AlertCircle },
  in_progress: { label: 'In Progress', tone: 'info', icon: Clock },
  resolved: { label: 'Resolved', tone: 'success', icon: CheckCircle2 },
  closed: { label: 'Closed', tone: 'neutral', icon: XCircle },
};

const ROLE_META: Record<Role, { label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }> =
  {
    admin: { label: 'Admin', tone: 'primary' },
    supplier: { label: 'Supplier', tone: 'info' },
    b2b: { label: 'Wholesale', tone: 'warning' },
    customer: { label: 'Customer', tone: 'neutral' },
  };

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export function SupportTicketQueue({
  initialTickets,
  adminId,
}: {
  initialTickets: SupportTicketQueueItem[];
  adminId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SupportTicketStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatBusyFor, setChatBusyFor] = useState<string | null>(null);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (!q) return true;

      return (
        t.email.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.submitter?.full_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [tickets, search, filter]);

  const tabs = [
    { key: 'all', label: 'All', count: tickets.length },
    ...SUPPORT_TICKET_STATUSES.map((status) => ({
      key: status,
      label: STATUS_META[status].label,
      count: tickets.filter((t) => t.status === status).length,
    })),
  ];

  /** Ported from mobile `updateStatus()`. The CHECK constraint allows only the four. */
  const updateStatus = async (ticketId: string, next: SupportTicketStatus) => {
    setBusy(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('support_tickets')
      // Mobile sets `updated_at` explicitly even though a BEFORE UPDATE trigger
      // also maintains it (20260609120000); kept identical here.
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    setBusy(false);

    if (error) {
      toast({ title: 'Update failed', message: error.message, kind: 'error' });
      return;
    }

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: next } : t)));
    toast({
      title: 'Ticket updated',
      message: `Marked ${STATUS_META[next].label.toLowerCase()}.`,
      kind: 'success',
    });
    router.refresh();
  };

  /**
   * Find-or-create a chat with the ticket reporter, then go to /chat/<roomId>.
   *
   * Mobile `startChat()` first looks for the reporter's own `room_type =
   * 'support'` room (users create those from the Help Center) and otherwise
   * creates a fresh `p2p` room. Mobile's fallback creates a NEW p2p room on
   * every click; the middle step below reuses the existing admin↔reporter p2p
   * room instead, exactly as `ProductSupplierCard.startChatWithSupplier()` does.
   */
  const startChat = async (targetUserId: string | null, ticketId: string) => {
    if (!targetUserId) {
      toast({
        title: 'Unable to start chat',
        message: 'This ticket has no linked account — reply by email instead.',
        kind: 'error',
      });
      return;
    }

    if (targetUserId === adminId) {
      toast({
        title: 'Chat info',
        message: 'You cannot start a chat with yourself.',
        kind: 'info',
      });
      return;
    }

    setChatBusyFor(ticketId);

    /*
      The hand-written Database type declares `Relationships: []` for the chat
      tables, so PostgREST embedded filters (`chat_participants.user_id`) are
      not expressible in its column unions. Drop to the untyped client for
      these calls only — same reason and same shape as ProductSupplierCard.
    */
    const supabase = createClient() as unknown as SupabaseClient;

    try {
      // 1. The reporter's own support room, if they opened one.
      const { data: supportRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'support')
        .eq('created_by', targetUserId)
        .maybeSingle();

      if (supportRoom) {
        router.push(`/chat/${supportRoom.id as string}`);
        return;
      }

      // 2. An existing p2p room the admin already shares with the reporter.
      const { data: rooms, error: findError } = await supabase
        .from('chat_rooms')
        .select('id, chat_participants!inner(user_id)')
        .eq('room_type', 'p2p')
        .eq('chat_participants.user_id', adminId);

      if (findError) throw findError;

      for (const room of (rooms ?? []) as { id: string }[]) {
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', room.id);

        if (
          (participants ?? []).some(
            (p: { user_id: string | null }) => p.user_id === targetUserId
          )
        ) {
          router.push(`/chat/${room.id}`);
          return;
        }
      }

      // 3. Create it. room_type is CHECK-constrained to 'p2p' | 'support'.
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'p2p', created_by: adminId })
        .select('id')
        .single();

      if (createError) throw createError;

      const { error: partError } = await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: adminId },
        { room_id: newRoom.id, user_id: targetUserId },
      ]);

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id as string}`);
    } catch (err) {
      console.error('Error initiating support chat:', err);
      toast({
        title: 'Unable to start chat',
        message: 'Please try again.',
        kind: 'error',
      });
    } finally {
      setChatBusyFor(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or request…"
          className="w-full sm:w-80"
        />
        <Tabs
          tabs={tabs}
          active={filter}
          onChange={(key) => setFilter(key as SupportTicketStatus | 'all')}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy size={26} />}
          title={tickets.length === 0 ? 'No support tickets' : 'No matching tickets'}
          message={
            tickets.length === 0
              ? 'When users submit requests from the Help Center, they will appear here.'
              : 'Try a different search term or status filter.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((ticket) => {
            const meta = STATUS_META[ticket.status];
            const role = ticket.submitter?.role;

            return (
              <div key={ticket.id} className="rounded-2xl border border-edge bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold text-content-primary">
                      {ticket.submitter?.full_name ?? 'Anonymous'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-base text-content-tertiary">
                      <Mail size={12} className="shrink-0" />
                      {ticket.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {role && <Badge tone={ROLE_META[role].tone}>{ROLE_META[role].label}</Badge>}
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-md leading-5 text-content-secondary">
                  {ticket.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-edge-light pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-content-tertiary">
                    <Clock size={12} />
                    {formatDateTime(ticket.created_at)}
                  </span>

                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(ticket.id)}>
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={chatBusyFor === ticket.id}
                      disabled={ticket.user_id == null}
                      onClick={() => void startChat(ticket.user_id, ticket.id)}
                    >
                      <MessageSquare size={14} />
                      Chat
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={selected != null} onClose={() => setSelectedId(null)} title="Ticket Details">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-extrabold text-content-primary">
                {selected.submitter?.full_name ?? 'Anonymous'}
              </p>
              <Badge tone={STATUS_META[selected.status].tone}>
                {STATUS_META[selected.status].label}
              </Badge>
            </div>

            <dl className="rounded-xl border border-edge bg-surface-page px-3.5 py-1">
              <DetailRow
                label="Submitter role"
                value={
                  selected.submitter
                    ? ROLE_META[selected.submitter.role].label
                    : 'Unknown (no linked account)'
                }
              />
              <DetailRow label="Email" value={selected.email} />
              <DetailRow label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
            </dl>

            <div className="rounded-xl bg-surface-page p-3.5">
              <p className="text-sm font-bold uppercase tracking-[0.5px] text-content-tertiary">
                Request description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-md leading-5 text-content-primary">
                {selected.description}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
                Update status
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORT_TICKET_STATUSES.map((status) => {
                  const meta = STATUS_META[status];
                  const Icon = meta.icon;
                  const isActive = selected.status === status;

                  return (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      disabled={busy || isActive}
                      aria-current={isActive}
                      onClick={() => void updateStatus(selected.id, status)}
                      className={isActive ? 'border-secondary text-secondary' : undefined}
                    >
                      <Icon size={15} />
                      {meta.label}
                      {isActive && <span className="sr-only">(current)</span>}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                fullWidth
                loading={chatBusyFor === selected.id}
                disabled={selected.user_id == null}
                onClick={() => void startChat(selected.user_id, selected.id)}
              >
                <MessageSquare size={17} />
                {selected.user_id == null ? 'No linked account to message' : 'Message user'}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge-light py-2.5 last:border-0">
      <dt className="shrink-0 text-md text-content-tertiary">{label}</dt>
      <dd className="min-w-0 break-words text-right text-md font-bold text-content-primary">
        {value}
      </dd>
    </div>
  );
}
