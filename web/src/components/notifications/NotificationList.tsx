'use client';

/** Notification centre — port of mobile `app/notifications.tsx`. */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Info, ShoppingBag, Truck } from 'lucide-react';
import { useNotifications } from '@/providers/NotificationProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/database';

/** Mobile `getIcon()` — type is free-form text, so `info` is the fallback. */
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'new_order':
      return <ShoppingBag size={22} className="text-primary" />;
    case 'order_status':
      return <Truck size={22} className="text-success" />;
    case 'new_product':
      return <Bell size={22} className="text-warning" />;
    default:
      return <Info size={22} className="text-content-tertiary" />;
  }
}

/**
 * Mobile's tap target: orders list when the payload carries an order,
 * otherwise the product page. `payload` was added to `notifications` by a later
 * ALTER, so it can be null on older rows — those simply do not navigate.
 */
/** Mobile maps language codes onto Intl locales for timestamps. */
function localeFor(code: string) {
  switch (code) {
    case 'el':
      return 'el-GR';
    case 'fr':
      return 'fr-FR';
    case 'es':
      return 'es-ES';
    default:
      return 'en-US';
  }
}

function routeFor(notification: Notification): string | null {
  const payload = (notification.payload ?? {}) as { order_id?: string; product_id?: string };
  if (payload.order_id) return '/orders';
  if (payload.product_id) return `/product/${payload.product_id}`;
  return null;
}

export function NotificationList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t, language } = useLanguage();
  const router = useRouter();

  const locale = localeFor(language.code);

  const open = (notification: Notification) => {
    if (!notification.is_read) void markAsRead(notification.id);

    const href = routeFor(notification);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
            {t.notifications ?? 'Notifications'}
          </h1>
          <p className="mt-0.5 text-md text-content-tertiary">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : (t.allCaughtUp ?? 'You are all caught up')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-edge px-3 text-md font-bold text-content-tertiary transition-colors hover:text-primary"
          >
            <CheckCircle2 size={18} />
            {t.markAllRead ?? 'Mark all read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} />}
          title={t.noNotifications ?? 'No notifications yet'}
          message="Order updates and new arrivals will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification, index) => {
            const unread = !notification.is_read;

            return (
              <motion.li
                key={notification.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(index * 0.05, 0.3),
                }}
              >
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors hover:shadow-card',
                    unread
                      ? 'border-primary bg-surface-tint'
                      : 'border-edge bg-surface hover:border-edge-dark'
                  )}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-page">
                    <NotificationIcon type={notification.type} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-lg',
                        unread
                          ? 'font-extrabold text-content-primary'
                          : 'font-bold text-content-primary'
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-md text-content-tertiary">{notification.message}</p>
                    <p className="mt-1.5 text-xs text-content-tertiary">
                      {new Date(notification.created_at).toLocaleString(locale)}
                    </p>
                  </div>

                  {unread && (
                    <span
                      aria-label="Unread"
                      className="h-2 w-2 shrink-0 rounded-3xl bg-primary"
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
