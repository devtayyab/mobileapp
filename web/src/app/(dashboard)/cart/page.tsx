import { requireRole } from '@/lib/auth';
import CartView from '@/components/CartView';

export default async function CartPage() {
  await requireRole(['b2b']);
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Cart</h1>
      <CartView />
    </div>
  );
}
