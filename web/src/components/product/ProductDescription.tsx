'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export function ProductDescription({ description }: { description: string | null }) {
  const { t } = useLanguage();

  return (
    <section className="space-y-2.5">
      <h2 className="text-xl font-bold text-content-primary">
        {t.description ?? 'Description'}
      </h2>
      <p className="whitespace-pre-line text-lg leading-6 text-content-tertiary">
        {description?.trim() ? description : 'No description provided for this product.'}
      </p>
    </section>
  );
}
