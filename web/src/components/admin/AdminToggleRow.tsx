'use client';

import { cn } from '@/lib/cn';

/**
 * Web stand-in for the mobile `<Switch>` used by the admin CRUD editors
 * (categories / countries / couriers). The UI kit has no switch primitive and
 * must not be forked, so this lives next to the admin screens that need it.
 */
export function AdminToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border-[1.5px] border-edge bg-surface-page px-3.5 py-3',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span className="min-w-0">
        <span className="block text-md font-bold text-content-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-content-tertiary">{hint}</span>}
      </span>

      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            'peer h-6 w-11 cursor-pointer appearance-none rounded-3xl bg-edge transition-colors',
            'checked:bg-primary disabled:cursor-not-allowed',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
          )}
        />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-3xl bg-white shadow-subtle transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
