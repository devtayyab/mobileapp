import { requireRole } from '@/lib/auth';
import CheckoutForm from '@/components/CheckoutForm';

export default async function CheckoutPage() {
  await requireRole(['b2b']);
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
