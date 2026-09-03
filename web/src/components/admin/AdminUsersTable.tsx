'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MessageSquare, Shield, ShoppingBag, User, Users } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Modal,
  SearchInput,
  Tabs,
  type Column,
} from '@/components/ui';
import type { Profile, Role } from '@/types/database';

export type AdminUserRow = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'role' | 'company_name' | 'phone' | 'created_at'
>;

export type RoleCounts = Record<Role | 'all', number>;

const ALL_ROLES: Role[] = ['customer', 'b2b', 'supplier', 'admin'];

const ROLE_META: Record<
  Role,
  { label: string; description: string; icon: React.ElementType; tone: 'success' | 'info' | 'primary' | 'error' }
> = {
  customer: { label: 'Customer', description: 'Regular buyer', icon: User, tone: 'success' },
  b2b: { label: 'B2B', description: 'Business buyer with B2B prices', icon: Building2, tone: 'info' },
  supplier: { label: 'Supplier', description: 'Product supplier', icon: ShoppingBag, tone: 'primary' },
  admin: { label: 'Admin', description: 'Platform administrator', icon: Shield, tone: 'error' },
};

export function AdminUsersTable({
  initialUsers,
  counts,
  viewerId,
}: {
  initialUsers: AdminUserRow[];
  counts: RoleCounts;
  viewerId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [pendingAdminRole, setPendingAdminRole] = useState<AdminUserRow | null>(null);
  const [updating, setUpdating] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;

      return (
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    ...ALL_ROLES.map((role) => ({
      key: role,
      label: ROLE_META[role].label,
      count: counts[role],
    })),
  ];

  /** Mobile confirms before granting admin; everything else applies immediately. */
  const requestRoleChange = (user: AdminUserRow, next: Role) => {
    if (next === user.role) return;
    if (next === 'admin') {
      setPendingAdminRole(user);
      return;
    }
    void applyRoleChange(user, next);
  };

  const applyRoleChange = async (user: AdminUserRow, next: Role) => {
    setUpdating(true);

    const supabase = createClient();
    // `.select('id')` so a write that matched zero rows (row-level security
    // rejects it silently — PostgREST still returns `error: null`) is
    // detectable. Without it the row is patched locally, a success toast fires
    // and `router.refresh()` snaps the role straight back.
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: next, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id');

    setUpdating(false);

    if (error) {
      toast({ title: 'Role change failed', message: error.message, kind: 'error' });
      return;
    }

    if (!updated || updated.length === 0) {
      toast({
        title: 'Role change failed',
        message: 'No row was updated. Please reload and try again, or contact support.',
        kind: 'error',
      });
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: next } : u)));
    setSelected(null);
    setPendingAdminRole(null);
    toast({
      title: 'Role updated',
      message: `${user.full_name ?? user.email} is now ${ROLE_META[next].label}.`,
      kind: 'success',
    });
    // Tab counts come from server-side exact counts, so refresh them.
    router.refresh();
  };

  /**
   * Find-or-create a p2p chat room with the target user, then open it.
   *
   * Same three-step approach as `components/product/ProductSupplierCard.tsx`.
   * Note: mobile `app/admin/users.tsx` skips the lookup and always inserts a new
   * room, which accumulates duplicates — the web port reuses an existing room.
   */
  const startChat = async (targetUserId: string) => {
    if (targetUserId === viewerId) {
      toast({
        title: 'Chat info',
        message: 'You cannot start a chat with yourself.',
        kind: 'info',
      });
      return;
    }

    setStartingChat(true);

    // The generated Database type declares `Relationships: []`, so PostgREST
    // embedded filters (`chat_participants.user_id`) are not expressible in its
    // column unions. Drop to the untyped client for these calls only.
    const supabase = createClient() as unknown as SupabaseClient;

    try {
      const { data: rooms, error: findError } = await supabase
        .from('chat_rooms')
        .select('id, chat_participants!inner(user_id)')
        .eq('room_type', 'p2p')
        .eq('chat_participants.user_id', viewerId);

      if (findError) throw findError;

      let existingRoomId: string | null = null;
      for (const room of (rooms ?? []) as { id: string }[]) {
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', room.id);

        if (
          (participants ?? []).some((p: { user_id: string | null }) => p.user_id === targetUserId)
        ) {
          existingRoomId = room.id;
          break;
        }
      }

      if (existingRoomId) {
        router.push(`/chat/${existingRoomId}`);
        return;
      }

      // room_type is CHECK-constrained to 'p2p' | 'support'.
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'p2p', created_by: viewerId })
        .select('id')
        .single();

      if (createError) throw createError;

      const { error: partError } = await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: viewerId },
        { room_id: newRoom.id, user_id: targetUserId },
      ]);

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      console.error('Error starting chat with user:', err);
      toast({ title: 'Unable to start chat', message: 'Please try again.', kind: 'error' });
    } finally {
      setStartingChat(false);
    }
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'User',
      sortValue: (u) => (u.full_name ?? u.email).toLowerCase(),
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.full_name ?? u.email} size={36} />
          <div className="min-w-0">
            <p className="truncate font-bold text-content-primary">
              {u.full_name ?? 'Unknown User'}
            </p>
            <p className="truncate text-sm text-content-tertiary">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'company_name',
      header: 'Company',
      sortValue: (u) => (u.company_name ?? '').toLowerCase(),
      render: (u) => (
        <span className="text-content-tertiary">{u.company_name ?? '—'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className="text-content-tertiary">{u.phone ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (u) => u.role,
      render: (u) => <Badge tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Joined',
      sortValue: (u) => u.created_at,
      render: (u) => (
        <span className="text-content-tertiary">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
            Change role
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Message ${u.full_name ?? u.email}`}
            disabled={startingChat || u.id === viewerId}
            onClick={() => void startChat(u.id)}
          >
            <MessageSquare size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or company…"
          className="w-full sm:w-80"
        />
        <Tabs
          tabs={tabs}
          active={roleFilter}
          onChange={(key) => setRoleFilter(key as Role | 'all')}
        />
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(u) => u.id}
        onRowClick={(u) => setSelected(u)}
        emptyState={
          <EmptyState
            icon={<Users size={26} />}
            title="No users found"
            message="Try a different search term or role filter."
          />
        }
      />

      <Modal
        open={selected != null}
        onClose={() => setSelected(null)}
        title="Change Role"
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface-page p-3.5">
              <Avatar name={selected.full_name ?? selected.email} size={46} />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-content-primary">
                  {selected.full_name ?? 'Unknown'}
                </p>
                <p className="truncate text-base text-content-tertiary">{selected.email}</p>
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-md font-bold uppercase tracking-[0.5px] text-content-primary">
                Select new role
              </p>
              <div className="space-y-2">
                {ALL_ROLES.map((role) => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  const isCurrent = selected.role === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      disabled={updating || isCurrent}
                      onClick={() => requestRoleChange(selected, role)}
                      className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] p-3.5 text-left transition-colors ${
                        isCurrent
                          ? 'border-primary bg-surface-tint'
                          : 'border-edge hover:bg-surface-page disabled:opacity-60'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-primary">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-bold text-content-primary">
                          {meta.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-content-tertiary">
                          {meta.description}
                        </span>
                      </span>
                      {isCurrent && <Badge tone="primary">Current</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              fullWidth
              loading={startingChat}
              disabled={selected.id === viewerId}
              onClick={() => void startChat(selected.id)}
            >
              <MessageSquare size={17} />
              Message User
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingAdminRole != null}
        onClose={() => setPendingAdminRole(null)}
        onConfirm={() => pendingAdminRole && void applyRoleChange(pendingAdminRole, 'admin')}
        title="Grant Admin Access"
        message={`Are you sure you want to grant admin privileges to ${
          pendingAdminRole?.full_name ?? pendingAdminRole?.email ?? 'this user'
        }?`}
        confirmLabel="Grant Admin"
        destructive
        loading={updating}
      />
    </div>
  );
}
