import { getAdminProfile } from '@/lib/supabase/server';
import CartView from '@/components/CartView';

export const dynamic = 'force-dynamic';

/**
 * Mobile (`app/(tabs)/cart.tsx`) renders a sign-in prompt for guests instead of
 * erroring, so this route deliberately does NOT call requireRole — middleware
 * already gates it, and CartView renders the prompt if the session is missing.
 */
export default async function CartPage() {
  const { user, profile } = await getAdminProfile();

  return <CartView userId={user?.id ?? null} isB2B={profile?.role === 'b2b'} />;
}
