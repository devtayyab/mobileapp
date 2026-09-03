import { cache } from 'react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component; middleware handles session refresh instead
          }
        },
      },
    }
  );
}

/**
 * Every column ProfileRow declares — narrower than `*` (which also pulled any
 * columns added to the table since) while still satisfying the `Profile` type
 * that requireRole() hands to callers.
 */
const PROFILE_COLUMNS =
  'id, email, full_name, phone, role, company_name, tax_id, address, is_online, last_seen_at, created_at, updated_at';

/**
 * Resolves the signed-in user and their profile.
 *
 * Wrapped in React `cache()` so it runs ONCE per request no matter how many
 * layouts/pages ask for it. Without this, a single navigation cost ~7 sequential
 * round trips to Supabase (middleware + root layout + group layout + page, each
 * doing auth.getUser() plus a profiles select), which is what made navigation
 * feel slow. Deduped it is 1 auth call + 1 query per request.
 *
 * `cache` is per-request, so this never leaks one user's profile into another's.
 */
export const getAdminProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single();

  return { user, profile: profile ?? null };
});
