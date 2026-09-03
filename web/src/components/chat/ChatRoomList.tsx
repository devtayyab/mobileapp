'use client';

/** Conversation list — port of mobile `app/chat/index.tsx`. */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, MessageSquare, User } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge, Button, EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';
import { fetchChatRooms } from './roomQueries';
import {
  formatRelativeTime,
  localeFor,
  roleLabel,
  roleTone,
  roomTitle,
  type ChatRoomSummary,
} from './types';

export function ChatRoomList({
  initialRooms,
  viewerId,
  viewerIsAdmin,
}: {
  initialRooms: ChatRoomSummary[];
  viewerId: string;
  viewerIsAdmin: boolean;
}) {
  const { t, language } = useLanguage();
  const locale = localeFor(language.code);
  const router = useRouter();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<ChatRoomSummary[]>(initialRooms);
  const [startingSupport, setStartingSupport] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // Untyped for the embedded participant/profile select — see roomQueries.ts.
      const supabase = createClient() as unknown as SupabaseClient;
      setRooms(await fetchChatRooms(supabase, viewerId, viewerIsAdmin));
    } catch (err) {
      console.error('Error refreshing chat rooms:', err);
    }
  }, [viewerId, viewerIsAdmin]);

  // Kept in a ref so the realtime effect below never re-subscribes.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel(`chat-list-${viewerId}`)
      .on(
        'postgres_changes',
        // Any insert (new message) or update (read receipt) changes a room's
        // preview or unread badge, exactly as mobile's `chat_list_updates` does.
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => void refreshRef.current(), 300);
        }
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [viewerId]);

  /** Port of mobile `startSupportChat()`: one support room per creator. */
  const startSupportChat = async () => {
    setStartingSupport(true);

    const supabase = createClient();

    try {
      const { data: existing, error: findError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'support')
        .eq('created_by', viewerId)
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        router.push(`/chat/${existing.id}`);
        return;
      }

      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'support', created_by: viewerId })
        .select('id')
        .single();

      if (createError) throw createError;

      // Only the requester joins; an admin reads the room via the admin RLS branch.
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert({ room_id: newRoom.id, user_id: viewerId });

      if (partError) throw partError;

      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      console.error('Error starting support chat:', err);
      toast({
        title: 'Unable to start chat',
        message: 'We could not open a support conversation. Please try again.',
        kind: 'error',
      });
    } finally {
      setStartingSupport(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
            {t.conversations ?? 'Conversations'}
          </h1>
          <p className="mt-0.5 text-md text-content-tertiary">
            {viewerIsAdmin
              ? `${rooms.length} conversation${rooms.length === 1 ? '' : 's'} across the platform`
              : `${rooms.length} conversation${rooms.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {!viewerIsAdmin && (
          <Button onClick={() => void startSupportChat()} loading={startingSupport}>
            <MessageSquare size={16} />
            {t.chatWithSupport ?? 'Chat with support'}
          </Button>
        )}
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={26} />}
          title={t.noChatsYet ?? 'No chats yet'}
          message={
            viewerIsAdmin
              ? 'Customer and supplier conversations will appear here.'
              : 'Start a conversation with a supplier or reach out to support.'
          }
          action={
            !viewerIsAdmin ? (
              <Button onClick={() => void startSupportChat()} loading={startingSupport}>
                <MessageSquare size={16} />
                {t.chatWithSupport ?? 'Chat with support'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((room, index) => {
            const isSupport = room.room_type === 'support';
            const title = roomTitle(room, viewerIsAdmin);
            const role = room.other_participant?.role ?? (isSupport ? 'admin' : null);
            const label = roleLabel(role);
            const unread = room.unread_count;

            return (
              <motion.li
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(index * 0.05, 0.3),
                }}
              >
                <Link
                  href={`/chat/${room.id}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-edge-dark hover:shadow-card"
                >
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl border border-edge',
                      isSupport ? 'bg-warning/10 text-warning' : 'bg-surface-tint text-primary'
                    )}
                  >
                    {isSupport ? <MessageSquare size={20} /> : <User size={20} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-xl font-bold text-content-primary">
                        {title}
                      </p>
                      {label && <Badge tone={roleTone(role)}>{label}</Badge>}
                      {room.last_message && (
                        <span className="shrink-0 text-xs text-content-tertiary">
                          {formatRelativeTime(room.last_message.created_at, locale)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <p
                        className={cn(
                          'min-w-0 flex-1 truncate text-md',
                          unread > 0
                            ? 'font-bold text-content-primary'
                            : 'text-content-tertiary'
                        )}
                      >
                        {room.last_message
                          ? `${
                              room.last_message.sender_id === viewerId ? 'You: ' : ''
                            }${room.last_message.message}`
                          : t.noMessagesYet ?? 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-3xl bg-primary px-1.5 text-sm font-extrabold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
