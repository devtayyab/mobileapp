'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast, type ToastKind } from './ToastProvider';
import type { Notification } from '@/types/database';

/** Mirrors contexts/NotificationContext.tsx: latest 50 + realtime INSERT stream. */
type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const routeFor = useCallback((n: Notification) => {
    const payload = (n.payload ?? {}) as { order_id?: string; product_id?: string };
    if (payload.order_id) return '/orders';
    if (payload.product_id) return `/product/${payload.product_id}`;
    return '/notifications';
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications(data ?? []);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime: prepend new rows and surface a toast, as mobile does.
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Notification;
          setNotifications((prev) => [row, ...prev]);
          toast({
            title: row.title,
            message: row.message,
            kind: (row.type as ToastKind) ?? 'info',
            onClick: () => router.push(routeFor(row)),
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, toast, router, routeFor]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
        markAsRead,
        markAllAsRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
