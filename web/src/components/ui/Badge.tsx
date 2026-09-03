import { cn } from '@/lib/cn';

/** Pill recipe: px-2.5 py-1, radius 20, 10-11px/800 uppercase, letter-spacing .5 */
export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}) {
  const TONES = {
    neutral: 'bg-surface-page text-content-tertiary',
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-3xl px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px]',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status colors are role-independent in the mobile palette.
 * Covers both vocabularies: order_status (pending|processing|confirmed|shipped|
 * delivered|cancelled|refunded) and shipment_status (pending|picked_up|
 * in_transit|out_for_delivery|delivered|failed).
 */
const STATUS_COLORS: Record<string, string> = {
  // order_status
  pending: 'bg-status-pending',
  processing: 'bg-status-processing',
  confirmed: 'bg-status-processing',
  shipped: 'bg-status-shipped',
  delivered: 'bg-status-delivered',
  cancelled: 'bg-status-cancelled',
  refunded: 'bg-status-refunded',
  // shipment_status extras
  picked_up: 'bg-status-processing',
  in_transit: 'bg-status-shipped',
  out_for_delivery: 'bg-status-shipped',
  failed: 'bg-status-cancelled',
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  /** Optional translated text; the color still keys off `status`. */
  label?: string;
  className?: string;
}) {
  const color = STATUS_COLORS[status?.toLowerCase()] ?? 'bg-content-tertiary';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-3xl px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-white',
        color,
        className
      )}
    >
      {label ?? status?.replace(/_/g, ' ')}
    </span>
  );
}
