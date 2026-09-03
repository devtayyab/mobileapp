'use client';

import { useEffect, useState, useTransition } from 'react';
import { MIN_QUERY } from './search-config';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { useLanguage } from '@/providers/LanguageProvider';

/** Mobile debounce from app/search.tsx (500ms, min 2 characters). */
const DEBOUNCE_MS = 500;


/**
 * Lives OUTSIDE the results Suspense boundary so typing never remounts the
 * input. Debounced query changes are pushed onto the URL (`?q=`), which
 * re-runs the server-side product query — keeping results shareable.
 */
export function SearchBox({ query }: { query: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const next = value.trim();
    if (next === query) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(
          next.length >= MIN_QUERY ? `/search?q=${encodeURIComponent(next)}` : '/search',
          { scroll: false }
        );
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, query, router]);

  return (
    <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-5">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h1 className="truncate text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {t.search ?? 'Search'}
        </h1>
        {pending && (
          <Loader2 size={18} className="shrink-0 animate-spin text-content-tertiary" />
        )}
      </div>

      <SearchInput
        value={value}
        onChange={setValue}
        placeholder={t.searchPlaceholder ?? 'Search products...'}
      />

      <p className="mt-2 text-sm text-content-tertiary">
        {t.enterAtLeast2Chars ?? 'Enter at least 2 characters to search'}
      </p>
    </div>
  );
}
