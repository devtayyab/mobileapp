import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CategoryEditor, type AdminCategoryRow } from '@/components/admin/CategoryEditor';

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/categories.tsx`.
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 *
 * Admins can read inactive categories: migration 20260115164339 replaced the
 * `is_active = true` read policy with `USING (true)` for authenticated users.
 */
export default async function AdminCategoriesPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, display_order, is_active')
    .order('display_order', { ascending: true });

  const categories = (data ?? []) as AdminCategoryRow[];
  const active = categories.filter((c) => c.is_active !== false).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Categories
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {categories.length.toLocaleString()} categor
          {categories.length === 1 ? 'y' : 'ies'} · {active.toLocaleString()} active
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-error bg-surface-tint p-3.5 text-md font-bold text-error">
          Could not load categories: {error.message}
        </p>
      )}

      <CategoryEditor initialCategories={categories} />
    </div>
  );
}
