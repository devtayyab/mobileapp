'use client';

/** 1:1 conversation — port of mobile `app/chat/[id].tsx`. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, CheckCheck, MessageSquare, Send, User } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { fetchPresence } from './roomQueries';
import {
  SUPPORT_COUNTERPARTY_NAME,
  formatMessageDay,
  formatMessageTime,
  formatRelativeTime,
  isOnline,
  localeFor,
  roleLabel,
  roleTone,
  type ChatMessageRecord,
  type ParticipantProfile,
} from './types';

/** Mobile refreshes its own `profiles.is_online` heartbeat every 30s. */
const HEARTBEAT_MS = 30_000;

export function ChatRoomView({
  roomId,
  roomType,
  viewerId,
  counterparty,
  initialMessages,
}: {
  roomId: string;
  roomType: 'p2p' | 'support';
  viewerId: string;
  counterparty: ParticipantProfile | null;
  initialMessages: ChatMessageRecord[];
}) {
  const { t, language } = useLanguage();
  const locale = localeFor(language.code);
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessageRecord[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [presence, setPresence] = useState<ParticipantProfile | null>(counterparty);

  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Mark the counterparty's messages read. RLS policy
   * "Users can update received messages" (20260703120000) permits this only for
   * a `chat_participants` row of this room, and never for your own messages.
   */
  const markMessagesAsRead = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .eq('is_read', false)
      .neq('sender_id', viewerId);

    if (error) console.error('Error marking messages as read:', error);
  }, [roomId, viewerId]);

  const markReadRef = useRef(markMessagesAsRead);
  useEffect(() => {
    markReadRef.current = markMessagesAsRead;
  }, [markMessagesAsRead]);

  // Read receipts for whatever was already on screen when the room opened.
  useEffect(() => {
    void markMessagesAsRead();
  }, [markMessagesAsRead]);

  // Realtime: INSERTs append live, UPDATEs carry read receipts. One channel per
  // room; the deps are primitives so a re-render can never double-subscribe.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessageRecord;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // Drop the optimistic twin of our own just-sent message.
            const withoutOptimistic = prev.filter(
              (m) =>
                !(
                  m.id.startsWith('optimistic-') &&
                  m.sender_id === incoming.sender_id &&
                  m.message === incoming.message
                )
            );
            return [...withoutOptimistic, incoming];
          });

          if (incoming.sender_id !== viewerId) void markReadRef.current();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessageRecord;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m))
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, viewerId]);

  /**
   * Own-presence heartbeat, ported from mobile `startOnlineHeartbeat()`. It is
   * what `handle_chat_auto_response()` reads to decide whether an admin is
   * around, so a web-only admin must keep it fresh too.
   * `is_online` / `last_seen_at` are absent from `ProfileRow`, hence untyped.
   */
  useEffect(() => {
    const supabase = createClient() as unknown as SupabaseClient;

    const beat = async (online: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_online: online, last_seen_at: new Date().toISOString() })
        .eq('id', viewerId);

      if (error) console.error('Error updating presence:', error);
    };

    void beat(true);
    const interval = setInterval(() => void beat(true), HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      void beat(false);
    };
  }, [viewerId]);

  // Counterparty presence goes stale between renders; re-read it on the same cadence.
  useEffect(() => {
    if (!counterparty) return;

    const supabase = createClient() as unknown as SupabaseClient;
    let cancelled = false;

    const poll = async () => {
      const fresh = await fetchPresence(supabase, counterparty.id);
      if (!cancelled && fresh) setPresence((prev) => ({ ...(prev ?? counterparty), ...fresh }));
    };

    const interval = setInterval(() => void poll(), HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [counterparty]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: ChatMessageRecord = {
      id: optimisticId,
      room_id: roomId,
      sender_id: viewerId,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: viewerId, message: text })
        .select('*')
        .single();

      if (error) throw error;

      setMessages((prev) => {
        // The realtime INSERT may have landed first.
        if (prev.some((m) => m.id === data.id)) {
          return prev.filter((m) => m.id !== optimisticId);
        }
        return prev.map((m) => (m.id === optimisticId ? data : m));
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(text);
      toast({
        title: 'Message not sent',
        message: 'Please check your connection and try again.',
        kind: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const isSupportCounterparty = roomType === 'support' || presence?.role === 'admin';
  const displayName =
    presence?.full_name ??
    (roomType === 'support' ? SUPPORT_COUNTERPARTY_NAME : null) ??
    'Anonymous User';
  const role = presence?.role ?? (roomType === 'support' ? 'admin' : null);
  const online = isOnline(presence);

  // Group messages under a day heading, newest last.
  const groups = useMemo(() => {
    const out: { day: string; items: ChatMessageRecord[] }[] = [];
    for (const message of messages) {
      const day = formatMessageDay(message.created_at, locale);
      const tail = out[out.length - 1];
      if (tail && tail.day === day) tail.items.push(message);
      else out.push({ day, items: [message] });
    }
    return out;
  }, [messages, locale]);

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-edge bg-surface">
      <header className="flex items-center gap-3 border-b border-edge px-4 py-3">
        <Link
          href="/chat"
          aria-label={t.back ?? 'Back to conversations'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={18} />
        </Link>

        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl border border-edge',
            isSupportCounterparty ? 'bg-warning/10 text-warning' : 'bg-surface-tint text-primary'
          )}
        >
          {isSupportCounterparty ? <MessageSquare size={18} /> : <User size={18} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xl font-bold text-content-primary">{displayName}</p>
            {role && <Badge tone={roleTone(role)}>{roleLabel(role)}</Badge>}
          </div>
          {/* Presence comes from profiles.is_online / last_seen_at, which the
              heartbeat above maintains. Nothing is shown when there is no
              counterparty profile to read it from. */}
          {presence ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-content-tertiary">
              {online ? (
                <>
                  <span className="h-2 w-2 rounded-3xl bg-success" />
                  {t.online ?? 'Online'}
                </>
              ) : presence.last_seen_at ? (
                `${t.lastSeen ?? 'Last seen'} ${formatRelativeTime(presence.last_seen_at, locale)}`
              ) : (
                roleLabel(role)
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-content-tertiary">
              {roomType === 'support' ? 'App Support' : roleLabel(role)}
            </p>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tint text-primary">
              <MessageSquare size={26} />
            </span>
            <h3 className="text-2xl font-bold text-content-primary">
              {t.noMessagesYet ?? 'No messages yet'}
            </h3>
            <p className="max-w-sm text-lg text-content-tertiary">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <div key={group.day} className="flex flex-col gap-2">
                <p className="self-center rounded-3xl bg-surface-page px-3 py-1 text-xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
                  {group.day}
                </p>

                {group.items.map((message) => {
                  const mine = message.sender_id === viewerId;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                      className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                          mine
                            ? 'rounded-br-sm bg-primary text-white'
                            : 'rounded-bl-sm border border-edge bg-surface-page text-content-primary'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words text-lg">
                          {message.message}
                        </p>
                        <span
                          className={cn(
                            'mt-1 flex items-center justify-end gap-1 text-2xs',
                            mine ? 'text-white/70' : 'text-content-tertiary'
                          )}
                        >
                          {formatMessageTime(message.created_at, locale)}
                          {mine &&
                            (message.is_read ? (
                              <CheckCheck size={13} className="text-white" />
                            ) : (
                              <Check size={13} className="text-white/70" />
                            ))}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
        className="flex items-end gap-2.5 border-t border-edge px-4 py-3"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          rows={1}
          placeholder={t.typeYourMessage ?? 'Type your message...'}
          aria-label={t.typeYourMessage ?? 'Type your message'}
          className="max-h-28 min-h-[44px] flex-1 resize-y rounded-3xl border-[1.5px] border-edge bg-surface-page px-4 py-3 text-md text-content-primary outline-none transition-colors placeholder:text-content-tertiary focus:border-secondary"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label={t.send ?? 'Send message'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-content-tertiary"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
