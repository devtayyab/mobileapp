'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, MessageSquare, Store } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';

export function ProductSupplierCard({
  businessName,
  city,
  country,
  supplierUserId,
  viewerId,
}: {
  businessName: string | null;
  city: string | null;
  country: string | null;
  supplierUserId: string | null;
  viewerId: string | null;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const isOwnProduct = viewerId != null && viewerId === supplierUserId;

  /**
   * Ported 1:1 from mobile `startChatWithSupplier()`:
   *   1. fall back to a Platform Admin when the product has no supplier account
   *   2. look for an existing 'p2p' room that the viewer participates in whose
   *      other participant is the supplier
   *   3. otherwise create the room and insert both chat_participants rows
   *   4. navigate to /chat/<roomId>
   */
  const startChatWithSupplier = async () => {
    if (!viewerId) return;

    setStarting(true);

    // The generated Database type declares no relationships, so PostgREST
    // embedded filters (`chat_participants.user_id`) are not expressible in its
    // column unions. Drop to the untyped client for these three calls only.
    const supabase = createClient() as unknown as SupabaseClient;

    try {
      let recipientId = supplierUserId;

      if (!recipientId) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminProfile) recipientId = adminProfile.id as string;
      }

      if (!recipientId) {
        toast({
          title: 'Unable to start chat',
          message: 'No active recipient found for this product.',
          kind: 'error',
        });
        return;
      }

      if (viewerId === recipientId) {
        toast({
          title: 'Chat info',
          message: 'You cannot start a chat with yourself.',
          kind: 'info',
        });
        return;
      }

      // 1. Rooms of type p2p that the viewer participates in.
      const { data: rooms, error: findError } = await supabase
        .from('chat_rooms')
        .select('id, chat_participants!inner(user_id)')
        .eq('room_type', 'p2p')
        .eq('chat_participants.user_id', viewerId);

      if (findError) throw findError;

      // 2. Keep the one whose other participant is the supplier.
      let existingRoomId: string | null = null;
      for (const room of (rooms ?? []) as { id: string }[]) {
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', room.id);

        if (
          (participants ?? []).some(
            (p: { user_id: string | null }) => p.user_id === recipientId
          )
        ) {
          existingRoomId = room.id;
          break;
        }
      }

      if (existingRoomId) {
        router.push(`/chat/${existingRoomId}`);
        return;
      }

      // 3. Create the room. room_type is CHECK-constrained to 'p2p' | 'support'.
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'p2p', created_by: viewerId })
        .select('id')
        .single();

      if (createError) throw createError;

      const { error: partError } = await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: viewerId },
        { room_id: newRoom.id, user_id: recipientId },
      ]);

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      console.error('Error starting chat with supplier:', err);
      toast({
        title: 'Unable to start chat',
        message: 'Please try again.',
        kind: 'error',
      });
    } finally {
      setStarting(false);
    }
  };

  const chatButtonClass =
    'flex w-full items-center justify-center gap-2 rounded-md border border-warning/30 ' +
    'bg-warning/10 py-2.5 text-md font-bold text-warning transition-colors ' +
    'hover:bg-warning/20 disabled:opacity-60';

  return (
    <section className="rounded-2xl border border-edge bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-page text-primary">
          <Store size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-content-primary">
            {businessName ?? 'Marketplace supplier'}
          </p>
          {(city || country) && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-content-tertiary">
              <MapPin size={12} />
              {[city, country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {!isOwnProduct && (
        <div className="mt-3">
          {viewerId ? (
            <button
              type="button"
              onClick={() => void startChatWithSupplier()}
              disabled={starting}
              className={chatButtonClass}
            >
              <MessageSquare size={16} />
              {starting ? 'Opening chat…' : 'Chat with Supplier'}
            </button>
          ) : (
            <Link href="/login" className={chatButtonClass}>
              <MessageSquare size={16} />
              Sign in to chat with supplier
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
