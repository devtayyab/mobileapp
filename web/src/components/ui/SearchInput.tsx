'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Mobile search bar recipe: radius 14, bg background.primary, 1px border. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-3.5 py-2.5',
        'focus-within:border-secondary',
        className
      )}
    >
      <Search size={18} className="shrink-0 text-content-tertiary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base text-content-primary outline-none placeholder:text-content-tertiary"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-content-tertiary hover:text-content-primary"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
