import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function getOrCreateSupplierId(
  supabase: SupabaseClient<Database>,
  userId: string,
  businessNameFallback: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: newId, error } = await supabase.rpc('create_supplier_profile', {
    p_business_name: businessNameFallback,
  });

  if (error || !newId) {
    throw new Error(error?.message ?? 'Failed to create supplier profile');
  }

  return newId;
}
