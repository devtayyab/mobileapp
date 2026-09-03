import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CountryEditor, type AdminCountryRow } from '@/components/admin/CountryEditor';

export const dynamic = 'force-dynamic';

/**
 * Ported from mobile `app/admin/countries.tsx` ("Countries & VAT").
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 *
 * `countries` carries both an `is_active = true` read policy and an admin
 * `FOR ALL` policy (migration 20260615145100), so an admin sees inactive rows
 * too — the deactivated seed countries from 20260702130000 included.
 */
export default async function AdminCountriesPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('id, name, code, vat_percentage, vat_type, is_active')
    .order('name', { ascending: true });

  const countries = (data ?? []) as AdminCountryRow[];
  const active = countries.filter((c) => c.is_active !== false).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Countries &amp; VAT
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {countries.length.toLocaleString()} countr{countries.length === 1 ? 'y' : 'ies'} ·{' '}
          {active.toLocaleString()} active
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-error bg-surface-tint p-3.5 text-md font-bold text-error">
          Could not load countries: {error.message}
        </p>
      )}

      <CountryEditor initialCountries={countries} />
    </div>
  );
}
