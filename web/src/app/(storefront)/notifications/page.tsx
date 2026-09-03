import { requireRole } from '@/lib/auth';
import { NotificationList } from '@/components/notifications/NotificationList';

export const dynamic = 'force-dynamic';

/**
 * Notification centre — port of mobile `app/notifications.tsx`.
 * The rows themselves come from `useNotifications()`, which already owns the
 * realtime `notifications` subscription, so this page only gates access.
 */
export default async function NotificationsPage() {
  await requireRole(['customer', 'b2b', 'supplier', 'admin']);

  return <NotificationList />;
}
