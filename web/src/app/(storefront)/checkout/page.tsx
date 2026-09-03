import { requireRole } from '@/lib/auth';
import CheckoutForm from '@/components/CheckoutForm';
import type { ShippingAddress } from '@/components/checkout/types';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const { profile } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);

  // profiles.address is jsonb; mobile prefills the form from it when present.
  const saved = (profile.address ?? null) as Partial<ShippingAddress> | null;

  return <CheckoutForm isB2B={profile.role === 'b2b'} initialAddress={saved} />;
}
