'use client';

/**
 * Switch control standing in for React Native's `<Switch>` on the supplier
 * setup screens (business settings store status, per-country shipping enable).
 */

import { cn } from '@/lib/cn';

export function SupplierToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name — the visible caption lives next to the control. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border border-edge transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
        checked ? 'bg-success' : 'bg-surface-tint',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-pill bg-white shadow-subtle transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
